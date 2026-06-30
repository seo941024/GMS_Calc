/* =============================================
   calculators.js — HEXA / 해방 / 스타포스 / 보스HP / 포스
   ============================================= */

/* ═══════════════════════════════════════════════
   HEXA 계산기 — 노드 구조 재편
   Skill Node (×2, max30) / Mastery (×4, max10) /
   Boost (×4, max10) / Common: Sol Janus·Sol Hecate (×2, max30)
═══════════════════════════════════════════════ */
function _hxLoad(key, names, maxLv) {
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  return names.map((n, i) => ({ name:n, cur: stored[i]?.cur ?? 0, tgt: stored[i]?.tgt ?? maxLv, max: maxLv }));
}
function _hxSave(key, nodes) {
  localStorage.setItem(key, JSON.stringify(nodes.map(n => ({ cur:n.cur, tgt:n.tgt }))));
}

let hxSkill = (() => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.hexaSkill) || '[]');
  const defaults = [1, 0];
  return ['스킬 노드 1', '스킬 노드 2'].map((n, i) => ({ name:n, cur: stored[i]?.cur ?? defaults[i], tgt: stored[i]?.tgt ?? 30, max: 30 }));
})();
let hxMastery = _hxLoad(STORAGE_KEYS.hexaMastery, ['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], 30);
let hxBoost   = _hxLoad(STORAGE_KEYS.hexaBoost,   ['부스트 1','부스트 2','부스트 3','부스트 4'], 30);
let hxCommon  = _hxLoad(STORAGE_KEYS.hexaCommon,  ['솔 야누스', '솔 헤카테'], 30);

function renderNodeList(nodes, containerId, storageKey, icons=[]) {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';
  nodes.forEach((sk, i) => {
    const div = document.createElement('div');
    div.className = 'hexa-support-item';
    const iconHtml = icons[i]
      ? `<img src="${icons[i]}" class="hx-node-icon" alt="" />`
      : '';
    div.innerHTML = `
      <span class="hx-node-name">${iconHtml}${sk.name}</span>
      <span style="font-size:.75rem;color:var(--text-sub)">현재</span>
      <input class="inp" type="number" value="${sk.cur}" min="0" max="${sk.max}" data-i="${i}" data-field="cur" />
      <span style="font-size:.75rem;color:var(--text-sub)">목표</span>
      <input class="inp" type="number" value="${sk.tgt}" min="0" max="${sk.max}" data-i="${i}" data-field="tgt" />`;
    div.querySelectorAll('input[data-i]').forEach(inp => {
      // 입력은 자유롭게, blur/Enter(change) 때만 클램프·저장
      inp.addEventListener('change', () => {
        const v = Math.max(0, Math.min(sk.max, parseInt(inp.value) || 0));
        inp.value = v;
        nodes[i][inp.dataset.field] = v;
        _hxSave(storageKey, nodes);
      });
    });
    list.appendChild(div);
  });
}

function renderAllHexaLists() {
  const ch  = typeof state !== 'undefined' ? state.chars[state.activeChar] : null;
  const job = ch?.fetched?.job || (typeof JOB_LIST !== 'undefined' && JOB_LIST[ch?.jobIdx]?.name) || '';
  const jd  = (typeof HEXA_JOB_DATA !== 'undefined' && HEXA_JOB_DATA[job]) || (typeof HEXA_DEFAULT_DATA !== 'undefined' ? HEXA_DEFAULT_DATA : { folder:null, skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테'] });

  const ico = (n) => jd.folder ? `images/skill/${jd.folder}/${n}.png` : null;

  hxSkill.forEach((n,i)   => { if(jd.skill[i])   n.name = jd.skill[i]; });
  hxMastery.forEach((n,i) => { if(jd.mastery[i]) n.name = jd.mastery[i]; });
  hxBoost.forEach((n,i)   => { if(jd.boost[i])   n.name = jd.boost[i]; });

  // 공용 코어 개수가 직업마다 다를 수 있으므로 동적으로 맞춤
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.hexaCommon) || '[]');
  while (hxCommon.length < jd.common.length)  hxCommon.push({ name: jd.common[hxCommon.length], cur: stored[hxCommon.length]?.cur ?? 0, tgt: stored[hxCommon.length]?.tgt ?? 30, max: 30 });
  if (hxCommon.length > jd.common.length) hxCommon.length = jd.common.length;
  hxCommon.forEach((n,i)  => { if(jd.common[i])  n.name = jd.common[i]; });

  // 공용 코어 아이콘 — 3번째부터는 직업 폴더 이미지 13번 사용
  const commonIcoFull = [
    'images/skill/Common/sol_janus.png',
    'images/skill/Common/sol_hecate.png',
    ...jd.common.slice(2).map((_, i) => ico(15 + i)),
  ];

  renderNodeList(hxSkill,   'hxSkillList',   STORAGE_KEYS.hexaSkill,   [ico(1), ico(2)]);
  renderNodeList(hxMastery, 'hxMasteryList', STORAGE_KEYS.hexaMastery, [ico(5), ico(6), ico(7), ico(8)]);
  renderNodeList(hxBoost,   'hxBoostList',   STORAGE_KEYS.hexaBoost,   [ico(9), ico(10), ico(11), ico(12)]);
  renderNodeList(hxCommon,  'hxCommonList',  STORAGE_KEYS.hexaCommon,  commonIcoFull);
}

document.getElementById('hxCalc').addEventListener('click', () => {
  const haveSE  = parseInt(document.getElementById('hxHaveSE').value)  || 0;
  const haveSEF = parseInt(document.getElementById('hxHaveSEF').value) || 0;
  let totalSE = 0, totalSEF = 0;

  function addNodes(nodes, costTable) {
    nodes.forEach(sk => {
      const cur = Math.max(0, Math.min(sk.max, sk.cur));
      const tgt = Math.max(cur, Math.min(sk.max, sk.tgt));
      if (tgt > cur) { const { se, sef } = hexaCumulative(costTable, cur, tgt); totalSE += se; totalSEF += sef; }
    });
  }

  addNodes(hxSkill,   HEXA_SKILL_COSTS);
  addNodes(hxMastery, HEXA_MASTERY_COSTS);
  addNodes(hxBoost,   HEXA_BOOST_COSTS);
  addNodes(hxCommon,  HEXA_COMMON_COSTS);

  // 전체 통계 (0→max, 0→cur, cur→max)
  let totalAllSE = 0, totalAllSEF = 0;
  let usedSE = 0, usedSEF = 0;
  let remainSE = 0, remainSEF = 0;
  function addStats(nodes, costTable) {
    nodes.forEach(sk => {
      const cur = Math.max(0, Math.min(sk.max, sk.cur));
      { const r = hexaCumulative(costTable, 0, sk.max); totalAllSE += r.se; totalAllSEF += r.sef; }
      { const r = hexaCumulative(costTable, 0, cur);    usedSE   += r.se; usedSEF   += r.sef; }
      { const r = hexaCumulative(costTable, cur, sk.max); remainSE += r.se; remainSEF += r.sef; }
    });
  }
  addStats(hxSkill,   HEXA_SKILL_COSTS);
  addStats(hxMastery, HEXA_MASTERY_COSTS);
  addStats(hxBoost,   HEXA_BOOST_COSTS);
  addStats(hxCommon,  HEXA_COMMON_COSTS);

  const enough  = haveSE >= totalSE;
  const enoughF = haveSEF >= totalSEF;
  const res = document.getElementById('hxResult');
  const SE_ICON  = `<img src="images/skill/Common/sol_erda.png"  class="hx-res-icon" alt="">`;
  const SEF_ICON = `<img src="images/skill/Common/fragment.png" class="hx-res-icon" alt="">`;
  res.innerHTML = `
    <div class="hexa-result-row"><span class="rl">총 요구 솔 에르다</span><span class="rv">${SE_ICON}${totalAllSE.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">총 요구 솔 에르다 조각</span><span class="rv">${SEF_ICON}${totalAllSEF.toLocaleString()} 개</span></div>
    <div class="hexa-result-row" style="margin-top:6px"><span class="rl">이미 사용한 솔 에르다</span><span class="rv">${SE_ICON}${usedSE.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">이미 사용한 솔 에르다 조각</span><span class="rv">${SEF_ICON}${usedSEF.toLocaleString()} 개</span></div>
    <div class="hexa-result-row" style="margin-top:6px"><span class="rl">만렙까지 남은 솔 에르다</span><span class="rv">${SE_ICON}${remainSE.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">만렙까지 남은 솔 에르다 조각</span><span class="rv">${SEF_ICON}${remainSEF.toLocaleString()} 개</span></div>
    <div class="hx-result-sep"></div>
    <div class="hexa-result-label">필요량 계산 결과</div>
    <div class="hexa-result-row"><span class="rl">필요 솔 에르다</span><span class="rv">${SE_ICON}${totalSE.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">필요 솔 에르다 조각</span><span class="rv">${SEF_ICON}${totalSEF.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">보유 솔 에르다</span><span class="rv">${SE_ICON}${haveSE.toLocaleString()} 개</span></div>
    <div class="hexa-result-row"><span class="rl">보유 솔 에르다 조각</span><span class="rv">${SEF_ICON}${haveSEF.toLocaleString()} 개</span></div>
    <div class="hexa-result-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
      <span class="rl">솔 에르다 부족량</span>
      <span class="rv ${enough?'hp-suf':'ng'}">${enough?'요구량 충족':(totalSE-haveSE).toLocaleString()+' 개 부족'}</span>
    </div>
    <div class="hexa-result-row">
      <span class="rl">솔 에르다 조각 부족량</span>
      <span class="rv ${enoughF?'hp-suf':'ng'}">${enoughF?'요구량 충족':(totalSEF-haveSEF).toLocaleString()+' 개 부족'}</span>
    </div>
    <div style="margin-top:10px;font-size:.75rem;color:var(--text-sub);line-height:1.6">
      ※ 비용은 근삿값입니다. 실제 게임과 차이가 있을 수 있습니다.
    </div>`;
});

renderAllHexaLists();

/* 보유 솔 에르다 max=20 실시간 강제 */
(function() {
  const seInp = document.getElementById('hxHaveSE');
  if (!seInp) return;
  seInp.addEventListener('change', () => {
    seInp.value = Math.max(0, Math.min(20, parseInt(seInp.value) || 0));
  });
})();

