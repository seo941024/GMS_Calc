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
  const stored = JSON.parse(localStorage.getItem('hx_skill') || '[]');
  const defaults = [1, 0]; // 스킬 노드 1은 전직 시 기본 1렙
  return ['스킬 노드 1', '스킬 노드 2'].map((n, i) => ({ name:n, cur: stored[i]?.cur ?? defaults[i], tgt: stored[i]?.tgt ?? 30, max: 30 }));
})();
let hxMastery = _hxLoad('hx_mastery', ['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], 30);
let hxBoost   = _hxLoad('hx_boost',   ['부스트 1','부스트 2','부스트 3','부스트 4'], 30);
let hxCommon  = _hxLoad('hx_common',  ['솔 야누스', '솔 헤카테'], 30);

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
      const clampInp = () => {
        const v = parseInt(inp.value);
        if (!isNaN(v)) inp.value = Math.max(0, Math.min(sk.max, v));
      };
      inp.addEventListener('input', clampInp);
      inp.addEventListener('change', () => {
        clampInp();
        nodes[i][inp.dataset.field] = Math.max(0, Math.min(sk.max, parseInt(inp.value) || 0));
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
  const stored = JSON.parse(localStorage.getItem('hx_common') || '[]');
  while (hxCommon.length < jd.common.length)  hxCommon.push({ name: jd.common[hxCommon.length], cur: stored[hxCommon.length]?.cur ?? 0, tgt: stored[hxCommon.length]?.tgt ?? 30, max: 30 });
  if (hxCommon.length > jd.common.length) hxCommon.length = jd.common.length;
  hxCommon.forEach((n,i)  => { if(jd.common[i])  n.name = jd.common[i]; });

  // 공용 코어 아이콘 — 3번째부터는 직업 폴더 이미지 13번 사용
  const commonIcoFull = [
    'images/skill/Common/sol_janus.webp',
    'images/skill/Common/sol_hecate.webp',
    ...jd.common.slice(2).map((_, i) => ico(15 + i)),
  ];

  renderNodeList(hxSkill,   'hxSkillList',   'hx_skill',   [ico(1), ico(2)]);
  renderNodeList(hxMastery, 'hxMasteryList', 'hx_mastery', [ico(5), ico(6), ico(7), ico(8)]);
  renderNodeList(hxBoost,   'hxBoostList',   'hx_boost',   [ico(9), ico(10), ico(11), ico(12)]);
  renderNodeList(hxCommon,  'hxCommonList',  'hx_common',  commonIcoFull);
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
  const SE_ICON  = `<img src="images/skill/Common/sol_erda.webp"  class="hx-res-icon" alt="">`;
  const SEF_ICON = `<img src="images/skill/Common/fragment.webp" class="hx-res-icon" alt="">`;
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
  seInp.addEventListener('input', () => {
    const v = parseInt(seInp.value);
    if (!isNaN(v) && v > 20) seInp.value = 20;
    if (!isNaN(v) && v < 0)  seInp.value = 0;
  });
})();

/* ═══════════════════════════════════════════════
   해방 계산기 — 제네시스 (어둠의 흔적)
═══════════════════════════════════════════════ */
function nextThursday(from) {
  const d = new Date(from || new Date());
  const diff = (4 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const genState = (() => {
  const def = { quest:0, held:0, pass:false, party:1, sel:{}, startDate: nextThursday() };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('lib_genesis_v2') || '{}')); }
  catch { return def; }
})();
function saveGen() { localStorage.setItem('lib_genesis_v2', JSON.stringify(genState)); }

function bossInfo(id) { return BOSS_DATA.find(b => b.id === id) || { name:id, img:'' }; }
function fmtTrace(n) { return Number(n).toLocaleString(); }

const QUEST_BOSS_IMG = {
  '반 레온':   'images/bosses/vanleon.webp',
  '아카이럼':  'images/bosses/akaiyrum.webp',
  '매그너스':  'images/bosses/magnus.webp',
  '스우':      'images/bosses/suu.webp',
  '데미안':    'images/bosses/demian.webp',
  '윌':        'images/bosses/will.webp',
  '루시드':    'images/bosses/lucid.webp',
  '진 힐라':   'images/bosses/jinhilla.webp',
};

function genTraceSums() {
  const mult = genState.pass ? GENESIS_PASS_MULT : 1;
  let weekly = 0;
  for (const id in TRACE_YIELD) {
    if (id === 'blackmage') continue;
    const sel  = genState.sel[id] || {};
    const diff = sel.diff || 'none';
    if (diff === 'none') continue;
    const party = Math.max(1, sel.party || 1);
    weekly += Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party);
  }
  return { weekly, mult };
}

