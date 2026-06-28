/* ═══════════════════════════════════════════════
   해방 계산기 — 제네시스 (어둠의 흔적)
═══════════════════════════════════════════════ */
function nextThursday(from) {
  const d = new Date(from || new Date());
  const diff = (4 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const genState = (() => {
  const def = { quest:0, held:0, pass:false, sel:{}, startDate: nextThursday() };
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

/* ─── 계산 로직 ─── */
function calcBossTraces() {
  const mult = genState.pass ? GENESIS_PASS_MULT : 1;
  const rows = [];
  // thisWeek: 이번 주 수입 (cleared 제외)
  // fullWeek: 다음 주부터 수입 (cleared 포함, 매주 받을 수 있음)
  let thisWeekly = 0, fullWeekly = 0, thisMonthly = 0, fullMonthly = 0;

  for (const id in TRACE_YIELD) {
    const sel   = genState.sel[id] || {};
    const diff  = sel.diff || 'none';
    if (diff === 'none') continue;
    const party = Math.max(1, sel.party || 1);
    const raw   = Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party);
    const isMonthly = id === 'blackmage';

    rows.push({ id, name: bossInfo(id).name, diff, raw, isMonthly, cleared: !!sel.cleared });
    if (isMonthly) {
      fullMonthly += raw;
      if (!sel.cleared) thisMonthly += raw;
    } else {
      fullWeekly += raw;
      if (!sel.cleared) thisWeekly += raw;
    }
  }
  return { rows, thisWeekly, fullWeekly, thisMonthly, fullMonthly };
}

function calcResult() {
  const { rows, thisWeekly, fullWeekly, thisMonthly, fullMonthly } = calcBossTraces();
  const mult = genState.pass ? GENESIS_PASS_MULT : 1;

  const held      = Math.max(0, genState.held);
  const questCum  = (GENESIS_QUESTS[genState.quest] || GENESIS_QUESTS[0]).cum;
  const totalSpent = questCum + held;
  const remaining  = Math.max(0, GENESIS_TARGET - totalSpent);
  const pct        = Math.min(100, Math.round(totalSpent / GENESIS_TARGET * 100));

  // 1주차: 이번주 주간보스 + 이번달 검마(미격파 시)
  const week1income = thisWeekly + thisMonthly;

  let daysLeft = null, targetDateStr = '—';

  if (remaining <= 0) {
    daysLeft = 0;
    targetDateStr = '이미 달성!';
  } else if (fullWeekly > 0 || fullMonthly > 0) {
    // 몇 번의 목요일 리셋이 필요한지 계산
    const afterWeek1 = Math.max(0, remaining - week1income);
    const resetsNeeded = afterWeek1 <= 0
      ? 1
      : 1 + Math.ceil(afterWeek1 / (fullWeekly + fullMonthly / 4));

    // 시작일에서 첫 목요일 리셋 찾기
    const startD = new Date(genState.startDate || nextThursday());
    const daysToFirstReset = (4 - startD.getDay() + 7) % 7 || 7;

    // 해방 날짜 = 첫 리셋 + (resetsNeeded-1)주
    const libDate = new Date(startD);
    libDate.setDate(startD.getDate() + daysToFirstReset + (resetsNeeded - 1) * 7);

    // 오늘부터 해방일까지 일수
    const today = new Date();
    today.setHours(0,0,0,0);
    daysLeft = Math.round((libDate - today) / 86400000);

    targetDateStr = `${libDate.getFullYear()}년 ${String(libDate.getMonth()+1).padStart(2,'0')}월 ${String(libDate.getDate()).padStart(2,'0')}일`;
  }

  const weeksStr = daysLeft != null
    ? `${(daysLeft / 7).toFixed(1)}주 (${daysLeft}일)`
    : '—';

  return { rows, weeklyTotal: thisWeekly, monthlyTotal: thisMonthly, fullWeekly, fullMonthly, mult, held, questCum, totalSpent, remaining, pct, daysLeft, weeksStr, targetDateStr };
}

/* ─── 결과 패널 렌더링 ─── */
function renderResult() {
  const panel = document.getElementById('genResultPanel');
  if (!panel) return;
  const r = calcResult();

  if (r.rows.length === 0) {
    panel.innerHTML = `<p style="color:var(--text-sub);font-size:.85rem;text-align:center;padding:24px 0">보스를 선택하면 계산 결과가 표시됩니다.</p>`;
    return;
  }

  const bossRows = r.rows.map(row => {
    const isMonthly = row.isMonthly;
    const unit = isMonthly ? '/월' : '/주';
    const dimmed = row.cleared ? ' style="opacity:.4"' : '';
    return `<div class="gen-res-row"${dimmed}>
      <span class="gen-res-name">${row.name} 획득 흔적</span>
      <b class="gen-res-val">${fmtTrace(row.raw)}${unit}</b>
    </div>`;
  }).join('');

  const weeklyLine = r.fullWeekly > 0 ? `${fmtTrace(r.fullWeekly)}/주` : '';
  const monthlyLine = r.fullMonthly > 0 ? `+ ${fmtTrace(r.fullMonthly)}/월` : '';

  panel.innerHTML = `
    <div class="gen-res-section">
      ${bossRows}
    </div>
    <div class="gen-res-divider"></div>
    <div class="gen-res-row gen-res-total">
      <span>총 획득 흔적</span>
      <b>${[weeklyLine, monthlyLine].filter(Boolean).join(' ')}</b>
    </div>
    <div class="gen-res-row">
      <span>획득 / 요구 흔적</span>
      <b>${fmtTrace(r.totalSpent)} / ${fmtTrace(GENESIS_TARGET)}</b>
    </div>
    <div class="gen-res-divider"></div>
    <div class="lib-progress" style="margin:8px 0 4px"><div class="lib-progress__fill" style="width:${r.pct}%"></div></div>
    <div class="lib-pct" style="margin-bottom:12px">${r.pct}% · ${fmtTrace(r.totalSpent)} / ${fmtTrace(GENESIS_TARGET)}</div>
    <div class="gen-res-row gen-res-accent">
      <span>예상 해방 기간</span>
      <b>${r.weeksStr}</b>
    </div>
    <div class="gen-date-wrap">
      <div class="gen-date-label">예상 해방 날짜</div>
      <div class="gen-date-big">${r.targetDateStr}</div>
    </div>`;
}

/* ─── 메인 렌더 ─── */
function renderGenesis() {
  const panel = document.getElementById('lib-genesis');

  const questOpts = GENESIS_QUESTS.map((qq, i) =>
    `<option value="${i}" ${i===genState.quest?'selected':''}>${qq.name}</option>`
  ).join('');

  const mult = genState.pass ? GENESIS_PASS_MULT : 1;

  const bossCards = Object.keys(TRACE_YIELD).map(id => {
    const info  = bossInfo(id);
    const sel   = genState.sel[id] || {};
    const diff  = sel.diff || 'none';
    const party = Math.max(1, sel.party || 1);
    const cleared = !!sel.cleared;
    const yld   = diff === 'none' ? 0 : Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party);
    const active = diff !== 'none';
    const isMonthly = id === 'blackmage';

    const diffOpts = ['none', ...Object.keys(TRACE_YIELD[id])].map(d =>
      `<option value="${d}" ${diff===d?'selected':''}>${DIFF_META[d]?.label || d}</option>`
    ).join('');

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
              <span>${isMonthly ? '금월 격파' : '이번주'}</span>
            </label>
            <span class="gen-boss__trace ${active?'on':''}">+${fmtTrace(yld)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const held = Math.max(0, genState.held);
  const startDate = genState.startDate || nextThursday();

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
          <div class="card__title">주간 보스 설정</div>
          <div class="gen-bosses">${bossCards}</div>
        </div>

        <button class="sbtn sbtn--primary w100" id="genCalcBtn" style="margin-top:4px;padding:14px;font-size:1rem;font-weight:700">계산하기</button>
      </div>

      <!-- 우측: 계산 결과 -->
      <div class="card gen-stat-panel">
        <div class="card__title" style="margin-bottom:12px">계산 결과</div>
        <div id="genResultPanel"><p style="color:var(--text-sub);font-size:.85rem;text-align:center;padding:24px 0">보스를 선택 후 계산하기를 눌러주세요.</p></div>
      </div>
    </div>`;

  /* 보스 카드 부분 업데이트 (전체 재렌더 없이) */
  function updateBossCard(id) {
    const card = panel.querySelector(`.gen-boss[data-id="${id}"]`);
    if (!card) return;
    const mult = genState.pass ? GENESIS_PASS_MULT : 1;
    const sel  = genState.sel[id] || {};
    const diff = sel.diff || 'none';
    const party = Math.max(1, sel.party || 1);
    const active = diff !== 'none';
    const yld = active ? Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party) : 0;

    card.classList.toggle('on', active);
    const traceEl = card.querySelector('.gen-boss__trace');
    traceEl.textContent = `+${fmtTrace(yld)}`;
    traceEl.classList.toggle('on', active);
    const pm = card.querySelector('.pm');
    const pp = card.querySelector('.pp');
    pm.disabled = party <= 1;
    pp.disabled = party >= 6;
    card.querySelector('.party-stepper__val').textContent = party;
  }

  /* 이벤트 — 입력은 자유롭게, 바깥 클릭(blur)/Enter 때만 클램프·저장 */
  const genHeldEl = document.getElementById('genHeld');
  genHeldEl.addEventListener('change', e => {
    const val = Math.max(0, Math.min(TRACE_HOLD_MAX, parseInt(e.target.value) || 0));
    genState.held = val;
    e.target.value = val;
    saveGen();
  });

  document.getElementById('genPass').addEventListener('change', e => {
    genState.pass = e.target.checked;
    saveGen();
    // 패스 ON/OFF: 흔적량만 업데이트
    const lbl = document.querySelector('.gen-switch__label');
    if (lbl) lbl.textContent = genState.pass ? 'ON' : 'OFF';
    const passCard = document.querySelector('.gen-cfg-card--pass');
    if (passCard) passCard.classList.toggle('on', genState.pass);
    Object.keys(TRACE_YIELD).forEach(id => updateBossCard(id));
  });
  document.getElementById('genStartDate').addEventListener('change', e => {
    genState.startDate = e.target.value || nextThursday();
    saveGen();
  });
  document.getElementById('genQuestSel').addEventListener('change', e => {
    genState.quest = parseInt(e.target.value);
    saveGen();
  });

  panel.querySelectorAll('.gen-boss__party').forEach(ps => {
    const id = ps.dataset.id;
    ps.querySelector('.pm').addEventListener('click', () => {
      const cur = genState.sel[id] || {};
      if ((cur.party||1) > 1) {
        genState.sel[id] = { ...cur, party:(cur.party||1)-1 };
        saveGen(); updateBossCard(id);
      }
    });
    ps.querySelector('.pp').addEventListener('click', () => {
      const cur = genState.sel[id] || {};
      if ((cur.party||1) < 6) {
        genState.sel[id] = { ...cur, party:(cur.party||1)+1 };
        saveGen(); updateBossCard(id);
      }
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
      saveGen(); updateBossCard(id);
    });
  });

  document.getElementById('genCalcBtn').addEventListener('click', renderResult);
}

/* ═══════════════════════════════════════════════
   해방 계산기 — 데스티니 (결의)
═══════════════════════════════════════════════ */
const destState = (() => {
  const def = { heldResolve: 0, sel: {}, startDate: nextThursday() };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('lib_destiny_v1') || '{}')); }
  catch { return def; }
})();
function saveDest() { localStorage.setItem('lib_destiny_v1', JSON.stringify(destState)); }
function fmtResolve(n) { return Number(n).toLocaleString(); }

function calcDestinyResult() {
  let thisWeekly = 0, fullWeekly = 0;
  const rows = [];

  for (const id in DESTINY_RESOLVE_YIELD) {
    const sel   = destState.sel[id] || {};
    const diff  = sel.diff || 'none';
    if (diff === 'none') continue;
    const party = Math.max(1, sel.party || 1);
    const raw   = Math.floor((DESTINY_RESOLVE_YIELD[id][diff] || 0) / party);
    rows.push({ id, name: (DESTINY_BOSS_META.find(b=>b.id===id)||{name:id}).name, diff, raw, cleared: !!sel.cleared });
    fullWeekly += raw;
    if (!sel.cleared) thisWeekly += raw;
  }

  const held = Math.max(0, destState.heldResolve);

  function calcDateFor(target) {
    const remaining = Math.max(0, target - held);
    if (remaining <= 0) return { weeksStr: '이미 달성!', dateStr: '이미 달성!' };
    if (fullWeekly <= 0) return { weeksStr: '—', dateStr: '—' };

    const week1After = Math.max(0, remaining - thisWeekly);
    const resetsNeeded = week1After <= 0 ? 1 : 1 + Math.ceil(week1After / fullWeekly);

    const startD = new Date(destState.startDate || nextThursday());
    const daysToReset = (4 - startD.getDay() + 7) % 7 || 7;
    const libDate = new Date(startD);
    libDate.setDate(startD.getDate() + daysToReset + (resetsNeeded - 1) * 7);

    const today = new Date(); today.setHours(0,0,0,0);
    const daysLeft = Math.round((libDate - today) / 86400000);
    const weeksStr = `${(daysLeft/7).toFixed(1)}주 (${daysLeft}일)`;
    const dateStr  = `${libDate.getFullYear()}년 ${String(libDate.getMonth()+1).padStart(2,'0')}월 ${String(libDate.getDate()).padStart(2,'0')}일`;
    return { weeksStr, dateStr };
  }

  const r1 = calcDateFor(DESTINY_1ST_TARGET);
  const r2 = calcDateFor(DESTINY_2ND_TARGET);
  const pct1 = Math.min(100, Math.round(held / DESTINY_1ST_TARGET * 100));
  const pct2 = Math.min(100, Math.round(held / DESTINY_2ND_TARGET * 100));

  return { rows, thisWeekly, fullWeekly, held, pct1, pct2, r1, r2 };
}

function renderDestinyResult() {
  const panel = document.getElementById('destResultPanel');
  if (!panel) return;
  const r = calcDestinyResult();

  if (r.rows.length === 0) {
    panel.innerHTML = `<p style="color:var(--text-sub);font-size:.85rem;text-align:center;padding:24px 0">보스를 선택하면 계산 결과가 표시됩니다.</p>`;
    return;
  }

  const bossRows = r.rows.map(row => {
    const dimmed = row.cleared ? ' style="opacity:.4"' : '';
    return `<div class="gen-res-row"${dimmed}>
      <span class="gen-res-name">${row.name} (${row.diff}) 결의</span>
      <b class="gen-res-val">${fmtResolve(row.raw)}/주</b>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="gen-res-section">${bossRows}</div>
    <div class="gen-res-divider"></div>
    <div class="gen-res-row gen-res-total">
      <span>주당 총 결의</span>
      <b>${fmtResolve(r.fullWeekly)}/주</b>
    </div>
    <div class="gen-res-row">
      <span>현재 보유 결의</span>
      <b>${fmtResolve(r.held)}</b>
    </div>
    <div class="gen-res-divider"></div>
    <div class="gen-res-row" style="margin-bottom:4px"><span style="font-weight:700">1차 해방 (${fmtResolve(DESTINY_1ST_TARGET)} 결의)</span></div>
    <div class="lib-progress" style="margin:4px 0"><div class="lib-progress__fill" style="width:${r.pct1}%"></div></div>
    <div class="lib-pct" style="margin-bottom:4px">${r.pct1}% · ${fmtResolve(r.held)} / ${fmtResolve(DESTINY_1ST_TARGET)}</div>
    <div class="gen-res-row gen-res-accent">
      <span>1차 예상 기간</span><b>${r.r1.weeksStr}</b>
    </div>
    <div class="gen-date-wrap">
      <div class="gen-date-label">1차 해방 예상 날짜</div>
      <div class="gen-date-big">${r.r1.dateStr}</div>
    </div>
    <div class="gen-res-divider"></div>
    <div class="gen-res-row" style="margin-bottom:4px"><span style="font-weight:700">2차 해방 (${fmtResolve(DESTINY_2ND_TARGET)} 결의)</span></div>
    <div class="lib-progress" style="margin:4px 0"><div class="lib-progress__fill" style="width:${r.pct2}%"></div></div>
    <div class="lib-pct" style="margin-bottom:4px">${r.pct2}% · ${fmtResolve(r.held)} / ${fmtResolve(DESTINY_2ND_TARGET)}</div>
    <div class="gen-res-row gen-res-accent">
      <span>2차 예상 기간</span><b>${r.r2.weeksStr}</b>
    </div>
    <div class="gen-date-wrap">
      <div class="gen-date-label">2차 해방 예상 날짜</div>
      <div class="gen-date-big">${r.r2.dateStr}</div>
    </div>`;
}

function renderDestiny() {
  const panel = document.getElementById('lib-destiny');

  const DIFF_LABEL = { 노말:'노말', 하드:'하드', 카오스:'카오스', 익스트림:'익스트림' };

  const bossCards = DESTINY_BOSS_META.map(meta => {
    const { id, name, maxParty, img } = meta;
    const yieldMap = DESTINY_RESOLVE_YIELD[id] || {};
    const sel    = destState.sel[id] || {};
    const diff   = sel.diff || 'none';
    const party  = Math.max(1, sel.party || 1);
    const cleared = !!sel.cleared;
    const active = diff !== 'none';
    const yld    = active ? Math.floor((yieldMap[diff] || 0) / party) : 0;

    const diffOpts = ['none', ...Object.keys(yieldMap)].map(d =>
      `<option value="${d}" ${diff===d?'selected':''}>${d==='none'?'선택 안함':(DIFF_LABEL[d]||d)}</option>`
    ).join('');

    return `
      <div class="gen-boss ${active?'on':''}" data-id="${id}">
        <div class="boss-thumb"><img src="${img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none">BOSS</span></div>
        <div class="gen-boss__body">
          <div class="gen-boss__top"><span class="gen-boss__name">${name}</span></div>
          <div class="gen-boss__row2">
            <select class="sel dest-boss__diff" data-id="${id}">${diffOpts}</select>
            <div class="party-stepper dest-boss__party" data-id="${id}">
              <button class="pm" ${party<=1?'disabled':''}>−</button>
              <span class="party-stepper__val">${party}</span>
              <button class="pp" ${party>=maxParty?'disabled':''}>+</button>
            </div>
          </div>
          <div class="gen-boss__row3">
            <label class="gen-boss__ck">
              <input type="checkbox" class="dest-boss__cb" data-id="${id}" ${cleared?'checked':''}/>
              <span>이번주 격파</span>
            </label>
            <span class="gen-boss__trace ${active?'on':''}">+${fmtResolve(yld)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const held      = Math.max(0, destState.heldResolve);
  const startDate = destState.startDate || nextThursday();

  panel.innerHTML = `
    <div class="gen-main-layout">
      <div class="gen-left">
        <div class="card gen-inputs">
          <div class="gen-input-row">
            <div class="field">
              <label class="field__label">시작 날짜</label>
              <input class="inp gen-inp" id="destStartDate" type="date" value="${startDate}" />
            </div>
            <div class="field" style="flex:1.5">
              <label class="field__label">현재 보유 결의</label>
              <input class="inp" id="destHeld" type="number" min="0" max="${DESTINY_RESOLVE_MAX}" value="${held}" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__title">주간 보스 설정</div>
          <div class="gen-bosses" id="destBossGrid">${bossCards}</div>
        </div>

        <button class="sbtn sbtn--primary w100" id="destCalcBtn" style="margin-top:4px;padding:14px;font-size:1rem;font-weight:700">계산하기</button>
      </div>

      <div class="card gen-stat-panel">
        <div class="card__title" style="margin-bottom:12px">계산 결과</div>
        <div id="destResultPanel"><p style="color:var(--text-sub);font-size:.85rem;text-align:center;padding:24px 0">보스를 선택 후 계산하기를 눌러주세요.</p></div>
      </div>
    </div>`;

  function updateDestCard(id) {
    const card = panel.querySelector(`.gen-boss[data-id="${id}"]`);
    if (!card) return;
    const yieldMap = DESTINY_RESOLVE_YIELD[id] || {};
    const sel  = destState.sel[id] || {};
    const diff = sel.diff || 'none';
    const party = Math.max(1, sel.party || 1);
    const active = diff !== 'none';
    const yld = active ? Math.floor((yieldMap[diff] || 0) / party) : 0;
    const meta = DESTINY_BOSS_META.find(b => b.id === id) || {};

    card.classList.toggle('on', active);
    const traceEl = card.querySelector('.gen-boss__trace');
    traceEl.textContent = `+${fmtResolve(yld)}`;
    traceEl.classList.toggle('on', active);
    const pm = card.querySelector('.pm');
    const pp = card.querySelector('.pp');
    pm.disabled = party <= 1;
    pp.disabled = party >= (meta.maxParty || 6);
    card.querySelector('.party-stepper__val').textContent = party;
  }

  document.getElementById('destHeld').addEventListener('change', e => {
    const val = Math.max(0, Math.min(DESTINY_RESOLVE_MAX, parseInt(e.target.value) || 0));
    destState.heldResolve = val;
    e.target.value = val;
    saveDest();
  });
  document.getElementById('destStartDate').addEventListener('change', e => {
    destState.startDate = e.target.value || nextThursday();
    saveDest();
  });

  panel.querySelectorAll('.dest-boss__party').forEach(ps => {
    const id = ps.dataset.id;
    const meta = DESTINY_BOSS_META.find(b => b.id === id) || {};
    ps.querySelector('.pm').addEventListener('click', () => {
      const cur = destState.sel[id] || {};
      if ((cur.party||1) > 1) {
        destState.sel[id] = { ...cur, party:(cur.party||1)-1 };
        saveDest(); updateDestCard(id);
      }
    });
    ps.querySelector('.pp').addEventListener('click', () => {
      const cur = destState.sel[id] || {};
      if ((cur.party||1) < (meta.maxParty||6)) {
        destState.sel[id] = { ...cur, party:(cur.party||1)+1 };
        saveDest(); updateDestCard(id);
      }
    });
  });
  panel.querySelectorAll('.dest-boss__cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      destState.sel[id] = { ...(destState.sel[id]||{}), cleared: cb.checked };
      saveDest();
    });
  });
  panel.querySelectorAll('.dest-boss__diff').forEach(s => {
    s.addEventListener('change', () => {
      const id = s.dataset.id;
      destState.sel[id] = { ...(destState.sel[id]||{}), diff: s.value };
      saveDest(); updateDestCard(id);
    });
  });

  document.getElementById('destCalcBtn').addEventListener('click', renderDestinyResult);
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
