/* ═══════════════════════════════════════════════
   추옵(환생의 불꽃) 시뮬레이터
═══════════════════════════════════════════════ */

const FLAME_TYPES = {
  POWERFUL: { label: '강환불', img: 'images/icons/flame_powerful.png', prob: [0.20, 0.30, 0.36, 0.14, 0.00] },
  ETERNAL:  { label: '영환불', img: 'images/icons/flame_eternal.png',  prob: [0.00, 0.29, 0.45, 0.25, 0.01] },
  ABYSS:    { label: '심환불', img: 'images/icons/flame_abyss.png',    prob: [0.00, 0.00, 0.63, 0.34, 0.03] },
};

// 시뮬레이션 풀 (전체 17개 / 무기 19개) — MP·방어력·착용레벨감소 포함
const FLAME_OPTIONS_ARMOR  = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','MP','방어력','착용레벨감소','ATTACK','MAGIC ATK','ALL%'];
const FLAME_OPTIONS_WEAPON = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','MP','방어력','착용레벨감소','ATTACK','MAGIC ATK','ALL%','보공%','데미지%'];

// 스탯 테이블 표시 옵션
const FLAME_DISPLAY_ARMOR  = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','MP','ALL%','ATTACK','MAGIC ATK','방어력','착용레벨감소'];
const FLAME_DISPLAY_WEAPON = ['STR','DEX','INT','LUK','STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK','HP','MP','ALL%','ATTACK','MAGIC ATK','보공%','데미지%','방어력','착용레벨감소'];

const FLAME_OPTION_LABELS = {
  'STR':'STR', 'DEX':'DEX', 'INT':'INT', 'LUK':'LUK',
  'STR+DEX':'STR+DEX', 'STR+INT':'STR+INT', 'STR+LUK':'STR+LUK',
  'DEX+INT':'DEX+INT', 'DEX+LUK':'DEX+LUK', 'INT+LUK':'INT+LUK',
  'HP':'HP', 'MP':'MP', '방어력':'방어력', '착용레벨감소':'착감',
  'ATTACK':'공격력', 'MAGIC ATK':'마력',
  'ALL%':'올스탯%', '보공%':'보스데미지%', '데미지%':'데미지%',
};

function flameStatValue(option, tier, level, isBoss) {
  const w = isBoss ? 2 : 0;
  const t = tier; // 1-5
  if (['STR','DEX','INT','LUK','방어력'].includes(option))
    return (Math.floor(level / 20) + 1) * (t + w);
  if (['STR+DEX','STR+INT','STR+LUK','DEX+INT','DEX+LUK','INT+LUK'].includes(option))
    return (Math.floor(level / 40) + 1) * (t + w);
  if (['ALL%','ATTACK','MAGIC ATK','데미지%'].includes(option))
    return t + w;
  if (option === '보공%')
    return (t + w) * 2;
  if (['HP','MP'].includes(option))
    return Math.floor(level / 10) * 30 * (t + w);
  if (option === '착용레벨감소')
    return -((t + w) * 5);
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
  for (let i = 1; i <= 4; i++) {
    const opt = document.getElementById(`flameGoalOpt${i}`)?.value;
    const tier = parseInt(document.getElementById(`flameGoalTier${i}`)?.value) || 1;
    if (opt && opt !== 'none') goals.push({ opt, minTier: tier });
  }
  return goals;
}

function flameRefreshOptionSelects() {
  const isWeapon  = _flameGetIsWeapon();
  const isBoss    = _flameGetIsBoss();
  const display   = isWeapon ? FLAME_DISPLAY_WEAPON : FLAME_DISPLAY_ARMOR;
  const { prob }  = FLAME_TYPES[_flameGetFlameKey()];
  const gradeOffset = isBoss ? 2 : 0; // 보스=3추~7추, 비보스=1추~5추

  for (let i = 1; i <= 4; i++) {
    const sel = document.getElementById(`flameGoalOpt${i}`);
    if (!sel) continue;
    const cur = sel.value;
    sel.innerHTML = `<option value="none">— 없음 —</option>` +
      display.map(o => `<option value="${o}"${o===cur?' selected':''}>${FLAME_OPTION_LABELS[o]||o}</option>`).join('');

    const tierSel = document.getElementById(`flameGoalTier${i}`);
    if (!tierSel) continue;
    const curTier = tierSel.value;

    // 티어 라벨 갱신 (보스/비보스 따라 추 번호 변경)
    // value 1=최고(oldT5), value 5=최저(oldT1)
    Array.from(tierSel.options).forEach(opt => {
      const val = parseInt(opt.value);
      const oldTier = 6 - val; // val1→oldT5, val5→oldT1
      opt.text = `${oldTier + gradeOffset}추`;
      opt.disabled = prob[oldTier - 1] === 0;
    });
    tierSel.value = curTier;

    // 현재 선택값이 disabled면 첫 번째 가능한 값으로 이동
    if (tierSel.options[tierSel.selectedIndex]?.disabled) {
      const first = Array.from(tierSel.options).find(o => !o.disabled);
      if (first) tierSel.value = first.value;
    }
  }
}

