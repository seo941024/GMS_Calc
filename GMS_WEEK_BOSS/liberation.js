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
  let weekly = 0, weeklyFirst = 0;
  for (const id in TRACE_YIELD) {
    const sel  = genState.sel[id] || {};
    const diff = sel.diff || 'none';
    if (diff === 'none') continue;
    const party = Math.max(1, sel.party || 1);
    const raw = Math.floor((TRACE_YIELD[id][diff] || 0) * mult / party);
    // 검마는 월간 보스 → 주간 환산 (÷4)
    const yld = id === 'blackmage' ? Math.floor(raw / 4) : raw;
    weekly += yld;
    if (!sel.cleared) weeklyFirst += yld;
  }
  return { weekly, weeklyFirst, mult };
}

function renderGenesis() {
  const panel = document.getElementById('lib-genesis');
  const { weekly, weeklyFirst, mult } = genTraceSums();

  const held       = Math.max(0, genState.held);
  const questCum   = (GENESIS_QUESTS[genState.quest] || GENESIS_QUESTS[0]).cum;
  const totalSpent = questCum + held;
  const remaining  = Math.max(0, GENESIS_TARGET - totalSpent);
  const pct        = Math.min(100, Math.round(totalSpent / GENESIS_TARGET * 100));

  // 금주 격파한 보스는 1주차 수입에서 제외
  const weeksLeft = (() => {
    if (weekly <= 0) return Infinity;
    if (remaining <= 0) return 0;
    if (remaining <= weeklyFirst) return 1;
    return 1 + Math.ceil((remaining - weeklyFirst) / weekly);
  })();
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
              <span>${id === 'blackmage' ? '금월 격파' : '금주 격파'}</span>
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
        <div class="gen-stat2"><span>보유 흔적</span><b>${fmtTrace(held)}</b></div>
        <div class="gen-stat2"><span>누적 진행</span><b>${fmtTrace(totalSpent)}</b></div>
        <div class="gen-stat2"><span>남은 흔적</span><b>${fmtTrace(remaining)}</b></div>
        <div class="gen-stat2-div"></div>
        <div class="gen-stat2"><span>주간 흔적</span><b>${fmtTrace(weeklyFirst)}</b></div>
        <div class="gen-stat2-div"></div>
        <div class="gen-stat2"><span>남은 기간</span><b>${durationStr}</b></div>

        <div class="gen-date-wrap">
          <div class="gen-date-label">예상 해방 날짜</div>
          <div class="gen-date-big">${targetDate}</div>
        </div>
      </div>
    </div>`;

  // 이벤트
  const genHeldEl = document.getElementById('genHeld');
  const applyHeld = e => {
    genState.held = Math.max(0, Math.min(TRACE_HOLD_MAX, parseInt(e.target.value) || 0));
    saveGen(); renderGenesis();
  };
  genHeldEl.addEventListener('change', applyHeld);
  genHeldEl.addEventListener('keydown', e => { if (e.key === 'Enter') applyHeld(e); });
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
      saveGen(); renderGenesis();
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

