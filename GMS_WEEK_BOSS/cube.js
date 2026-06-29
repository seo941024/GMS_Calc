/* ═══════════════════════════════════════════════
   큐브 기댓값 계산기
═══════════════════════════════════════════════ */

const CUBE_MESO = { red: 12_000_000, black: 22_000_000 };

function _cubeActiveType() {
  return document.querySelector('.cube-type-btn.active')?.dataset.type || 'red';
}

// ── 목표 옵션 행 관리 ───────────────────────────

function _cubeAddGoalRow() {
  const container = document.getElementById('cubeManualGoals');
  if (!container || container.children.length >= 3) return;
  const row = document.createElement('div');
  row.className = 'cube-manual-goal-row';
  row.innerHTML = `
    <input type="text"   class="inp cube-goal-label" placeholder="옵션명 (예: 공격력 23%)">
    <input type="number" class="inp cube-goal-prob"  placeholder="확률" step="0.0001" min="0" max="100">
    <span class="cube-goal-unit">%</span>
    <button class="cube-goal-del" title="삭제">✕</button>`;
  row.querySelector('.cube-goal-del').addEventListener('click', () => {
    row.remove();
    _updateAddGoalBtn();
  });
  container.appendChild(row);
  _updateAddGoalBtn();
}

function _updateAddGoalBtn() {
  const btn = document.getElementById('cubeAddGoalBtn');
  if (btn) btn.disabled = (document.querySelectorAll('.cube-manual-goal-row').length >= 3);
}

function _cubeGetGoalProbs() {
  return [...document.querySelectorAll('.cube-manual-goal-row')]
    .map(row => ({
      label: row.querySelector('.cube-goal-label')?.value.trim() || '',
      prob:  parseFloat(row.querySelector('.cube-goal-prob')?.value) || 0,
    }))
    .filter(g => g.prob > 0);
}

// ── 포함-배제 확률 계산 ─────────────────────────

function _cubeLineProb(lineOpts, option) {
  const total = lineOpts.reduce((s, o) => s + o.probability, 0);
  if (!total) return 0;
  return lineOpts.filter(o => o.option === option).reduce((s, o) => s + o.probability, 0) / total;
}

function _cubeExactP(lineData, goals) {
  const n = goals.length;
  if (!n) return 0;
  const lines = ['line1','line2','line3'].map(k => lineData[k] || []);
  const p = lines.map(opts => goals.map(g => _cubeLineProb(opts, g)));

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
    const req = [new Set(), new Set(), new Set()];
    for (const bi of chosen) {
      const inj = injections[bi];
      for (let k = 0; k < n; k++) req[inj[k]].add(k);
    }
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

// goals: [{prob}], prob = 한 줄에 뜰 확률 (0~100)
function _cubeManualExactP(goals) {
  const n = goals.length;
  if (!n) return 0;
  const probs   = goals.map(g => g.prob / 100);
  const totalP  = probs.reduce((s, p) => s + p, 0);
  const names   = probs.map((_, i) => `__g${i}__`);
  const buildLine = () => {
    const opts = probs.map((p, i) => ({ option: names[i], probability: p }));
    const rest = 1 - totalP;
    if (rest > 0) opts.push({ option: '__rest__', probability: rest });
    return opts;
  };
  const lineData = { line1: buildLine(), line2: buildLine(), line3: buildLine() };
  return _cubeExactP(lineData, names);
}

// ── 결과 렌더 ───────────────────────────────────

const _SIM_N = 100_000;

function _cubeRenderExpected(pSuccess, type) {
  const el    = document.getElementById('cubeResults');
  const meso  = CUBE_MESO[type] ?? null;
  const eCubes = 1 / pSuccess;
  const simHits = Math.round(_SIM_N * pSuccess);

  el.innerHTML = `
    <div class="sf-res-item"><span class="sf-res-label">성공 확률</span><span class="sf-res-val big">${(pSuccess * 100).toFixed(4)}%</span></div>
    <div class="sf-res-item"><span class="sf-res-label">기댓값 (평균 큐브 수)</span><span class="sf-res-val">${Math.ceil(eCubes).toLocaleString()} 개</span></div>
    ${meso != null ? `<div class="sf-res-item"><span class="sf-res-label">기댓값 (평균 메소)</span><span class="sf-res-val">${fmtMeso(Math.round(eCubes * meso))}</span></div>` : ''}
    <div class="sf-res-item"><span class="sf-res-label">10만 회 시도 시 기대 성공</span><span class="sf-res-val">${simHits.toLocaleString()} 회</span></div>
    <div class="sf-res-item"><span class="sf-res-label">10% 확률 이내</span><span class="sf-res-val">${Math.ceil(eCubes * 0.105).toLocaleString()} 개</span></div>
    <div class="sf-res-item"><span class="sf-res-label">90% 확률 이내</span><span class="sf-res-val" style="color:var(--danger)">${Math.ceil(eCubes * 2.303).toLocaleString()} 개</span></div>`;
}

// ── 초기화 ──────────────────────────────────────

async function initCube() {
  _cubeAddGoalRow();

  document.querySelectorAll('.cube-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cube-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('cubeAddGoalBtn')?.addEventListener('click', _cubeAddGoalRow);

  document.getElementById('cubeExpectedBtn')?.addEventListener('click', () => {
    const goals = _cubeGetGoalProbs();
    const el    = document.getElementById('cubeResults');
    if (!goals.length) { alert('목표 옵션 확률을 1개 이상 입력하세요.'); return; }

    const pSuccess = _cubeManualExactP(goals);
    if (!pSuccess) { el.innerHTML = '<p class="empty">확률이 0입니다. 입력값을 확인하세요.</p>'; return; }

    _cubeRenderExpected(pSuccess, _cubeActiveType());
  });
}
