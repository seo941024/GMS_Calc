const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ttf':  'font/ttf',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// worldID → 월드명 (NA/EU, best-effort, 모르면 fallback)
const WORLD_NAMES = {
  // NA 일반
  1:'Bera', 19:'Scania', 17:'Aurora',
  // NA 리부트(Heroic)
  45:'Kronos', 46:'Hyperion',
  // EU
  30:'Luna', 70:'Solis',
};
function worldName(id){ return WORLD_NAMES[id] || ('World #' + id); }

const NEXON_BASE = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';

/* ── 캐릭터 랭킹 조회 (서버사이드 스크래핑/프록시) ── */
async function lookupCharacter(name, reboot, region) {
  const reg = region === 'eu' ? 'eu' : 'na';
  const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };
  const lc = name.toLowerCase();

  // 1) overall 랭킹
  const overallUrl = `${NEXON_BASE}/${reg}?type=overall&id=weekly&reboot_index=${reboot ? 1 : 0}`
                   + `&page_index=1&character_name=${encodeURIComponent(name)}`;
  const r = await fetch(overallUrl, { headers });
  if (!r.ok) throw new Error('Nexon 응답 오류 ' + r.status);
  const data = await r.json();
  if (!data.ranks || data.ranks.length === 0) return null;
  const hit = data.ranks.find(c => (c.characterName||'').toLowerCase() === lc) || data.ranks[0];

  // 2) legion 랭킹 (유니온 레벨·전투력·랭킹) — 실패해도 무시
  let legionLevel = hit.legionLevel || 0;
  let legionPower = 0;
  let legionRank  = 0;
  try {
    const legionUrl = `${NEXON_BASE}/${reg}?type=legion&id=weekly&reboot_index=0`
                    + `&page_index=1&character_name=${encodeURIComponent(name)}`;
    const lr = await fetch(legionUrl, { headers });
    if (lr.ok) {
      const ld = await lr.json();
      const lhit = (ld.ranks || []).find(c => (c.characterName||'').toLowerCase() === lc);
      if (lhit) {
        legionLevel = lhit.legionLevel || lhit.legion_level || lhit.unionLevel || legionLevel;
        legionPower = lhit.legionPower || lhit.legionCombatPower || lhit.legion_power || lhit.unionPower || lhit.combatPower || 0;
        legionRank  = lhit.rank || lhit.legionRank || 0;
      }
    }
  } catch (_) {}

  return {
    name:        hit.characterName,
    level:       hit.level,
    exp:         hit.exp,
    job:         hit.jobName,
    world:       worldName(hit.worldID),
    worldID:     hit.worldID,
    rank:        hit.rank,
    legion:      legionLevel,
    legionPower: legionPower,
    legionRank:  legionRank,
    img:         hit.characterImgURL || '',
    reboot:      !!reboot,
    region:      region === 'eu' ? 'EU' : 'NA',
  };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);

  // ── API: /api/lookup?name=...&reboot=0|1 ──
  if (u.pathname === '/api/lookup') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const name   = (u.searchParams.get('name') || '').trim();
    const reboot = u.searchParams.get('reboot') === '1';
    const region = (u.searchParams.get('region') || 'na').toLowerCase();
    if (!name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok:false, error:'캐릭터명을 입력하세요.' }));
    }
    try {
      const info = await lookupCharacter(name, reboot, region);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (!info) return res.end(JSON.stringify({ ok:false, error:'캐릭터를 찾을 수 없습니다. (월드/리부트 구분 확인)' }));
      res.end(JSON.stringify({ ok:true, data:info }));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok:false, error:'조회 실패: ' + e.message }));
    }
    return;
  }

  // ── 정적 파일 ──
  let url = u.pathname === '/' ? '/index.html' : u.pathname;
  const filePath = path.join(ROOT, decodeURIComponent(url));
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, () => console.log(`GMS_WEEK_BOSS server running at http://localhost:${PORT}`));