function flameBuildStatTable() {
  const flameKey = _flameGetFlameKey();
  const level    = _flameGetLevel();
  const isBoss   = _flameGetIsBoss();
  const isWeapon = _flameGetIsWeapon();
  const display = isWeapon ? FLAME_DISPLAY_WEAPON : FLAME_DISPLAY_ARMOR;
  const { prob } = FLAME_TYPES[flameKey];

  // 단계 1=최고(old T5) ~ 단계 5=최저(old T1), 역순 표시
  const rows = display.map(opt => {
    const vals = [5,4,3,2,1].map(t => {
      const v = flameStatValue(opt, t, level, isBoss);
      const unit = ['ALL%','보공%','데미지%'].includes(opt) ? '%' : '';
      return `<td class="${prob[t-1]===0?'flame-t--zero':''}">${prob[t-1]>0 ? v+unit : '—'}</td>`;
    });
    return `<tr>
      <td class="flame-opt-lbl">${FLAME_OPTION_LABELS[opt]||opt}</td>
      ${vals.join('')}
    </tr>`;
  }).join('');

  // 헤더: 보스 장비 여부에 따라 추 라벨 변경 (보스=t+2, 비보스=t)
  const gradeOffset = isBoss ? 2 : 0;
  const tierProbs = [5,4,3,2,1].map(t => {
    const p = prob[t-1];
    const label = `${t+gradeOffset}추`;
    const probStr = p > 0 ? `${(p*100).toFixed(0)}%` : '—';
    const probCls = p > 0 ? 'flame-th-prob' : 'flame-th-prob flame-t--zero';
    return `<th><span class="${p===0?'flame-t--zero':''}">${label}</span><br><span class="${probCls}">${probStr}</span></th>`;
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

function _runSim(N, flameKey, level, isBoss, isWeapon, goals) {
  const MAX_PER = 2_000_000;
  const counts = [];
  for (let i = 0; i < N; i++) {
    let a = 0;
    while (a < MAX_PER) {
      a++;
      if (checkGoals(rollFlame(flameKey, level, isBoss, isWeapon), goals)) break;
    }
    counts.push(a);
  }
  return counts;
}

function _isGoalPossible(flameKey, goals) {
  const { prob } = FLAME_TYPES[flameKey];
  return goals.every(g => {
    if (!g.opt || g.opt === 'none') return true;
    const minOldTier = 6 - g.minTier; // minTier 1(7추)→oldT5, 5(3추)→oldT1
    // 해당 tier 이상의 확률 합이 0이면 불가능
    const possible = prob.slice(minOldTier - 1).some(p => p > 0);
    return possible;
  });
}

function flameSimulate() {
  const flameKey = _flameGetFlameKey();
  const level    = _flameGetLevel();
  const isBoss   = _flameGetIsBoss();
  const isWeapon = _flameGetIsWeapon();
  const goals    = flameGetGoals();
  const resEl    = document.getElementById('flameSimResult');

  if (!goals.length) {
    resEl.innerHTML = '<p class="empty">목표 옵션을 설정하세요.</p>';
    return;
  }

  if (!_isGoalPossible(flameKey, goals)) {
    resEl.innerHTML = '<p class="empty" style="color:#f87171">선택한 불꽃으로는 달성 불가능한 목표입니다.</p>';
    return;
  }

  resEl.innerHTML = '<p class="empty">계산 중...</p>';

  setTimeout(() => {
    const N_INIT = 100_000;
    let counts = _runSim(N_INIT, flameKey, level, isBoss, isWeapon, goals);
    let N = N_INIT;

    const successRate = counts.filter(c => c < 2_000_000).length / N_INIT;

    // 달성률 1% 미만 → 사실상 불가능으로 처리
    if (successRate < 0.01) {
      resEl.innerHTML = `<p class="empty" style="color:#f87171">목표 달성 확률이 너무 낮습니다. (${(successRate*100).toFixed(2)}% 미만)</p>`;
      return;
    }

    // 달성률 50% 미만이면 100만회로 확장
    if (successRate < 0.5) {
      counts = _runSim(1_000_000, flameKey, level, isBoss, isWeapon, goals);
      N = 1_000_000;
    }

    counts.sort((a, b) => a - b);
    const mean = Math.round(counts.reduce((s, c) => s + c, 0) / N);

    const pcts = [50, 75, 90, 95, 99];
    const rows = pcts.map(pct => {
      const val = counts[Math.floor(N * pct / 100)];
      return `<div class="sf-res-item">
        <span class="sf-res-label">상위 ${100-pct}%</span>
        <span class="sf-res-val">${val.toLocaleString()}개 사용</span>
      </div>`;
    }).join('');

    resEl.innerHTML = `
      <div class="sf-res-item" style="border-bottom:1px solid var(--border);margin-bottom:4px">
        <span class="sf-res-label">평균</span>
        <span class="sf-res-val">${mean.toLocaleString()}개 사용</span>
      </div>
      ${rows}
      <p style="font-size:.75rem;color:var(--text-sub);margin-top:10px;text-align:right">시뮬레이션 ${N.toLocaleString()}회 기반 확률입니다.</p>`;
  }, 0);
}

function initAddOption() {
  const sec = document.getElementById('sec-addoption');
  if (!sec) return;

  const flameTypeButtons = Object.entries(FLAME_TYPES).map(([key, { label, img }]) =>
    `<button class="sf-toggle${key==='POWERFUL'?' active':''}" data-val="${key}">
      <img src="${img}" class="flame-type-icon" onerror="this.style.display='none'" />${label}
    </button>`
  ).join('');

  const goalRows = [1,2,3,4].map(i => `
    <div class="form-grid" style="grid-template-columns:1fr auto;gap:8px;align-items:center">
      <select class="sel" id="flameGoalOpt${i}"><option value="none">— 없음 —</option></select>
      <div style="display:flex;align-items:center;gap:6px">
        <select class="sel" id="flameGoalTier${i}" style="width:90px">
          ${[1,2,3,4,5].map(t=>`<option value="${t}"${t===3?' selected':''}>${8-t}추</option>`).join('')}
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
              <input type="checkbox" id="flameBoss" checked />
              보스 장비
            </label>
          </div>
        </div>

        <div>
          <div class="card__title">불꽃 선택</div>
          <div class="sf-toggle-group" id="flameTypeGroup" style="margin-top:8px;flex-wrap:wrap">
            ${flameTypeButtons}
          </div>
        </div>

        <div>
          <div class="card__title">목표 옵션</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
            ${goalRows}
          </div>
        </div>

        <button class="sbtn sbtn--ghost w100" id="flameBtnSim">시뮬레이션</button>
      </div>

      <!-- 우측: 결과 -->
      <div class="sf-right" style="display:flex;flex-direction:column;gap:16px">

        <div class="card">
          <div class="card__title">티어별 스탯 참조</div>
          <div id="flameStatTable" style="margin-top:10px;overflow-x:auto"></div>
        </div>

        <div class="card">
          <div class="card__title">시뮬레이션 결과</div>
          <div id="flameSimResult" style="margin-top:10px"><p class="empty">시뮬레이션 버튼을 눌러주세요.</p></div>
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

  const levelEl = document.getElementById('flameLevel');
  levelEl.addEventListener('change', () => {
    const v = Math.max(100, Math.min(250, parseInt(levelEl.value) || 150));
    levelEl.value = v;
    refresh();
  });
  levelEl.addEventListener('input', () => {
    const v = parseInt(levelEl.value);
    if (!isNaN(v) && v > 250) levelEl.value = 250;
  });
  document.getElementById('flameBoss').addEventListener('change', refresh);
  document.getElementById('flameBtnSim').addEventListener('click', flameSimulate);

  refresh();
}

initAddOption();
