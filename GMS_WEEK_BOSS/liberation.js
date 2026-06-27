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

  // 검은마법사는 월 1회 — 1주차에 thisMonthly 전액, 이후 매 4주마다 fullMonthly
  // 1주차: 이번주 주간보스 + 이번달 검마(미격파 시)
  const week1income = thisWeekly + thisMonthly;

  let daysLeft = null, targetDateStr = '—';

  if (remaining <= 0) {
    daysLeft = 0;
    targetDateStr = '이미 달성!';
  } else if (fullWeekly > 0 || fullMonthly > 0) {
    const afterWeek1 = Math.max(0, remaining - week1income);
    if (afterWeek1 <= 0) {
      // 이번 주 안에 해방
      daysLeft = 7;
    } else {
      // 2주차부터: 주간보스만 (검마는 4주 후 다시)
      // 단순화: 주당 fullWeekly + fullMonthly/4 사용
      const weeklyRate = fullWeekly + fullMonthly / 4;
      const extraWeeks = Math.ceil(afterWeek1 / weeklyRate);
      daysLeft = (1 + extraWeeks) * 7;
    }
    const start = new Date(genState.startDate || nextThursday());
    start.setDate(start.getDate() + daysLeft);
    targetDateStr = `${start.getFullYear()}년 ${String(start.getMonth()+1).padStart(2,'0')}월 ${String(start.getDate()).padStart(2,'0')}일`;
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

  /* 이벤트 — 상태 저장만, 자동 계산 없음 */
  const genHeldEl = document.getElementById('genHeld');
  const applyHeld = e => {
    const val = Math.max(0, Math.min(TRACE_HOLD_MAX, parseInt(e.target.value) || 0));
    genState.held = val;
    if (parseInt(e.target.value) !== val) e.target.value = val;
    saveGen();
  };
  genHeldEl.addEventListener('input', applyHeld);
  genHeldEl.addEventListener('change', applyHeld);

  document.getElementById('genPass').addEventListener('change', e => {
    genState.pass = e.target.checked;
    saveGen();
    renderGenesis(); // 패스 ON/OFF는 흔적량 표시에 바로 반영
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
      saveGen();
      renderGenesis();
    });
  });

  document.getElementById('genCalcBtn').addEventListener('click', renderResult);
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
