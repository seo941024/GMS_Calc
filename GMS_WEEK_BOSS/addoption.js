/* ═══════════════════════════════════════════════
   추옵(환생의 불꽃) 시뮬레이터
═══════════════════════════════════════════════ */

const FLAME_TYPES = {
  POWERFUL: { label: '강환불', img: 'images/icons/flame_powerful.png', prob: [0.20, 0.30, 0.36, 0.14, 0.00] },
  ETERNAL:  { label: '영환불', img: 'images/icons/flame_eternal.png',  prob: [0.00, 0.29, 0.45, 0.25, 0.01] },
  ABYSS:    { label: '심환불', img: 'images/icons/flame_abyss.png',    prob: [0.00, 0.00, 0.63, 0.34, 0.03] },
};

const FLAME_OPTIONS_ARMOR  = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','ATTACK','MAGIC ATK','ALL%'];
const FLAME_OPTIONS_WEAPON = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','ATTACK','MAGIC ATK','ALL%','보공%','데미지%'];

const FLAME_OPTION_LABELS = {
  'STR':'STR', 'DEX':'DEX', 'INT':'INT', 'LUK':'LUK',
  'STR+DEX':'STR+DEX', 'STR+INT':'STR+INT', 'STR+LUK':'STR+LUK',
  'DEX+INT':'DEX+INT', 'DEX+LUK':'DEX+LUK', 'INT+LUK':'INT+LUK',
  'HP':'HP', 'ATTACK':'공격력', 'MAGIC ATK':'마력',
  'ALL%':'올스탯%', '보공%':'보스데미지%', '데미지%':'데미지%',
};

function flameStatValue(option, tier, level, isBoss) {
  const w = isBoss ? 2 : 0;
  const t = tier; // 1-5
  if (['STR','DEX','INT','LUK'].includes(option))
    return (Math.floor(level / 20) + 1) * (t + w);
  if (['STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK'].includes(option))
    return (Math.floor(level / 40) + 1) * (t + w);
  if (['ALL%','ATTACK','MAGIC ATK','데미지%'].includes(option))
    return t + w;
  if (option === '보공%')
    return (t + w) * 2;
  if (option === 'HP')
    return Math.floor(level / 10) * 30 * (t + w);
  return 0;
}

function flameUnit(option) {
  if (['ALL%','보공%','데미지%'].includes(option)) return '%';
  if (['ATTACK','MAGIC ATK'].includes(option)) return '';
  if (option === 'HP') return '';
  return '';
}

/* 랜덤 티어 뽑기 (확률 배열 기반) */
function rollTier(prob) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < prob.length; i++) {
    acc += prob[i];
    if (r < acc) return i + 1; // tier 1~5
  }
  return prob.length;
}

/* 불꽃 1회 굴리기: 4라인, 중복 없이 */
function rollFlame(flameKey, level, isBoss, isWeapon) {
  const { prob } = FLAME_TYPES[flameKey];
  const pool = isWeapon ? [...FLAME_OPTIONS_WEAPON] : [...FLAME_OPTIONS_ARMOR];
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const opt = pool.splice(idx, 1)[0];
    const tier = rollTier(prob);
    lines.push({ opt, tier, val: flameStatValue(opt, tier, level, isBoss) });
  }
  return lines;
}

/* 목표 달성 여부 체크 */
function checkGoals(lines, goals) {
  return goals.every(g => {
    if (!g.opt || g.opt === 'none') return true;
    const match = lines.find(l => l.opt === g.opt);
    // 단계 1=최고, 단계 5=최저 → 단계 n 이상 = old tier >= (6-n)
    return match && match.tier >= (6 - g.minTier);
  });
}

let _flameChart = null;
let _flameSimWorker = null;
let _flameRunning = false;

function _flameGetFlameKey() {
  return document.querySelector('#flameTypeGroup .sf-toggle.active')?.dataset.val || 'POWERFUL';
}
function _flameGetLevel()   { return Math.max(100, Math.min(250, parseInt(document.getElementById('flameLevel').value) || 150)); }
function _flameGetIsBoss()  { return document.getElementById('flameBoss').checked; }
function _flameGetIsWeapon(){ return document.querySelector('#flameEquipGroup .sf-toggle.active')?.dataset.val === 'weapon'; }

function flameGetGoals() {
  const goals = [];
  for (let i = 1; i <= 3; i++) {
    const opt = document.getElementById(`flameGoalOpt${i}`)?.value;
    const tier = parseInt(document.getElementById(`flameGoalTier${i}`)?.value) || 1;
    if (opt && opt !== 'none') goals.push({ opt, minTier: tier });
  }
  return goals;
}

