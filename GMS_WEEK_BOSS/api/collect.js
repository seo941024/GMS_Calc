/* =============================================
   api/collect.js — Vercel Cron (매일 자동 실행)
   1) 전체 랭킹 크롤링 → Redis 저장 (world/job/legion rank)
   2) 추적 캐릭터 exp 스냅샷 누적
   ============================================= */
const { histKey, todayStr, getRedis, pushSnapshot, lookupCharacter } = require('./_lib');

const NEXON_BASE = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';
const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

// 병렬로 페이지 fetch
async function fetchPage(reg, type, reboot, page) {
  try {
    const url = `${NEXON_BASE}/${reg}?type=${type}&id=weekly&reboot_index=${reboot}&page_index=${page}`;
    const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const d = await r.json();
    return d.ranks || [];
  } catch { return []; }
}

// 한 타입 전체 크롤 (최대 maxPages 페이지, 동시 concurrency개)
async function crawlType(reg, type, reboot, maxPages = 200, concurrency = 10) {
  const result = {};
  for (let start = 1; start <= maxPages; start += concurrency) {
    const pages = [];
    for (let p = start; p < start + concurrency && p <= maxPages; p++) pages.push(p);
    const batches = await Promise.all(pages.map(p => fetchPage(reg, type, reboot, p)));
    let anyResult = false;
    for (let i = 0; i < batches.length; i++) {
      const ranks = batches[i];
      if (ranks.length === 0) continue;
      anyResult = true;
      for (const c of ranks) {
        const key = (c.characterName || '').toLowerCase();
        if (!key) continue;
        result[key] = result[key] || {};
        if (type === 'world')  result[key].worldRank    = c.rank;
        if (type === 'job')    result[key].jobRankWorld  = c.rank;
        if (type === 'legion') {
          result[key].legionRank  = c.rank;
          result[key].legionLevel = c.legionLevel || c.unionLevel || 0;
          result[key].legionPower = c.legionPower || c.legionCombatPower || c.combatPower || 0;
        }
        if (type === 'overall') {
          result[key].overallRank = c.rank;
          result[key].worldID     = c.worldID;
          result[key].world       = c.worldName || '';
          result[key].job         = c.jobName   || '';
        }
      }
    }
    if (!anyResult) break; // 더 이상 데이터 없음
  }
  return result;
}

// 두 객체 머지 (덮어쓰지 않고 병합)
function merge(base, patch) {
  for (const [k, v] of Object.entries(patch)) {
    base[k] = Object.assign(base[k] || {}, v);
  }
  return base;
}

// Redis 파이프라인 안전 실행 (비어있으면 스킵)
async function safeExec(pipe) {
  if (!pipe || pipe.length === 0) return [];
  return await pipe.exec();
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ ok: false, error: 'unauthorized' });
      return;
    }
  }

  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ ok: false, error: 'Redis 미설정' });
    return;
  }

  // ── 1) 랭킹 크롤링 ──
  const MAX = 300; // 페이지당 100명 × 300 = 30,000명

  console.log('[collect] 랭킹 크롤링 시작');

  const [naWorld0, naWorld1, naJob0, naJob1, naLegion,
         euWorld0, euWorld1, euJob0,  euJob1,  euLegion] = await Promise.all([
    crawlType('na', 'world',  0, MAX),
    crawlType('na', 'world',  1, MAX),
    crawlType('na', 'job',    0, MAX),
    crawlType('na', 'job',    1, MAX),
    crawlType('na', 'legion', 0, MAX),
    crawlType('eu', 'world',  0, MAX),
    crawlType('eu', 'world',  1, MAX),
    crawlType('eu', 'job',    0, MAX),
    crawlType('eu', 'job',    1, MAX),
    crawlType('eu', 'legion', 0, MAX),
  ]);

  const naData = {};
  merge(naData, naWorld0); merge(naData, naWorld1);
  merge(naData, naJob0);   merge(naData, naJob1);
  merge(naData, naLegion);

  const euData = {};
  merge(euData, euWorld0); merge(euData, euWorld1);
  merge(euData, euJob0);   merge(euData, euJob1);
  merge(euData, euLegion);

  console.log(`[collect] naData: ${Object.keys(naData).length}명, euData: ${Object.keys(euData).length}명`);

  // ✅ Redis에 저장 (파이프라인 — 비어있으면 안전하게 스킵)
  const ts = Date.now();
  const naKeys = Object.entries(naData);
  const euKeys = Object.entries(euData);

  if (naKeys.length > 0 || euKeys.length > 0) {
    const pipe = redis.pipeline();
    for (const [name, data] of naKeys) {
      pipe.set(`rnk:na:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }
    for (const [name, data] of euKeys) {
      pipe.set(`rnk:eu:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }
    await safeExec(pipe);
    console.log(`[collect] Redis 저장 완료 (na: ${naKeys.length}, eu: ${euKeys.length})`);
  } else {
    console.warn('[collect] 경고: 크롤링 결과가 없어 Redis 저장 스킵');
  }

  // ── 2) 추적 캐릭터 exp 스냅샷 ──
  let tracked = [];
  try {
    tracked = await redis.smembers('tracked') || [];
  } catch (e) {
    console.error('[collect] tracked 로드 실패:', e.message);
  }

  let ok = 0, fail = 0;
  for (const entry of tracked) {
    const parts  = String(entry).split('|');
    const region = parts[1] || 'na';
    const reboot = parts[2] === '1';
    const name   = parts.slice(3).join('|');
    try {
      const info = await lookupCharacter(name, reboot, region);
      if (info) {
        await pushSnapshot(redis, histKey(info.name, region, reboot), {
          date: todayStr(), ts: Date.now(), level: info.level,
          exp: Number(info.exp) || 0, img: info.img || '', job: info.job || '',
        });
        ok++;
      } else {
        fail++;
      }
    } catch (e) {
      console.error(`[collect] 스냅샷 실패 (${name}):`, e.message);
      fail++;
    }
  }

  console.log(`[collect] 스냅샷 완료 — ok: ${ok}, fail: ${fail}`);

  res.status(200).json({
    ok: true,
    ranked: { na: naKeys.length, eu: euKeys.length },
    collected: ok,
    failed: fail,
  });
};