function renderGenesis() {
  const panel = document.getElementById('lib-genesis');
  const { weekly, mult } = genTraceSums();
  const avgPerWeek = weekly;

  const held       = Math.max(0, genState.held);
  const questCum   = (GENESIS_QUESTS[genState.quest] || GENESIS_QUESTS[0]).cum;
  const totalSpent = questCum + held;
  const remaining  = Math.max(0, GENESIS_TARGET - totalSpent);
  const pct        = Math.min(100, Math.round(totalSpent / GENESIS_TARGET * 100));
  const weeksLeft = avgPerWeek > 0 ? Math.ceil(remaining / avgPerWeek) : Infinity;
  const daysLeft  = isFinite(weeksLeft) ? weeksLeft * 7 : null;

  const startDate = genState.startDate || nextThursday();
  const targetDate = (() => {
    if (!isFinite(weeksLeft)) return '—';
    const d = new Date(startDate);
    const daysToThu = (4 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + daysToThu);
    d.setDate(d.getDate() + weeksLeft * 7);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const durationStr = daysLeft != null
    ? `${daysLeft}일`
    : '—';

  // 퀘스트 select 옵션
  const questOpts = GENESIS_QUESTS.map((qq, i) =>
    `<option value="${i}" ${i===genState.quest?'selected':''}>${qq.name}</option>`
  ).join('');

  // 보스 카드
  const bossCards = Object.keys(TRACE_YIELD).map(id => {
    const info  = bossInfo(id);
    const sel   = genState.sel[id] || {};
    const diff  = sel.diff  || 'none';
    const party = Math.max(1, sel.party || 1);
    const cleared = !!sel.cleared;
    const yld   = diff === 'none' ? 0 : Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party);
    const active = diff !== 'none';

    const diffOpts = ['none', ...Object.keys(TRACE_YIELD[id])].map(d => {
      return `<option value="${d}" ${diff===d?'selected':''}>${DIFF_META[d]?.label || d}</option>`;
    }).join('');

    return `
      <div class="gen-boss ${active?'on':''}" data-id="${id}">
        <div class="boss-thumb"><img src="${info.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none">BOSS</span></div>
        <div class="gen-boss__body">
          <div class="gen-boss__top">
            <span class="gen-boss__name">${info.name}</span>
          </div>
          <div class="gen-boss__row2">
            <select class="sel gen-boss__diff" data-id="${id}">${diffOpts}</select>
            <div class="party-stepper gen-boss__party" data-id="${id}">
              <button class="pm" ${party<=1?'disabled':''}>−</button>
              <span class="party-stepper__val">${party}</span>
              <button class="pp" ${party>=6?'disabled':''}>+</button>
            </div>
          </div>
          <div class="gen-boss__row3">
            <label class="gen-boss__ck">
              <input type="checkbox" class="gen-boss__cb" data-id="${id}" ${cleared?'checked':''}/>
              <span>금주 격파</span>
            </label>
            <span class="gen-boss__trace ${active?'on':''}">+${fmtTrace(yld)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const clearedCount = Object.values(genState.sel).filter(s => s && s.on).length;

  panel.innerHTML = `
    <div class="gen-main-layout">
      <!-- 좌측: 설정 + 보스 목록 -->
      <div class="gen-left">
        <div class="card gen-inputs">
          <div class="gen-input-row">
            <div class="field">
              <label class="field__label">시작 날짜</label>
              <input class="inp gen-inp" id="genStartDate" type="date" value="${startDate}" />
            </div>
            <div class="field" style="flex:1.5">
              <label class="field__label">현재 퀘스트</label>
              <select class="sel gen-inp" id="genQuestSel">${questOpts}</select>
            </div>
          </div>
          <div class="gen-input-row" style="margin-top:12px;align-items:stretch">
            <div class="gen-cfg-card">
              <img class="gen-cfg-card__img" src="images/icons/Trace_of_darkness.webp" alt="">
              <div class="gen-cfg-card__body">
                <div class="gen-cfg-card__title">보유 어둠의 흔적</div>
                <input class="inp" id="genHeld" type="number" min="0" max="${TRACE_HOLD_MAX}" value="${held}" />
              </div>
            </div>
            <div class="gen-cfg-card gen-cfg-card--pass${genState.pass?' on':''}">
              <img class="gen-cfg-card__img" src="images/icons/Genesis.png" alt="">
              <div class="gen-cfg-card__body">
                <div class="gen-cfg-card__title">제네시스 패스</div>
                <label class="gen-switch gen-pass-toggle">
                  <input type="checkbox" id="genPass" ${genState.pass?'checked':''} />
                  <span class="gen-switch__track"><span class="gen-switch__thumb"></span></span>
                  <span class="gen-switch__label">${genState.pass?'ON':'OFF'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__title">보스 / 난이도 <span class="gen-cleared">${clearedCount}개 선택</span></div>
          <div class="gen-bosses">${bossCards}</div>
        </div>
      </div>

      <!-- 우측: 통계 패널 -->
      <div class="card gen-stat-panel">
        <div class="lib-progress" style="margin-bottom:6px"><div class="lib-progress__fill" style="width:${pct}%"></div></div>
        <div class="lib-pct" style="margin-bottom:14px">${pct}% · ${fmtTrace(totalSpent)} / ${fmtTrace(GENESIS_TARGET)}</div>

        <div class="gen-stat2"><span>필요 흔적</span><b>${fmtTrace(GENESIS_TARGET)}</b></div>
        <div class="gen-stat2"><span>퀘스트 소모</span><b>${fmtTrace(questCum)}</b></div>
        <div class="gen-stat2"><span>보유 흔적</span><b>${fmtTrace(held)}</b></div>
        <div class="gen-stat2"><span>누적 진행</span><b>${fmtTrace(totalSpent)}</b></div>
        <div class="gen-stat2"><span>남은 흔적</span><b>${fmtTrace(remaining)}</b></div>
        <div class="gen-stat2-div"></div>
        <div class="gen-stat2"><span>주간 흔적</span><b>${fmtTrace(weekly)}</b></div>
        <div class="gen-stat2-div"></div>
        <div class="gen-stat2"><span>남은 기간</span><b>${durationStr}</b></div>

        <div class="gen-date-wrap">
          <div class="gen-date-label">예상 해방 날짜</div>
          <div class="gen-date-big">${targetDate}</div>
        </div>
      </div>
    </div>`;

  // 이벤트
  document.getElementById('genHeld').addEventListener('change', e => {
    genState.held = Math.max(0, Math.min(TRACE_HOLD_MAX, parseInt(e.target.value) || 0));
    saveGen(); renderGenesis();
  });
  document.getElementById('genPass').addEventListener('change', e => {
    genState.pass = e.target.checked; saveGen(); renderGenesis();
  });
  document.getElementById('genStartDate').addEventListener('change', e => {
    genState.startDate = e.target.value || nextThursday(); saveGen(); renderGenesis();
  });
  document.getElementById('genQuestSel').addEventListener('change', e => {
    genState.quest = parseInt(e.target.value); saveGen(); renderGenesis();
  });
  panel.querySelectorAll('.gen-boss__party').forEach(ps => {
    const id = ps.dataset.id;
    ps.querySelector('.pm').addEventListener('click', () => {
      const cur = genState.sel[id] || {};
      if ((cur.party||1) > 1) { genState.sel[id] = { ...cur, party:(cur.party||1)-1 }; saveGen(); renderGenesis(); }
    });
    ps.querySelector('.pp').addEventListener('click', () => {
      const cur = genState.sel[id] || {};
      if ((cur.party||1) < 6) { genState.sel[id] = { ...cur, party:(cur.party||1)+1 }; saveGen(); renderGenesis(); }
    });
  });
  panel.querySelectorAll('.gen-boss__cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      genState.sel[id] = { ...(genState.sel[id] || {}), cleared: cb.checked };
      saveGen();
    });
  });
  panel.querySelectorAll('.gen-boss__diff').forEach(s => {
    s.addEventListener('change', () => {
      const id = s.dataset.id;
      genState.sel[id] = { ...(genState.sel[id] || {}), diff: s.value };
      saveGen(); renderGenesis();
    });
  });
}

function renderDestiny() {
  const panel = document.getElementById('lib-destiny');
  panel.innerHTML = `
    <div class="card" style="text-align:center;padding:48px 24px">
      <div style="font-size:1rem;font-weight:800;margin-bottom:8px">데스티니 해방</div>
      <div class="lib-info">데스티니 해방 계산기는 준비 중입니다.</div>
    </div>`;
}

// 탭 전환
document.querySelectorAll('.lib-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.lib-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('lib-' + tab.dataset.lib).classList.add('active');
  });
});

renderGenesis();
renderDestiny();

/* ═══════════════════════════════════════════════
   스타포스 시뮬레이터 (직접 강화 모드)
═══════════════════════════════════════════════ */

/* 단계별 파괴율 라벨 계산 (shining 반영) */
function _sfDestLabel(star, stage, isShining) {
  const p = getSfProb(star, isShining, false, stage);
  if (p.dest <= 0) return '파괴 없음';
  return `파괴 ${(p.dest * 100).toFixed(2)}%`;
}

/* 단계 드롭다운 그리드 빌드 */
function sfBuildStageGrid() {
  const grid = document.getElementById('sfStageGrid');
  if (!grid) return;
  const shining = _sfGetEvent() === 'shining';

  const rows = [];
  for (let s = 15; s <= 21; s++) {
    const curStage = _sfStages[s] || 1;
    const maxStage = (s <= 17) ? 4 : 4;

    const opts = [];
    for (let st = 1; st <= maxStage; st++) {
      const isProt = s <= 17 && st === 4;
      const label  = isProt ? '파괴방지' : `${st}단계`;
      opts.push(`<option value="${st}" ${curStage===st?'selected':''}>${label}</option>`);
    }

    const p = (s <= 17 && curStage === 4)
      ? getSfProb(s, shining, true, 1)
      : getSfProb(s, shining, false, curStage);

    const succPct = (p.succ * 100).toFixed(2);
    const failPct = (p.fail * 100).toFixed(2);
    const destPct = (p.dest * 100).toFixed(2);

    rows.push(`
      <div class="sf-stage-row2" data-star="${s}">
        <span class="sf-stage-lbl2">${s}→${s+1}</span>
        <select class="sel sf-stage-sel" data-star="${s}">${opts.join('')}</select>
        <span class="sf-stage-info">
          <span class="sf-stage-prob--succ">성공 ${succPct}%</span>
          <span class="sf-stage-prob--fail">실패 ${failPct}%</span>
          <span class="sf-stage-prob--dest">파괴 ${destPct}%</span>
        </span>
      </div>`);
  }
  grid.innerHTML = rows.join('');

  grid.querySelectorAll('.sf-stage-sel').forEach(sel => {
    sel.addEventListener('change', () => {
      _sfStages[+sel.dataset.star] = +sel.value;
      sfBuildStageGrid();
    });
  });
}

/* 상태 */
let _sfState = { star: 0, cost: 0, attempts: 0, destroys: 0, log: [] };
let _sfStages = { 15:1, 16:1, 17:1, 18:1, 19:1, 20:1, 21:1 };
let _sfAutoTimer = null;

function _sfGetEvent()    { return document.querySelector('#sfEventGroup .sf-toggle.active')?.dataset.val || 'none'; }
function _sfGetMvp()      { return parseFloat(document.querySelector('#sfMvpGroup .sf-toggle.active')?.dataset.val || '0'); }
function _sfGetLevel()    { return parseInt(document.getElementById('sfLevel').value) || 200; }
function _sfGetFrom()     { return parseInt(document.getElementById('sfFrom').value) || 0; }
function _sfGetTo()       { return Math.min(30, parseInt(document.getElementById('sfTo').value) || 22); }

function _sfGetCfg() {
  const star = _sfState.star;
  const btn  = _sfStages[star] || 1;
  const isShining   = _sfGetEvent() === 'shining';
  const isProtected = (star >= 15 && star <= 17) && btn === 4;
  const stage       = isProtected ? 1 : btn;
  return { level: _sfGetLevel(), mvpDiscount: _sfGetMvp(), isShining, isProtected, stage };
}

function sfEnhanceOnce() {
  const from = _sfGetFrom();
  const to   = _sfGetTo();
  if (_sfState.star >= to) { sfStopAuto(); return false; }

  const star = _sfState.star;
  const cfg  = _sfGetCfg();
  const cost = calcSfCost(cfg.level, star, cfg.mvpDiscount, cfg.isShining, cfg.isProtected, cfg.stage, 0);
  _sfState.cost += cost;
  _sfState.attempts++;

  const p = getSfProb(star, cfg.isShining, cfg.isProtected, cfg.stage);
  const r = Math.random();

  let result, nextStar;
  if (r < p.succ) {
    nextStar = star + 1;
    result = { type: 'success', from: star, to: nextStar, cost };
  } else if (r < p.succ + p.fail) {
    nextStar = star > 0 ? star - 1 : star;
    if (star <= 14 || star === 0) nextStar = star; // 0~14성은 유지
    // 실제론 연속실패 시 강제하락 있지만 jaehoom 로직은 단순 유지
    nextStar = star; // 실패 = 유지
    result = { type: 'fail', from: star, to: star, cost };
  } else {
    _sfState.destroys++;
    nextStar = getDestStar(star);
    result = { type: 'destroy', from: star, to: nextStar, cost };
  }

  _sfState.star = nextStar;
  _sfState.log.unshift(result);
  if (_sfState.log.length > 30) _sfState.log.pop();

  sfRenderResult();
  return _sfState.star < to;
}

function sfRenderResult() {
  const el = document.getElementById('sfResult');
  if (!el) return;
  const to = _sfGetTo();
  const done = _sfState.star >= to;

  // 누적 메소 별도 영역
  const spentWrap = document.getElementById('sfSpentWrap');
  const spentVal  = document.getElementById('sfSpentVal');
  if (_sfState.attempts > 0) {
    if (spentWrap) spentWrap.style.display = 'block';
    if (spentVal)  spentVal.textContent = fmtMeso(_sfState.cost);
  }

  const starDisp = `<div class="sf-star-display">${_sfState.star}★ <span style="font-size:.9rem;color:var(--text-sub)">/ ${to}★</span></div>`;

  const stats = `
    <div class="sf-res-item"><span class="sf-res-label">강화 횟수</span><span class="sf-res-val">${_sfState.attempts.toLocaleString()} 회</span></div>
    <div class="sf-res-item"><span class="sf-res-label">파괴 횟수</span><span class="sf-res-val" style="color:${_sfState.destroys>0?'var(--danger)':'var(--text)'}">${_sfState.destroys} 회</span></div>
    ${done ? '<div class="sf-res-item" style="color:var(--success);font-weight:700;text-align:center;padding:10px 0">목표 달성!</div>' : ''}`;

  const logHtml = _sfState.log.slice(0, 15).map(l => {
    const cls  = l.type === 'success' ? 'log-success' : l.type === 'destroy' ? 'log-destroy' : 'log-fail';
    const icon = l.type === 'success' ? '✦' : l.type === 'destroy' ? '💥' : '✕';
    const desc = l.type === 'success' ? `${l.from}★ → ${l.to}★ 성공` : l.type === 'destroy' ? `${l.from}★ 파괴 → ${l.to}★` : `${l.from}★ 실패`;
    return `<div class="sf-log-row ${cls}"><span class="sf-log-icon">${icon}</span><span class="sf-log-desc">${desc}</span><span class="sf-log-cost">${fmtMeso(l.cost)}</span></div>`;
  }).join('');

  el.innerHTML = starDisp + stats + (logHtml ? `<div class="sf-log">${logHtml}</div>` : '');
}

function sfStopAuto() {
  if (_sfAutoTimer) { clearInterval(_sfAutoTimer); _sfAutoTimer = null; }
  const btn = document.getElementById('sfBtnAuto');
  if (btn) { btn.textContent = '자동 강화'; btn.classList.remove('sbtn--danger'); btn.classList.add('sbtn--primary'); }
}

function initStarforce() {
  if (!document.getElementById('sfStageGrid')) return;

  // 초기 별 위치를 sfFrom 값으로 세팅
  _sfState = { star: _sfGetFrom(), cost: 0, attempts: 0, destroys: 0, log: [] };
  sfBuildStageGrid();

  // 토글 그룹 처리
  document.querySelectorAll('.sf-toggle-group').forEach(grp => {
    grp.querySelectorAll('.sf-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        grp.querySelectorAll('.sf-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sfBuildStageGrid(); // 샤이닝 상태 바뀌면 파괴율 다시 계산
      });
    });
  });

  // sfFrom 바뀌면 현재 별 리셋
  document.getElementById('sfFrom')?.addEventListener('change', () => {
    _sfState.star = _sfGetFrom();
    sfRenderResult();
  });

  // 강화 1회
  document.getElementById('sfBtn1')?.addEventListener('click', () => {
    sfStopAuto();
    sfEnhanceOnce();
  });

  // 자동 강화
  document.getElementById('sfBtnAuto')?.addEventListener('click', () => {
    if (_sfAutoTimer) { sfStopAuto(); return; }
    const btn = document.getElementById('sfBtnAuto');
    btn.textContent = '■ 중지';
    btn.classList.remove('sbtn--primary'); btn.classList.add('sbtn--danger');
    _sfAutoTimer = setInterval(() => {
      const cont = sfEnhanceOnce();
      if (!cont) sfStopAuto();
    }, 80);
  });

  // 초기화
  document.getElementById('sfBtnReset')?.addEventListener('click', () => {
    sfStopAuto();
    _sfState = { star: _sfGetFrom(), cost: 0, attempts: 0, destroys: 0, log: [] };
    document.getElementById('sfResult').innerHTML = '<p class="empty">강화 버튼을 눌러주세요.</p>';
    document.getElementById('sfSpentWrap').style.display = 'none';
  });

  // 기댓값 보기
  document.getElementById('sfBtnExpected')?.addEventListener('click', sfShowExpected);

  // 양방향 메소 ↔ 상위% 이벤트 (한 번만 등록)
  document.getElementById('sfInputMeso').addEventListener('input', () => {
    if (!_sfLastCosts.length) return;
    const val = parseInt(document.getElementById('sfInputMeso').value, 10);
    if (!val || val <= 0) return;
    const pct = _sfPctFromMeso(val);
    document.getElementById('sfInputPct').value = pct.toFixed(3);
    _sfShowResult(pct, val);
  });
  document.getElementById('sfInputPct').addEventListener('input', () => {
    if (!_sfLastCosts.length) return;
    const pct = parseFloat(document.getElementById('sfInputPct').value);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    const meso = _sfMesoFromPct(pct);
    document.getElementById('sfInputMeso').value = meso;
    _sfShowResult(pct, meso);
  });
  document.getElementById('sfInputDestroyCount').addEventListener('input', () => {
    if (!_sfLastDestroys.length) return;
    const val = parseInt(document.getElementById('sfInputDestroyCount').value, 10);
    if (isNaN(val) || val < 0) return;
    const pct = _sfDestroyPctFromCount(val);
    document.getElementById('sfInputDestroyPct').value = pct.toFixed(3);
    _sfShowDestroyResult(pct, val);
  });
  document.getElementById('sfInputDestroyPct').addEventListener('input', () => {
    if (!_sfLastDestroys.length) return;
    const pct = parseFloat(document.getElementById('sfInputDestroyPct').value);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    const count = _sfDestroyCountFromPct(pct);
    document.getElementById('sfInputDestroyCount').value = count;
    _sfShowDestroyResult(pct, count);
  });

  // 탭 스위칭
  document.querySelectorAll('.sf-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sf-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.sftab;
      document.getElementById('sfRightExpected').style.display  = mode === 'expected'  ? '' : 'none';
      document.getElementById('sfRightSimulate').style.display  = mode === 'simulate'  ? '' : 'none';
      document.getElementById('sfBtnWrapExpected').style.display = mode === 'expected' ? '' : 'none';
      document.getElementById('sfBtnWrapSimulate').style.display = mode === 'simulate' ? 'grid' : 'none';
    });
  });
  // 초기 상태
  document.getElementById('sfBtnWrapSimulate').style.display = 'none';
}

let _sfChart        = null;
let _sfDestroyChart = null;
let _sfLastCosts    = [];
let _sfLastDestroys = [];

function _sfHighlightBar(val) {
  if (!_sfChart) return;
  const p99 = _sfLastCosts[Math.floor(_sfLastCosts.length * 0.99)] || 1;
  const BINS = 40;
  const colors = Array(BINS).fill('rgba(139,92,246,0.45)');
  const binIdx = Math.floor(val / (p99 / BINS));
  if (binIdx >= 0 && binIdx < BINS) colors[binIdx] = 'rgba(246,199,68,0.9)';
  _sfChart.data.datasets[0].backgroundColor = colors;
  _sfChart.update('none');
}

function _sfDestroyPctFromCount(count) {
  const N = _sfLastDestroys.length;
  let lo = 0, hi = N;
  while (lo < hi) { const m = (lo+hi)>>1; if (_sfLastDestroys[m] < count) lo=m+1; else hi=m; }
  return lo / N * 100;
}

function _sfDestroyCountFromPct(pct) {
  const N = _sfLastDestroys.length;
  const idx = Math.min(N - 1, Math.max(0, Math.round(pct / 100 * N)));
  return _sfLastDestroys[idx];
}

function _sfShowDestroyResult(luckPct, count) {
  const resEl = document.getElementById('sfDestroyResult');
  if (!resEl) return;
  const cls = luckPct <= 25 ? 'lucky' : luckPct >= 75 ? 'unlucky' : '';
  resEl.innerHTML = `<div class="sf-my-result">
    <span class="sf-my-result__tag ${cls}">상위 ${luckPct.toFixed(3)}%</span>
    <span class="sf-my-result__sep"> = </span>
    <span class="sf-my-result__meso">${count}개</span>
  </div>`;
}

function _sfPctFromMeso(val) {
  const N = _sfLastCosts.length;
  let lo = 0, hi = N;
  while (lo < hi) { const m = (lo+hi)>>1; if (_sfLastCosts[m] < val) lo=m+1; else hi=m; }
  return lo / N * 100;
}

function _sfMesoFromPct(pct) {
  const N = _sfLastCosts.length;
  const idx = Math.min(N - 1, Math.max(0, Math.round(pct / 100 * N)));
  return _sfLastCosts[idx];
}

function _sfShowResult(luckPct, mesoVal) {
  const resEl = document.getElementById('sfMyMesoResult');
  if (!resEl) return;
  const cls = luckPct <= 25 ? 'lucky' : luckPct >= 75 ? 'unlucky' : '';
  resEl.innerHTML = `<div class="sf-my-result">
    <span class="sf-my-result__tag ${cls}">상위 ${luckPct.toFixed(3)}%</span>
    <span class="sf-my-result__sep"> = </span>
    <span class="sf-my-result__meso">${fmtMeso(mesoVal)}</span>
  </div>`;
  _sfHighlightBar(mesoVal);
}

function sfShowExpected() {
  const from = _sfGetFrom();
  const to   = _sfGetTo();
  if (from >= to) { alert('목표 성이 현재 성보다 높아야 합니다.'); return; }

  const cfg = {
    level: _sfGetLevel(), current: from, target: to,
    mvpDiscount: _sfGetMvp(), isShining: _sfGetEvent() === 'shining',
    stages: { ..._sfStages }
  };

  const N = 20_000;
  const costs = [], destroyArr = [];
  let totalDestroy = 0;
  for (let i = 0; i < N; i++) {
    const r = sfRunOnce(cfg);
    costs.push(r.cost);
    destroyArr.push(r.destroys);
    totalDestroy += r.destroys;
  }
  costs.sort((a, b) => a - b);
  destroyArr.sort((a, b) => a - b);
  _sfLastCosts    = costs;
  _sfLastDestroys = destroyArr;

  const mean = costs.reduce((s, c) => s + c, 0) / N;
  const p99  = costs[Math.floor(N * 0.99)];
  const avgDestroy = (totalDestroy / N);

  /* 히스토그램 버킷 40개, p99 범위 */
  const BINS = 40;
  const step = p99 / BINS;
  const buckets = Array(BINS).fill(0);
  costs.forEach(c => { const idx = Math.floor(c / step); if (idx < BINS) buckets[idx]++; });
  const labels = buckets.map((_, i) => fmtMeso(Math.round(step * (i + 0.5))));


  const canvas = document.getElementById('sfChart');
  if (_sfChart) { _sfChart.destroy(); _sfChart = null; }
  _sfChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '빈도',
        data: buckets,
        backgroundColor: 'rgba(139,92,246,0.55)',
        borderColor: 'rgba(167,139,250,0.8)',
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `소모 메소 ≈ ${labels[items[0].dataIndex]}`,
            label: item  => `${item.raw.toLocaleString()}회 (${(item.raw/N*100).toFixed(1)}%)`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(200,190,240,.6)', maxRotation: 45, font: { size: 9 }, maxTicksLimit: 10 },
          grid: { color: 'rgba(255,255,255,.05)' }
        },
        y: {
          ticks: { color: 'rgba(200,190,240,.6)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,.08)' }
        }
      }
    }
  });

  /* 파괴 횟수 분포 차트 */
  const maxDest = Math.max(...destroyArr);
  const destBuckets = Array(maxDest + 1).fill(0);
  destroyArr.forEach(d => destBuckets[d]++);
  const destLabels = destBuckets.map((_, i) => `${i}개`);
  const destCanvas = document.getElementById('sfDestroyChart');
  if (_sfDestroyChart) { _sfDestroyChart.destroy(); _sfDestroyChart = null; }
  _sfDestroyChart = new Chart(destCanvas, {
    type: 'bar',
    data: {
      labels: destLabels,
      datasets: [{
        label: '빈도',
        data: destBuckets,
        backgroundColor: 'rgba(246,99,99,0.55)',
        borderColor: 'rgba(246,139,139,0.8)',
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `파괴 ${items[0].label}`,
            label: item  => `${item.raw.toLocaleString()}회 (${(item.raw/N*100).toFixed(1)}%)`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(200,190,240,.6)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,.05)' }
        },
        y: {
          ticks: { color: 'rgba(200,190,240,.6)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,.08)' }
        }
      }
    }
  });

  /* 메소 bidir 평균 세팅 */
  const avgCost = Math.round(mean);
  const avgPct  = _sfPctFromMeso(avgCost);
  document.getElementById('sfInputMeso').value = avgCost;
  document.getElementById('sfInputPct').value  = avgPct.toFixed(3);
  _sfShowResult(avgPct, avgCost);

  /* 파괴 bidir 평균 세팅 */
  const avgDest    = Math.round(avgDestroy);
  const avgDestPct = _sfDestroyPctFromCount(avgDest);
  document.getElementById('sfInputDestroyCount').value = avgDest;
  document.getElementById('sfInputDestroyPct').value   = avgDestPct.toFixed(3);
  _sfShowDestroyResult(avgDestPct, avgDest);

  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════════════════
   큐브 시뮬레이터
═══════════════════════════════════════════════ */
const CUBE_PARTS = ["무기","엠블렘","보조무기(포스실드, 소울링 제외)","포스실드, 소울링","방패","모자","상의","한벌옷","하의","신발","장갑","망토","벨트","어깨장식","얼굴장식","눈장식","귀고리","반지","펜던트","기계심장"];
const CUBE_MESO  = { red: 12_000_000, black: 22_000_000 };

function _cubeLineProb(lineOpts, option) {
  const total = lineOpts.reduce((s, o) => s + o.probability, 0);
  if (!total) return 0;
  const m = /^(STR|DEX|INT|LUK) \+(\d+)%$/.exec(option);
  return lineOpts
    .filter(o => o.option === option || (m && o.option === `올스탯 +${m[2]}%`))
    .reduce((s, o) => s + o.probability, 0) / total;
}

function _cubeExactP(lineData, goals) {
  const n = goals.length;
  if (!n) return 0;
  const lines = ['line1','line2','line3'].map(k => lineData[k] || []);
  const p = lines.map(opts => goals.map(g => _cubeLineProb(opts, g)));

  // 가능한 모든 단사함수 goals→lines 열거
  const injections = [];
  if (n === 1) {
    for (let i = 0; i < 3; i++) injections.push([i]);
  } else if (n === 2) {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (i !== j) injections.push([i, j]);
  } else {
    [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]].forEach(s => injections.push(s));
  }

  const m = injections.length;
  let result = 0;
  for (let mask = 1; mask < (1 << m); mask++) {
    const chosen = [];
    for (let b = 0; b < m; b++) if (mask & (1 << b)) chosen.push(b);
    const sign = chosen.length % 2 === 1 ? 1 : -1;

    // 각 line에 요구되는 goal index Set 구성
    const req = [new Set(), new Set(), new Set()];
    for (const bi of chosen) {
      const inj = injections[bi];
      for (let k = 0; k < n; k++) req[inj[k]].add(k);
    }

    // 같은 line에 서로 다른 option string이 요구되면 불가능
    let prob = 1, valid = true;
    for (let l = 0; l < 3; l++) {
      const reqs = [...req[l]];
      if (!reqs.length) continue;
      const strs = [...new Set(reqs.map(k => goals[k]))];
      if (strs.length > 1) { valid = false; break; }
      prob *= p[l][reqs[0]];
    }
    if (valid) result += sign * prob;
  }
  return result;
}

let _cubeData     = null;
let _cubeRunning  = false;
let _cubeStop     = false;
let _cubeUseCount = 0;
let _cubeSucc     = 0;

async function _loadCubeData() {
  if (_cubeData) return _cubeData;
  _cubeData = window.CUBE_DATA;
  return _cubeData;
}

function _cubeGetLevelRange(lv) {
  if (lv >= 120 && lv <= 200) return '120~200';
  if (lv >= 201 && lv <= 250) return '201~250';
  return null;
}

const _CUBE_RENAME_160 = {
  "STR +12%":"STR +13%","DEX +12%":"DEX +13%","INT +12%":"INT +13%","LUK +12%":"LUK +13%",
  "공격력 +12%":"공격력 +13%","마력 +12%":"마력 +13%","크리티컬 확률 +12%":"크리티컬 확률 +13%",
  "데미지 +12%":"데미지 +13%","올스탯 +9%":"올스탯 +10%","STR +9%":"STR +10%",
  "DEX +9%":"DEX +10%","INT +9%":"INT +10%","LUK +9%":"LUK +10%",
  "공격력 +9%":"공격력 +10%","마력 +9%":"마력 +10%","크리티컬 확률 +9%":"크리티컬 확률 +10%",
  "데미지 +9%":"데미지 +10%","올스탯 +6%":"올스탯 +7%",
  "최대 HP +12%":"최대 HP +13%","최대 HP +9%":"최대 HP +10%",
  "최대 MP +12%":"최대 MP +13%","최대 MP +9%":"최대 MP +10%",
};

function _cubeIsLv160() {
  const lv = parseInt(document.getElementById('cubeLevel').value);
  return lv >= 160 && lv <= 200;
}

function _cubeRenameOpt(name) {
  return (_cubeIsLv160() && _CUBE_RENAME_160[name]) || name;
}

function _cubeApplyRename(lineData) {
  if (!lineData || !_cubeIsLv160()) return lineData;
  const rename = arr => arr ? arr.map(o => ({ option: _CUBE_RENAME_160[o.option] || o.option, probability: o.probability })) : arr;
  return { line1: rename(lineData.line1), line2: rename(lineData.line2), line3: rename(lineData.line3) };
}

function _weightedRandom(options) {
  const total = options.reduce((s, o) => s + o.probability, 0);
  let rand = Math.random() * total;
  for (const o of options) { rand -= o.probability; if (rand <= 0) return o.option; }
  return options[options.length-1].option;
}

function _cubeGetLineData() {
  if (!_cubeData) return null;
  const type  = document.querySelector('.cube-type-btn.active')?.dataset.type || 'red';
  const part  = document.getElementById('cubePart').value;
  const range = _cubeGetLevelRange(parseInt(document.getElementById('cubeLevel').value));
  if (!part || !range) return null;
  const lineData = _cubeData[type]?.[range]?.[part];
  if (!lineData) return null;
  return _cubeApplyRename(lineData);
}

function _cubeRollOnce(lineData) {
  const line1 = _weightedRandom(lineData.line1 || []);
  const line2 = _weightedRandom(lineData.line2 || []);
  const line3 = _weightedRandom(lineData.line3 || []);
  return { line1, line2, line3 };
}

function _cubeGetGoals() {
  return [1, 2, 3]
    .map(i => document.getElementById(`cubeGoalSel${i}`)?.value || '-')
    .filter(v => v && v !== '-');
}

function _cubeCheckSuccess(rolled, goals) {
  if (!goals) goals = _cubeGetGoals();
  if (!goals.length) return false;
  const lines = [rolled.line1, rolled.line2, rolled.line3];
  const used  = [false, false, false];
  for (const opt of goals) {
    const m = /^(STR|DEX|INT|LUK) \+(\d+)%$/.exec(opt);
    let found = false;
    for (let i = 0; i < 3; i++) {
      if (used[i]) continue;
      if (lines[i] === opt || (m && lines[i] === `올스탯 +${m[2]}%`)) {
        used[i] = true; found = true; break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function _cubeRenderResults() {
  const el = document.getElementById('cubeResults');
  if (!el) return;
  if (_cubeUseCount === 0) { el.innerHTML = '<p class="empty">결과가 없습니다.</p>'; return; }
  const type = document.querySelector('.cube-type-btn.active')?.dataset.type || 'red';
  const meso = CUBE_MESO[type] || 12_000_000;
  const rate  = (_cubeSucc / _cubeUseCount * 100).toFixed(4);
  el.innerHTML = `
    <div class="sf-res-item"><span class="sf-res-label">사용 횟수</span><span class="sf-res-val big">${_cubeUseCount.toLocaleString()}</span></div>
    <div class="sf-res-item"><span class="sf-res-label">성공 횟수</span><span class="sf-res-val" style="color:var(--success)">${_cubeSucc.toLocaleString()}</span></div>
    <div class="sf-res-item"><span class="sf-res-label">성공률</span><span class="sf-res-val">${rate}%</span></div>
    <div class="sf-res-item"><span class="sf-res-label">소요 메소</span><span class="sf-res-val">${fmtMeso(_cubeUseCount * meso)}</span></div>
    ${_cubeSucc > 0 ? `<div class="sf-res-item"><span class="sf-res-label">성공까지 평균 횟수</span><span class="sf-res-val">${Math.round(_cubeUseCount/_cubeSucc).toLocaleString()} 회</span></div>` : ''}`;
}

function _cubePopulateGoalOpts(lineData) {
  const allOpts = new Set();
  ['line1','line2','line3'].forEach(k => {
    (lineData?.[k] || []).forEach(o => allOpts.add(o.option));
  });
  const opts = ['-', ...allOpts];
  const html  = opts.map(o => `<option value="${o}">${o}</option>`).join('');
  for (let i = 1; i <= 3; i++) {
    const sel = document.getElementById(`cubeGoalSel${i}`);
    if (sel) sel.innerHTML = html;
  }
}

// 160 역방향 매핑
const _CUBE_RENAME_160_REV = Object.fromEntries(
  Object.entries(_CUBE_RENAME_160).map(([k, v]) => [v, k])
);

function _cubeRefreshGoalOpts() {
  const lv = parseInt(document.getElementById('cubeLevel')?.value);
  if (!lv || lv < 120 || lv > 250) return;

  const prev = [1, 2, 3].map(i => document.getElementById(`cubeGoalSel${i}`)?.value || '-');

  const lineData = _cubeGetLineData();
  if (!lineData) return;
  _cubePopulateGoalOpts(lineData);

  // 저장값 복원 — 레벨에 따라 리네임 적용
  const isLv160 = _cubeIsLv160();
  prev.forEach((val, idx) => {
    if (!val || val === '-') return;
    // 현재 레벨 기준으로 옵션명 변환
    const mapped = isLv160
      ? (_CUBE_RENAME_160[val] || val)
      : (_CUBE_RENAME_160_REV[val] || val);
    const sel = document.getElementById(`cubeGoalSel${idx + 1}`);
    if (!sel) return;
    const exists = [...sel.options].some(o => o.value === mapped);
    sel.value = exists ? mapped : '-';
  });
}

async function initCube() {
  // 부위 드롭다운
  const partSel = document.getElementById('cubePart');
  if (partSel) {
    partSel.innerHTML = CUBE_PARTS.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  // 큐브 타입 버튼
  document.querySelectorAll('.cube-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cube-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _cubeRefreshGoalOpts();
    });
  });

  // 부위/레벨 변경 시 옵션 갱신
  ['cubePart','cubeLevel'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', _cubeRefreshGoalOpts);
    document.getElementById(id)?.addEventListener('input',  _cubeRefreshGoalOpts);
  });

  // 데이터 미리 로드 후 옵션 초기화
  try {
    await _loadCubeData();
    _cubeRefreshGoalOpts();
  } catch(e) { console.error('큐브 데이터 로드 실패', e); }

  // 기댓값 계산
  document.getElementById('cubeExpectedBtn')?.addEventListener('click', () => {
    const goals    = _cubeGetGoals();
    const lineData = _cubeGetLineData();
    if (!goals.length)  { alert('목표 옵션을 1개 이상 선택하세요.'); return; }
    if (!lineData)      { alert('레벨과 부위를 올바르게 설정하세요.'); return; }

    const type = document.querySelector('.cube-type-btn.active')?.dataset.type || 'red';
    const meso = CUBE_MESO[type] || 12_000_000;

    const el = document.getElementById('cubeResults');
    const pSuccess = _cubeExactP(lineData, goals);
    if (!pSuccess) { el.innerHTML = '<p class="empty">해당 옵션 조합 데이터가 없습니다.</p>'; return; }
    const eCubes   = 1 / pSuccess;
    const eMeso    = eCubes * meso;

    el.innerHTML = `
      <div class="sf-res-item"><span class="sf-res-label">성공 확률</span><span class="sf-res-val big">${(pSuccess * 100).toFixed(4)}%</span></div>
      <div class="sf-res-item"><span class="sf-res-label">기댓값 평균 큐브 수</span><span class="sf-res-val">${Math.ceil(eCubes).toLocaleString()} 개</span></div>
      <div class="sf-res-item"><span class="sf-res-label">기댓값 평균 메소</span><span class="sf-res-val">${fmtMeso(Math.round(eMeso))}</span></div>
      <div class="sf-res-item"><span class="sf-res-label">10% 확률 이내</span><span class="sf-res-val">${Math.ceil(eCubes * 0.105).toLocaleString()} 개</span></div>
      <div class="sf-res-item"><span class="sf-res-label">90% 확률 이내</span><span class="sf-res-val" style="color:var(--danger)">${Math.ceil(eCubes * 2.303).toLocaleString()} 개</span></div>`;
  });

  // 시뮬레이션 시작 (RAF 기반 — UI 안 멈춤)
  document.getElementById('cubeRunBtn')?.addEventListener('click', () => {
    if (_cubeRunning) return;
    const goals    = _cubeGetGoals();
    const lineData = _cubeGetLineData();
    if (!goals.length)  { alert('목표 옵션을 1개 이상 선택하세요.'); return; }
    if (!lineData)      { alert('레벨과 부위를 올바르게 설정하세요.'); return; }

    _cubeUseCount = 0; _cubeSucc = 0; _cubeRunning = true; _cubeStop = false;
    document.getElementById('cubeRunBtn').disabled  = true;
    document.getElementById('cubeStopBtn').disabled = false;

    let lastRender = 0;
    function tick(ts) {
      if (_cubeStop) {
        _cubeRunning = false;
        document.getElementById('cubeRunBtn').disabled  = false;
        document.getElementById('cubeStopBtn').disabled = true;
        _cubeRenderResults();
        return;
      }
      for (let i = 0; i < 500; i++) {
        _cubeUseCount++;
        if (_cubeCheckSuccess(_cubeRollOnce(lineData), goals)) _cubeSucc++;
      }
      if (ts - lastRender > 100) { _cubeRenderResults(); lastRender = ts; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  document.getElementById('cubeStopBtn')?.addEventListener('click', () => { _cubeStop = true; });
}

/* ═══════════════════════════════════════════════
   보스 HP 카드
═══════════════════════════════════════════════ */
const DIFF_KR_TO_ENG = { '이지':'easy', '노말':'normal', '하드':'hard', '카오스':'chaos', '익스트림':'extreme' };
const bossHPActiveDiffs = {};

function parseBossHpValue(value) {
  if (value == null || value === '' || value === '—') return 0;
  if (typeof value === 'number') return value;
  const raw = String(value).replace(/,/g, '').trim();
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (/Q$/i.test(raw)) return num * 10_000_000;
  if (/T$/i.test(raw)) return num * 10_000;
  if (/B$/i.test(raw)) return num * 10;
  if (/M$/i.test(raw)) return num / 100;
  if (raw.includes('조')) return num * 10_000;
  return num;
}

function fmtBossHpEok(eok) {
  if (!eok) return '—';
  const fmt = n => +n.toFixed(2).replace(/\.?0+$/, '');
  if (eok >= 10_000_000) return `${fmt(eok / 10_000_000)}Q`;
  if (eok >= 10_000)     return `${fmt(eok / 10_000)}T`;
  if (eok >= 10)         return `${fmt(eok / 10)}B`;
  return `${fmt(eok * 100)}M`;
}

function renderBossHPTable() {
  const norm = s => s.replace(/\s/g, '');

  // 보스명으로 그룹화 (BOSS_HP_TABLE 순서 유지)
  const groups = [];
  const seen   = {};
  BOSS_HP_TABLE.forEach(b => {
    if (!seen[b.name]) {
      seen[b.name] = { name: b.name, img: '', monthly: false, diffs: [] };
      groups.push(seen[b.name]);
    }
    seen[b.name].diffs.push(b);
  });

  // BOSS_DATA 에서 이미지·월간 여부 매핑
  BOSS_DATA.forEach(bd => {
    const key = Object.keys(seen).find(k => norm(k) === norm(bd.name));
    if (key) { seen[key].img = bd.img; seen[key].monthly = !!bd.monthly; }
  });

  const container = document.getElementById('bossHPCards');
  container.innerHTML = groups.map(boss => {
    const imgHtml = boss.img
      ? `<img src="${boss.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none">BOSS</span>`
      : '<span class="noimg">BOSS</span>';

    const activeDiff = bossHPActiveDiffs[boss.name] || boss.diffs[0]?.diff;
    const active = boss.diffs.find(d => d.diff === activeDiff) || boss.diffs[0];
    bossHPActiveDiffs[boss.name] = active.diff;

    const activeEngDiff = DIFF_KR_TO_ENG[active.diff] || 'normal';
    const activeMeta = DIFF_META[activeEngDiff] || { label: active.diff, cls: 'diff-normal' };

    const forceEl = active.force
      ? `<span class="force ${active.ftype === 'auth' ? 'force-auth' : 'force-arc'}"><img src="images/icons/${active.ftype === 'auth' ? 'auth' : 'arc'}.png" class="force-icon" />${active.force}</span>`
      : '';

    // 난이도 select
    const diffOpts = boss.diffs.map(d => {
      const eng = DIFF_KR_TO_ENG[d.diff] || 'normal';
      const meta = DIFF_META[eng] || { label: d.diff };
      return `<option value="${d.diff}"${d.diff === active.diff ? ' selected' : ''}>${meta.label}</option>`;
    }).join('');
    const diffSel = `<select class="bhp-diff-sel" data-boss="${boss.name}">${diffOpts}</select>`;

    // 선택된 난이도 pill
    const activePill = `<div class="bhp-active-diff"><span class="dpill ${activeMeta.cls} sel"><span class="dpill__t">${activeMeta.label}</span></span></div>`;

    const phases = (BOSS_HP_PHASES[boss.name + '_' + active.diff] || []);
    const totalHpEok = parseBossHpValue(active.hp);

    const pdrHtml = active.pdr != null
      ? `<div class="bhp-pdr">방어율 <b>${active.pdr}%</b></div>`
      : '';

    const phaseHtml = phases.length > 0
      ? phases.map((ph, i) =>
          (i > 0 ? '<hr class="bhp-sep">' : '') +
          `<div class="bhp-phase"><span>${ph.label}</span><span class="bhp-phase__val">${ph.hp || '—'}</span></div>`
        ).join('')
      : `<div class="bhp-phase"><span>총 체력</span><span class="bhp-phase__val">${fmtBossHpEok(active.hp)}</span></div>`;

    const threshHtml = totalHpEok > 0 ? `
      <div class="bhp-thresholds">
        <div class="bhp-tr"><span class="bhp-tr__pct">10%</span><span class="bhp-tr__dot--10">●</span><span class="bhp-tr__val">${fmtBossHpEok(totalHpEok * 0.10)}</span></div>
        <div class="bhp-tr"><span class="bhp-tr__pct">5%</span><span class="bhp-tr__dot--5">●</span><span class="bhp-tr__val">${fmtBossHpEok(totalHpEok * 0.05)}</span></div>
      </div>` : '';

    return `<div class="bhp-card${boss.monthly ? ' bhp-card--monthly' : ''}">
      <div class="bhp-card__img">${imgHtml}</div>
      <div class="bhp-card__body">
        <div class="bhp-card__top">
          <div class="bhp-card__name">${active.nameOverride || boss.name}</div>
          <div class="bhp-card__info">
            <span class="bhp-lv">Lv.${active.lv ?? '—'}</span>
            ${forceEl}
          </div>
          ${pdrHtml}
          ${activePill}
          ${diffSel}
          <div class="bhp-diff">${phaseHtml}</div>
        </div>
        ${threshHtml}
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.bhp-diff-sel').forEach(sel => {
    sel.addEventListener('change', () => {
      bossHPActiveDiffs[sel.dataset.boss] = sel.value;
      renderBossHPTable();
    });
  });

  // 모든 카드 높이를 최대 카드 기준으로 통일
  requestAnimationFrame(() => {
    const cards = container.querySelectorAll('.bhp-card');
    let maxH = 0;
    cards.forEach(c => { c.style.minHeight = ''; const h = c.getBoundingClientRect().height; if (h > maxH) maxH = h; });
    cards.forEach(c => c.style.minHeight = maxH + 'px');
  });
}

renderBossHPTable();
initStarforce();
initCube();