function flameRefreshOptionSelects() {
  const isWeapon = _flameGetIsWeapon();
  const pool = isWeapon ? FLAME_OPTIONS_WEAPON : FLAME_OPTIONS_ARMOR;
  for (let i = 1; i <= 3; i++) {
    const sel = document.getElementById(`flameGoalOpt${i}`);
    if (!sel) continue;
    const cur = sel.value;
    sel.innerHTML = `<option value="none">— 없음 —</option>` +
      pool.map(o => `<option value="${o}"${o===cur?' selected':''}>${FLAME_OPTION_LABELS[o]||o}</option>`).join('');
  }
}

function flameBuildStatTable() {
  const flameKey = _flameGetFlameKey();
  const level    = _flameGetLevel();
  const isBoss   = _flameGetIsBoss();
  const isWeapon = _flameGetIsWeapon();
  const pool = isWeapon ? FLAME_OPTIONS_WEAPON : FLAME_OPTIONS_ARMOR;
  const { prob } = FLAME_TYPES[flameKey];

  // 단계 1=최고(old T5) ~ 단계 5=최저(old T1), 역순 표시
  const rows = pool.map(opt => {
    const vals = [5,4,3,2,1].map(t => {
      const v = flameStatValue(opt, t, level, isBoss);
      const unit = ['ALL%','보공%','데미지%','ATTACK','MAGIC ATK'].includes(opt) ? '%' : '';
      return `<td class="${prob[t-1]===0?'flame-t--zero':''}">${prob[t-1]>0 ? v+unit : '—'}</td>`;
    });
    return `<tr>
      <td class="flame-opt-lbl">${FLAME_OPTION_LABELS[opt]||opt}</td>
      ${vals.join('')}
    </tr>`;
  }).join('');

  // 헤더도 단계 1(=old T5)부터 역순
  const tierProbs = [5,4,3,2,1].map(t => {
    const p = prob[t-1];
    const step = 6 - t; // 단계 번호
    return `<th>${p>0 ? `단계 ${step}<br><span class="flame-th-prob">${(p*100).toFixed(0)}%</span>` : `<span class="flame-t--zero">단계 ${step}</span>`}</th>`;
  }).join('');

  document.getElementById('flameStatTable').innerHTML = `
    <table class="flame-tbl">
      <thead><tr>
        <th>스탯</th>
        ${tierProbs}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function flameSimulate() {
  const flameKey = _flameGetFlameKey();
  const level    = _flameGetLevel();
  const isBoss   = _flameGetIsBoss();
  const isWeapon = _flameGetIsWeapon();
  const goals    = flameGetGoals();

  if (!goals.length) {
    document.getElementById('flameSimResult').innerHTML = '<p class="empty">목표 옵션을 설정하세요.</p>';
    return;
  }

  const N = 50_000;
  const counts = [];
  for (let i = 0; i < N; i++) {
    let attempts = 0;
    while (true) {
      attempts++;
      const lines = rollFlame(flameKey, level, isBoss, isWeapon);
      if (checkGoals(lines, goals)) break;
    }
    counts.push(attempts);
  }
  counts.sort((a, b) => a - b);

  const mean = counts.reduce((s, c) => s + c, 0) / N;
  const p50  = counts[Math.floor(N * 0.50)];
  const p75  = counts[Math.floor(N * 0.75)];
  const p90  = counts[Math.floor(N * 0.90)];
  const p99  = counts[Math.floor(N * 0.99)];

  /* 히스토그램 */
  const BINS = 40;
  const step = Math.max(1, Math.ceil(p99 / BINS));
  const buckets = Array(BINS).fill(0);
  counts.forEach(c => { const idx = Math.floor(c / step); if (idx < BINS) buckets[idx]++; });
  const labels = buckets.map((_, i) => `${Math.round(step * (i + 0.5))}회`);

  const canvas = document.getElementById('flameChart');
  if (_flameChart) { _flameChart.destroy(); _flameChart = null; }
  _flameChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: '빈도', data: buckets,
        backgroundColor: 'rgba(251,191,36,0.45)',
        borderColor: 'rgba(251,191,36,0.8)',
        borderWidth: 1, borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: items => labels[items[0].dataIndex],
          label: item  => `${item.raw.toLocaleString()}회 (${(item.raw/N*100).toFixed(1)}%)`
        }}
      },
      scales: {
        x: { ticks: { color:'rgba(200,190,240,.6)', font:{size:9}, maxTicksLimit:10, maxRotation:45 }, grid:{color:'rgba(255,255,255,.05)'} },
        y: { ticks: { color:'rgba(200,190,240,.6)', font:{size:10} }, grid:{color:'rgba(255,255,255,.08)'} }
      }
    }
  });

  document.getElementById('flameSimResult').innerHTML = `
    <div class="sf-res-grid" style="margin-top:12px">
      <div class="sf-res-item"><span class="sf-res-label">평균 시도</span><span class="sf-res-val">${mean.toFixed(1)}회</span></div>
      <div class="sf-res-item"><span class="sf-res-label">50% (중앙값)</span><span class="sf-res-val">${p50}회</span></div>
      <div class="sf-res-item"><span class="sf-res-label">75%</span><span class="sf-res-val">${p75}회</span></div>
      <div class="sf-res-item"><span class="sf-res-label">90%</span><span class="sf-res-val">${p90}회</span></div>
      <div class="sf-res-item"><span class="sf-res-label">99%</span><span class="sf-res-val">${p99}회</span></div>
    </div>`;
}

function initAddOption() {
  const sec = document.getElementById('sec-addoption');
  if (!sec) return;

  const flameTypeButtons = Object.entries(FLAME_TYPES).map(([key, { label, img }]) =>
    `<button class="sf-toggle${key==='POWERFUL'?' active':''}" data-val="${key}">
      <img src="${img}" class="flame-type-icon" onerror="this.style.display='none'" />${label}
    </button>`
  ).join('');

  const goalRows = [1,2,3].map(i => `
    <div class="form-grid" style="grid-template-columns:1fr auto;gap:8px;align-items:center">
      <select class="sel" id="flameGoalOpt${i}"><option value="none">— 없음 —</option></select>
      <div style="display:flex;align-items:center;gap:6px">
        <select class="sel" id="flameGoalTier${i}" style="width:90px">
          ${[1,2,3,4,5].map(t=>`<option value="${t}"${t===3?' selected':''}>단계 ${t}</option>`).join('')}
        </select>
        <span style="font-size:.8rem;color:var(--text-sub)">옵션</span>
      </div>
    </div>`).join('');

  sec.innerHTML = `
    <div class="sec-head"><h2 class="sec-title">추옵 시뮬레이터</h2></div>
    <div class="sf-layout">

      <!-- 좌측: 설정 -->
      <div class="card" style="display:flex;flex-direction:column;gap:16px">

        <div>
          <div class="card__title">장비 종류</div>
          <div class="sf-toggle-group" id="flameEquipGroup" style="margin-top:8px">
            <button class="sf-toggle active" data-val="armor">장비</button>
            <button class="sf-toggle" data-val="weapon">무기</button>
          </div>
        </div>

        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">
          <div class="field">
            <label class="field__label">장비 레벨</label>
            <input class="inp" id="flameLevel" type="number" value="200" min="100" max="250" step="10" />
          </div>
          <div class="field" style="justify-content:flex-end;padding-top:22px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;color:var(--text-sub)">
              <input type="checkbox" id="flameBoss" />
              보스 장비
            </label>
          </div>
        </div>

        <div>
          <div class="card__title">불꽃 종류</div>
          <div class="sf-toggle-group" id="flameTypeGroup" style="margin-top:8px;flex-wrap:wrap">
            ${flameTypeButtons}
          </div>
        </div>

        <div>
          <div class="card__title">목표 옵션 <span style="font-size:.75rem;font-weight:400;color:var(--text-sub)">(최대 3개)</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
            ${goalRows}
          </div>
        </div>

        <button class="sbtn sbtn--ghost w100" id="flameBtnSim">시뮬레이션 (50,000회)</button>
      </div>

      <!-- 우측: 결과 -->
      <div class="sf-right" style="display:flex;flex-direction:column;gap:16px">

        <div class="card">
          <div class="card__title">티어별 스탯 참조</div>
          <div id="flameStatTable" style="margin-top:10px;overflow-x:auto"></div>
        </div>

        <div class="card sf-chart-card">
          <div class="sf-chart-header"><span class="sf-chart-lbl">시뮬레이션 결과</span></div>
          <div class="sf-chart-box"><canvas id="flameChart"></canvas></div>
          <div id="flameSimResult"><p class="empty">시뮬레이션 버튼을 눌러주세요.</p></div>
        </div>

      </div>
    </div>`;

  /* 이벤트 */
  const refresh = () => { flameBuildStatTable(); flameRefreshOptionSelects(); };

  sec.querySelectorAll('#flameEquipGroup .sf-toggle, #flameTypeGroup .sf-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.sf-toggle-group').querySelectorAll('.sf-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      refresh();
    });
  });

  document.getElementById('flameLevel').addEventListener('change', refresh);
  document.getElementById('flameBoss').addEventListener('change', refresh);
  document.getElementById('flameBtnSim').addEventListener('click', flameSimulate);

  refresh();
}

initAddOption();
