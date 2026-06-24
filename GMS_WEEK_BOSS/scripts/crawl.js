/* GMS_WEEK_BOSS/scripts/crawl.js
   GitHub Actions에서 실행 — 넥슨 API fetch → Redis 저장
*/
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const NEXON_BASE = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';
const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

const HEROIC_WORLDS = new Set([45, 46, 70]);
const WORLD_NAMES = {
  1:'Bera', 19:'Scania', 17:'Aurora',
  45:'Kronos', 46:'Hyperion',
  30:'Luna', 70:'Solis',
};

async function fetchPage(reg, type, reboot, page) {
  try {
    const url = `${NEXON_BASE}/${reg}?type=${type}&id=weekly&reboot_index=${reboot}&page_index=${page}`;
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) return [];
    const d = await r.json();
    return d.ranks || [];
  } catch { return []; }
}

async function crawlType(reg, type, reboot, maxPages = 300, concurrency = 15) {
  const result = {};
  for (let start = 1; start <= maxPages; start += concurrency) {
    const pages = [];
    for (let p = start; p < start + concurrency && p <= maxPages; p++) pages.push(p);
    const batches = await Promise.all(pages.map(p => fetchPage(reg, type, reboot, p)));
    let anyResult = false;
    for (const ranks of batches) {
      if (ranks.length === 0) continue;
      anyResult = true;
      for (const c of ranks) {
        const key = (c.characterName || '').toLowerCase();
        if (!key) continue;
        result[key] = result[key] || {};
        if (type === 'overall') {
          result[key].worldRank = c.rank;
          result[key].worldID   = c.worldID;
          result[key].world     = WORLD_NAMES[c.worldID] || '';
          result[key].job       = c.jobName || '';
        }
        if (type === 'job')    result[key].jobRankWorld  = c.rank;
        if (type === 'legion') {
          result[key].legionRank  = c.rank;
          result[key].legionLevel = c.legionLevel || c.unionLevel || 0;
          result[key].legionPower = c.legionPower || c.legionCombatPower || c.combatPower || 0;
        }
      }
    }
    if (!anyResult) break;
    console.log(`  ${reg}/${type}/reboot=${reboot} — ${start}~${start + concurrency - 1}페이지 완료`);
  }
  return result;
}

function merge(base, patch) {
  for (const [k, v] of Object.entries(patch)) {
    base[k] = Object.assign(base[k] || {}, v);
  }
}

// tracked 캐릭터 개별 조회
async function lookupTracked(name, region) {
  const reg = region === 'eu' ? 'eu' : 'na';
  const lc = name.toLowerCase();

  const fetchRank = (type, rb) =>
    fetch(`${NEXON_BASE}/${reg}?type=${type}&id=weekly&reboot_index=${rb}&page_index=1&character_name=${encodeURIComponent(name)}`, { headers: HEADERS })
      .then(r => r.ok ? r.json() : null).catch(() => null);

  const [od0, od1] = await Promise.all([fetchRank('overall', 0), fetchRank('overall', 1)]);
  const findHit = d => d && d.ranks && d.ranks.find(c => (c.characterName || '').toLowerCase() === lc);
  const hit = findHit(od0) || findHit(od1);
  if (!hit) return null;

  const ri = HEROIC_WORLDS.has(hit.worldID) ? 1 : 0;

  const [ld, jd] = await Promise.all([
    fetchRank('legion', 0),
    fetchRank('job', ri),
  ]);

  const lhit = ld && (ld.ranks || []).find(c => (c.characterName || '').toLowerCase() === lc);
  const jhit = jd && (jd.ranks || []).find(c => (c.characterName || '').toLowerCase() === lc);

  return {
    worldRank:    hit.rank || 0,
    worldID:      hit.worldID,
    world:        WORLD_NAMES[hit.worldID] || '',
    job:          hit.jobName || '',
    jobRankWorld: jhit ? jhit.rank : 0,
    legionRank:   lhit ? lhit.rank : 0,
    legionLevel:  lhit ? (lhit.legionLevel || lhit.unionLevel || 0) : 0,
    legionPower:  lhit ? (lhit.legionPower || lhit.combatPower || 0) : 0,
  };
}

// 히스토리 스냅샷 저장
function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

