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
      inp.addEventListener('change', () => {
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

  const ico = (n) => jd.folder ? `images/skill/${jd.folder}/${n}.webp` : null;
  const commonIco = ['images/skill/Common/sol_janus.webp', 'images/skill/Common/sol_hecate.webp'];

  hxSkill.forEach((n,i)   => { if(jd.skill[i])   n.name = jd.skill[i]; });
  hxMastery.forEach((n,i) => { if(jd.mastery[i]) n.name = jd.mastery[i]; });
  hxBoost.forEach((n,i)   => { if(jd.boost[i])   n.name = jd.boost[i]; });
  hxCommon.forEach((n,i)  => { if(jd.common[i])  n.name = jd.common[i]; });

  renderNodeList(hxSkill,   'hxSkillList',   'hx_skill',   [ico(1), ico(2)]);
  renderNodeList(hxMastery, 'hxMasteryList', 'hx_mastery', [ico(5), ico(6), ico(7), ico(8)]);
  renderNodeList(hxBoost,   'hxBoostList',   'hx_boost',   [ico(9), ico(10), ico(11), ico(12)]);
  renderNodeList(hxCommon,  'hxCommonList',  'hx_common',  commonIco);
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
  let weekly = 0, monthly = 0;
  for (const id in TRACE_YIELD) {
    const sel = genState.sel[id];
    if (!sel || !sel.on) continue;
    const party = Math.max(1, sel.party || 1);
    const yld = Math.floor((TRACE_YIELD[id][sel.diff] || 0) * mult / party);
    if (id === 'blackmage') monthly += yld; else weekly += yld;
  }
  return { weekly, monthly, mult };
}

function renderGenesis() {
  const panel = document.getElementById('lib-genesis');
  const { weekly, monthly } = genTraceSums();
  const avgPerWeek = weekly + monthly / 4;

  const held = Math.max(0, genState.held);
  const q    = GENESIS_QUESTS[genState.quest] || GENESIS_QUESTS[0];
  const nextQ = GENESIS_QUESTS[genState.quest + 1];
  const remaining = Math.max(0, GENESIS_TARGET - held);
  const pct = Math.min(100, Math.round(held / GENESIS_TARGET * 100));
  const weeksLeft = avgPerWeek > 0 ? Math.ceil(remaining / avgPerWeek) : Infinity;

  const prevCum = genState.quest > 0 ? GENESIS_QUESTS[genState.quest - 1].cum : 0;
  const consume = q.cum - prevCum;
  const nextLabel = nextQ ? `→ 다음: ${nextQ.name}` : '최종 단계';
  const toNext = nextQ ? Math.max(0, nextQ.cum - held) : 0;

  const clearedCount = Object.values(genState.sel).filter(s => s && s.on).length;
  const startDate = genState.startDate || nextThursday();
  const targetDate = (() => {
    if (!isFinite(weeksLeft)) return '—';
    // 시작일이 목요일 이전이면(화/수) 해당 주 목요일로 스냅 → 같은 주 시작은 같은 날 해방
    const d = new Date(startDate);
    const daysToThu = (4 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + daysToThu);        // 이번 주 목요일
    d.setDate(d.getDate() + weeksLeft * 7);    // N주 후 목요일
    return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}.`;
  })();

  // 퀘스트 아이콘 행
  const questIcons = GENESIS_QUESTS.map((qq, i) => {
    const img = QUEST_BOSS_IMG[qq.name];
    const imgHtml = img
      ? `<img src="${img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none;font-size:.5rem">?</span>`
      : `<span style="font-size:.7rem;font-weight:800;color:var(--accent)">✓</span>`;
    return `<div class="gen-qi${i===genState.quest?' active':''}" data-qi="${i}">
      <div class="gen-qi__img">${imgHtml}</div>
      <div class="gen-qi__label">${qq.name}</div>
    </div>`;
  }).join('');

  // 보스 선택 카드
  const mult = genState.pass ? GENESIS_PASS_MULT : 1;
  const bossCards = Object.keys(TRACE_YIELD).map(id => {
    const info = bossInfo(id);
    const sel  = genState.sel[id] || { on:false, diff:Object.keys(TRACE_YIELD[id])[0], party:1 };
    const party = Math.max(1, sel.party || 1);
    const diffOpts = Object.keys(TRACE_YIELD[id]).map(d => {
      const yld = Math.floor((TRACE_YIELD[id][d] || 0) * mult / party);
      return `<option value="${d}" ${sel.diff===d?'selected':''}>${DIFF_META[d]?.label || d} · ${fmtTrace(yld)}</option>`;
    }).join('');
    return `
      <div class="gen-boss ${sel.on?'on':''}" data-id="${id}">
        <div class="boss-thumb"><img src="${info.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none">BOSS</span></div>
        <div class="gen-boss__body">
          <div class="gen-boss__top">
            <span class="gen-boss__name">${info.name}</span>
            ${id==='blackmage'?'<span class="boss-monthly">월간</span>':''}
          </div>
          <select class="sel gen-boss__diff" data-id="${id}">${diffOpts}</select>
          <div class="gen-boss__btm">
            <div class="party-stepper gen-boss__party" data-id="${id}">
              <button class="pm" ${party<=1?'disabled':''}>−</button>
              <span class="party-stepper__val">${party}</span>
              <button class="pp" ${party>=6?'disabled':''}>+</button>
            </div>
            <button class="gen-boss__toggle ${sel.on?'on':''}" data-id="${id}">${sel.on?'격파':'미격파'}</button>
          </div>
        </div>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="gen-grid">
      <div class="card gen-progress">
        <div class="card__title">해방 진행도</div>
        <div class="lib-progress" style="margin-bottom:6px"><div class="lib-progress__fill" style="width:${pct}%"></div></div>
        <div class="lib-pct">${pct}% · ${fmtTrace(held)} / ${fmtTrace(GENESIS_TARGET)} 흔적</div>
        <div class="gen-stat-row"><span>남은 흔적</span><b>${fmtTrace(remaining)}</b></div>
        <div class="gen-stat-row"><span>예상 해방 기간</span><b>${isFinite(weeksLeft)?weeksLeft+'주 후':'—'}</b></div>
        <div class="gen-stat-row accent"><span>예상 해방 날짜</span><b>${targetDate}</b></div>
        <div class="gen-quest-now" style="margin-top:10px">현재 퀘스트: <b>${q.name}</b> · 소모 ${fmtTrace(consume)} 흔적<br><span class="gen-quest-next">${nextLabel}${nextQ?` · ${fmtTrace(toNext)} 남음`:''}</span></div>
      </div>

      <div class="card gen-sources">
        <div class="card__title">흔적 획득량</div>
        <div class="gen-src-row"><span class="dot dot-blue"></span>주간 흔적<b>${fmtTrace(weekly)}</b></div>
        <div class="gen-src-row"><span class="dot dot-purple"></span>검은 마법사 (월간)<b>${fmtTrace(monthly)}</b></div>
        <div class="gen-src-note">주당 평균 ≈ ${fmtTrace(Math.round(avgPerWeek))}${genState.pass?' · 패스 적용':''}</div>
      </div>
    </div>

    <div class="gen-cfg-wrap">
      <div class="gen-cfg-card">
        <img class="gen-cfg-card__img" src="images/icons/Trace_of_darkness.webp" alt="어둠의 흔적">
        <div class="gen-cfg-card__body">
          <div class="gen-cfg-card__title">어둠의 흔적</div>
          <div class="gen-cfg-card__fields">
            <div class="field">
              <label class="field__label">보유 수량</label>
              <input class="inp" id="genHeld" type="number" min="0" max="${TRACE_HOLD_MAX}" value="${held}" />
            </div>
            <div class="field">
              <label class="field__label">시작일 <span style="font-size:.7rem;font-weight:400;color:var(--text-dim)">(목요일 기준)</span></label>
              <input class="inp" id="genStartDate" type="date" value="${startDate}" />
            </div>
          </div>
        </div>
      </div>

      <div class="gen-cfg-card gen-cfg-card--pass${genState.pass?' on':''}">
        <img class="gen-cfg-card__img" src="images/icons/Genesis.png" alt="제네시스 패스">
        <div class="gen-cfg-card__body">
          <div class="gen-cfg-card__title">제네시스 패스</div>
          <div class="gen-cfg-card__desc">활성화 시 흔적 획득량 <b>×3</b></div>
          <label class="gen-switch gen-pass-toggle">
            <input type="checkbox" id="genPass" ${genState.pass?'checked':''} />
            <span class="gen-switch__track"><span class="gen-switch__thumb"></span></span>
            <span class="gen-switch__label">${genState.pass?'ON · 적용 중':'OFF'}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card__title">현재 퀘스트</div>
      <div class="gen-quest-icons">${questIcons}</div>
    </div>

    <div class="card">
      <div class="card__title">이번 주 보스 선택 <span class="gen-cleared">${clearedCount}개 선택</span></div>
      <div class="gen-bosses">${bossCards}</div>
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
  panel.querySelectorAll('.gen-boss__party').forEach(ps => {
    const id = ps.dataset.id;
    ps.querySelector('.pm').addEventListener('click', () => {
      const cur = genState.sel[id] || { on:false, diff:Object.keys(TRACE_YIELD[id])[0], party:1 };
      if ((cur.party||1) > 1) { genState.sel[id] = { ...cur, party:(cur.party||1)-1 }; saveGen(); renderGenesis(); }
    });
    ps.querySelector('.pp').addEventListener('click', () => {
      const cur = genState.sel[id] || { on:false, diff:Object.keys(TRACE_YIELD[id])[0], party:1 };
      if ((cur.party||1) < 6) { genState.sel[id] = { ...cur, party:(cur.party||1)+1 }; saveGen(); renderGenesis(); }
    });
  });
  panel.querySelectorAll('.gen-qi').forEach(el => {
    el.addEventListener('click', () => {
      genState.quest = parseInt(el.dataset.qi); saveGen(); renderGenesis();
    });
  });
  panel.querySelectorAll('.gen-boss__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const cur = genState.sel[id] || { on:false, diff:Object.keys(TRACE_YIELD[id])[0] };
      genState.sel[id] = { ...cur, on:!cur.on };
      saveGen(); renderGenesis();
    });
  });
  panel.querySelectorAll('.gen-boss__diff').forEach(s => {
    s.addEventListener('change', () => {
      const id = s.dataset.id;
      const cur = genState.sel[id] || { on:false };
      genState.sel[id] = { ...cur, diff:s.value };
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
   스타포스 기댓값 계산기 (몬테카를로 시뮬레이션)
═══════════════════════════════════════════════ */
function renderSFRateTable() {
  const table = document.getElementById('sfRateTable');
  table.innerHTML = `<thead><tr>
    <th>현재 성</th><th>목표 성</th><th>성공률</th><th>실패율</th><th>파괴율</th><th>1회 비용 (Lv.200)</th>
  </tr></thead><tbody>` +
  SF_RATES.map((r, i) => `<tr>
    <td>${i}★</td><td>${i+1}★</td>
    <td style="color:var(--success);font-weight:700">${(r[0]*100).toFixed(0)}%</td>
    <td style="color:var(--primary)">${(r[1]*100).toFixed(0)}%</td>
    <td style="color:var(--danger);font-weight:${r[2]>0?700:400}">${r[2]>0?(r[2]*100).toFixed(0)+'%':'—'}</td>
    <td>${fmtMeso(sfCost(200, i))}</td>
  </tr>`).join('') + '</tbody>';
}

document.getElementById('sfCalc').addEventListener('click', () => {
  const lv       = parseInt(document.getElementById('sfLevel').value) || 200;
  const from     = parseInt(document.getElementById('sfFrom').value)  || 0;
  const to       = Math.min(25, parseInt(document.getElementById('sfTo').value) || 22);
  const discount = parseFloat(document.getElementById('sfDiscount').value) || 1;
  const safe12   = document.getElementById('sfSafe12').checked;
  const safe17   = document.getElementById('sfSafe17').checked;
  const safe22   = document.getElementById('sfSafe22').checked;
  const safeSet  = new Set([safe12?12:null, safe17?17:null, safe22?22:null].filter(Boolean));

  if (from >= to) return alert('목표 성이 현재 성보다 높아야 합니다.');

  const SIM = 100_000;
  let totalMeso = 0, totalBooms = 0, totalAttempts = 0;

  for (let sim = 0; sim < SIM; sim++) {
    let star = from, meso = 0, attempts = 0;
    while (star < to) {
      const cost = sfCost(lv, star) * discount;
      meso += cost;
      attempts++;
      const rand = Math.random();
      const [ps, pf, pd] = SF_RATES[star];
      if (rand < ps) {
        star++;
      } else if (rand < ps + pd) {
        // 파괴
        if (safeSet.has(star)) {
          // 파괴방지: 해당 성으로 복구 (비용만 지불)
        } else {
          totalBooms++;
          star = Math.max(from, 12); // 12성으로 복구 (일반)
        }
      } else {
        // 실패
        if (SF_DECREASE[star]) star = Math.max(0, star - 1);
      }
    }
    totalMeso += meso;
    totalAttempts += attempts;
  }

  const avgMeso     = Math.round(totalMeso / SIM);
  const avgAttempts = Math.round(totalAttempts / SIM);
  const avgBooms    = (totalBooms / SIM).toFixed(2);

  document.getElementById('sfResult').innerHTML = `
    <div class="sf-res-item"><span class="sf-res-label">평균 소요 메소</span><span class="sf-res-val big">${fmtMeso(avgMeso)}</span></div>
    <div class="sf-res-item"><span class="sf-res-label">평균 시도 횟수</span><span class="sf-res-val">${avgAttempts.toLocaleString()} 회</span></div>
    <div class="sf-res-item"><span class="sf-res-label">평균 파괴 횟수</span><span class="sf-res-val" style="color:var(--danger)">${avgBooms} 회</span></div>
    <div class="sf-res-item"><span class="sf-res-label">아이템 레벨</span><span class="sf-res-val">${lv}</span></div>
    <div class="sf-res-item"><span class="sf-res-label">구간</span><span class="sf-res-val">${from}★ → ${to}★</span></div>
    <div class="sf-res-item"><span class="sf-res-label">메소 할인</span><span class="sf-res-val">${discount<1?Math.round((1-discount)*100)+'% 할인':'없음'}</span></div>
    <div style="margin-top:8px;font-size:.74rem;color:var(--text-sub)">
      ※ ${SIM.toLocaleString()}회 시뮬레이션 결과. 실제와 차이가 있을 수 있습니다.<br>
      ※ 비용 기준: 게임 내 실제 메소 비용과 근사값
    </div>`;
});

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
          <div class="bhp-card__name">${active.nameOverride || boss.name}${boss.monthly ? '<span class="boss-monthly">월간</span>' : ''}</div>
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
renderSFRateTable();