async function pushSnapshot(key, snap) {
  let arr = [];
  const raw = await redis.get('hist:' + key);
  if (raw) arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(arr)) arr = [];
  const last = arr[arr.length - 1];
  if (last && last.date === snap.date) arr[arr.length - 1] = snap;
  else arr.push(snap);
  arr = arr.slice(-180);
  await redis.set('hist:' + key, JSON.stringify(arr));
}

async function main() {
  console.log('=== GMS 랭킹 크롤러 시작 ===');

  const MAX = 300;

  // ── 1) 전체 랭킹 크롤링 ──
  const [naWorld0, naWorld1, naJob0, naJob1, naLegion,
         euWorld0, euWorld1, euJob0,  euJob1,  euLegion] = await Promise.all([
    crawlType('na', 'overall', 0, MAX),
    crawlType('na', 'overall', 1, MAX),
    crawlType('na', 'job',     0, MAX),
    crawlType('na', 'job',     1, MAX),
    crawlType('na', 'legion',  0, MAX),
    crawlType('eu', 'overall', 0, MAX),
    crawlType('eu', 'overall', 1, MAX),
    crawlType('eu', 'job',     0, MAX),
    crawlType('eu', 'job',     1, MAX),
    crawlType('eu', 'legion',  0, MAX),
  ]);

  const naData = {};
  merge(naData, naWorld0); merge(naData, naWorld1);
  merge(naData, naJob0);   merge(naData, naJob1);
  merge(naData, naLegion);

  const euData = {};
  merge(euData, euWorld0); merge(euData, euWorld1);
  merge(euData, euJob0);   merge(euData, euJob1);
  merge(euData, euLegion);

  console.log(`크롤링 완료: NA ${Object.keys(naData).length}명, EU ${Object.keys(euData).length}명`);

  if (Object.keys(naData).length > 0 || Object.keys(euData).length > 0) {
    const ts = Date.now();
    const pipe = redis.pipeline();
    for (const [name, data] of Object.entries(naData)) {
      pipe.set(`rnk:na:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }
    for (const [name, data] of Object.entries(euData)) {
      pipe.set(`rnk:eu:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }
    await pipe.exec();
    console.log('Redis 랭킹 저장 완료!');
  }

  // ── 2) tracked 캐릭터 개별 조회 + 스냅샷 ──
  let tracked = [];
  try { tracked = await redis.smembers('tracked') || []; } catch { }
  console.log(`tracked 캐릭터: ${tracked.length}명`);

  let ok = 0, fail = 0;
  for (const entry of tracked) {
    const parts  = String(entry).split('|');
    const region = parts[1] || 'na';
    const reboot = parts[2] === '1';
    const name   = parts.slice(3).join('|');
    const lc     = name.toLowerCase();
    const histKey = `${region}_${reboot ? 'r' : 'n'}_${lc}`;

    try {
      // Redis에 랭킹 데이터 없으면 개별 조회
      const cached = await redis.get(`rnk:${region}:${lc}`);
      if (!cached) {
        const info = await lookupTracked(name, region);
        if (info) {
          const ts = Date.now();
          await redis.set(`rnk:${region}:${lc}`, JSON.stringify({ ...info, ts }), { ex: 60 * 60 * 25 });
          console.log(`  개별조회 완료: ${name}`);
        }
      }

      // 스냅샷은 overall API로 exp 가져오기
      const snapData = await fetch(
        `${NEXON_BASE}/${region}?type=overall&id=weekly&reboot_index=${reboot ? 1 : 0}&page_index=1&character_name=${encodeURIComponent(name)}`,
        { headers: HEADERS }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      const hit = snapData && (snapData.ranks || []).find(c => (c.characterName || '').toLowerCase() === lc);
      if (hit) {
        await pushSnapshot(histKey, {
          date: todayStr(), ts: Date.now(),
          level: hit.level, exp: Number(hit.exp) || 0,
          img: hit.characterImgURL || '', job: hit.jobName || '',
        });
        ok++;
      } else {
        fail++;
      }
    } catch (e) {
      console.error(`  실패: ${name} —`, e.message);
      fail++;
    }
  }

  console.log(`스냅샷 완료 — ok: ${ok}, fail: ${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });