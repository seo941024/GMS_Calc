/* =============================================
   app.js — 네비게이션 + 주보 트래커
   ============================================= */

/* ── state ── */
let state = { chars: [], activeChar: -1, region: 'na' };
const STORAGE_KEY = 'gms_boss_v2';

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) state = JSON.parse(r); }
  catch {}
  if (!state.chars) state.chars = [];
  if (state.activeChar === undefined) state.activeChar = -1;
  if (!state.region) state.region = 'na';
}

/* ── 서버(NA/EU) 토글 ── */
function applyRegionUI() {
  document.querySelectorAll('.region-toggle__btn').forEach(b =>
    b.classList.toggle('active', b.dataset.region === state.region));
}
document.querySelectorAll('.region-toggle__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.region = btn.dataset.region;
    save();
    applyRegionUI();
  });
});

/* ── 리셋 타이머 (목요일 09:00 KST) ── */
function nextResetKST() {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone:'Asia/Seoul' }));
  let diff = (4 - kst.getDay() + 7) % 7 || 7;
  const next = new Date(kst);
  next.setDate(kst.getDate() + diff);
  next.setHours(9, 0, 0, 0);
  if (next <= kst) next.setDate(next.getDate() + 7);
  return next;
}
function tickTimer() {
  const kst  = new Date(new Date().toLocaleString('en-US', { timeZone:'Asia/Seoul' }));
  const diff = nextResetKST() - kst;
  const p = n => String(n).padStart(2,'0');
  const d = Math.floor(diff/86400000);
  const h = Math.floor((diff%86400000)/3600000);
  const m = Math.floor((diff%3600000)/60000);
  const s = Math.floor((diff%60000)/1000);
  document.getElementById('resetTimer').textContent = `${d}일 ${p(h)}:${p(m)}:${p(s)}`;
}
tickTimer(); setInterval(tickTimer, 1000);

/* ── 네비게이션 ── */
function navigateTo(sec) {
  document.querySelectorAll('.sb-nav__item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  const btn = document.querySelector(`.sb-nav__item[data-sec="${sec}"]`);
  if (btn) btn.classList.add('active');
  const secEl = document.getElementById('sec-' + sec);
  if (secEl) secEl.classList.add('active');
  if (sec === 'charinfo') renderCharInfo();
  if (sec === 'bosshp')    renderBossHPTable();
  if (sec === 'starforce') renderSFRateTable();
  if (sec === 'hexa')      renderAllHexaLists();
}
document.querySelectorAll('.sb-nav__item').forEach(btn => {
  btn.addEventListener('click', () => { navigateTo(btn.dataset.sec); closeSidebar(); });
});
document.getElementById('headerLogo').addEventListener('click', () => navigateTo('charinfo'));

/* ── 모바일 사이드바 드로어 토글 ── */
function openSidebar()  { document.body.classList.add('sidebar-open'); }
function closeSidebar() { document.body.classList.remove('sidebar-open'); }
document.getElementById('btnHamburger')?.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-open');
});
document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);

/* ── 유틸 ── */
function fmtMeso(n) {
  return Math.round(n).toLocaleString() + ' 메소';
}

/* ── 토스트 알림 ── */
let _toastTimer = null;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  // reflow 후 show (연속 호출 시 애니메이션 재시작)
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function getMaxParty(boss, diff) {
  return typeof boss.maxParty === 'object' ? (boss.maxParty[diff] ?? 6) : boss.maxParty;
}
function ck(bossId, diff) { return `${bossId}_${diff}`; }

/* ── 결정석 ── */
function countWeeklyCrystals(ch) {
  let n = 0;
  Object.entries(ch.checks || {}).forEach(([key, v]) => {
    if (!v?.on) return;
    const bossId = key.slice(0, key.lastIndexOf('_'));
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (boss && !boss.monthly) n++;
  });
  return n;
}
function countMonthlyCrystals(ch) {
  let n = 0;
  Object.entries(ch.checks || {}).forEach(([key, v]) => {
    if (!v?.on) return;
    const bossId = key.slice(0, key.lastIndexOf('_'));
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (boss && boss.monthly) n++;
  });
  return n;
}
function countCrystals(ch) {
  return countWeeklyCrystals(ch) + countMonthlyCrystals(ch);
}
/* 한 캐릭터의 주간 보스 수익 합 */
function thursdaysInMonth() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) if (new Date(y, m, d).getDay() === 4) n++;
  return n;
}

function charWeeklyMeso(ch) {
  let sum = 0;
  Object.entries(ch.checks || {}).forEach(([key, v]) => {
    if (!v?.on) return;
    const us = key.lastIndexOf('_');
    const bossId = key.slice(0, us), diff = key.slice(us + 1);
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (!boss || !boss.diffs[diff] || boss.monthly) return; // 월간 보스 제외
    sum += Math.floor(boss.diffs[diff] / (v.party || 1));
  });
  return sum;
}

function charMonthlyMeso(ch) {
  const resets = thursdaysInMonth();
  let sum = 0;
  Object.entries(ch.checks || {}).forEach(([key, v]) => {
    if (!v?.on) return;
    const us = key.lastIndexOf('_');
    const bossId = key.slice(0, us), diff = key.slice(us + 1);
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (!boss || !boss.diffs[diff]) return;
    const count = boss.monthly ? 1 : resets;
    sum += Math.floor(boss.diffs[diff] / (v.party || 1)) * count;
  });
  return sum;
}

function updateCrystalBar() {
  const totalW = state.chars.reduce((s, c) => s + countWeeklyCrystals(c), 0);
  const totalM = state.chars.reduce((s, c) => s + countMonthlyCrystals(c), 0);
  const total  = Math.min(totalW + totalM, MAX_CRYSTALS);
  document.getElementById('totalCrystalCount').textContent = `${total} / ${MAX_CRYSTALS}`;
  document.getElementById('totalCrystalFill').style.width = (total/MAX_CRYSTALS*100) + '%';
  const elCW = document.getElementById('totalCrystalWeekly');
  if (elCW) elCW.textContent = totalW;
  const elCM = document.getElementById('totalCrystalMonthly');
  if (elCM) elCM.textContent = totalM;
  const weekTotal  = state.chars.reduce((s, c) => s + charWeeklyMeso(c), 0);
  const monthTotal = Math.max(0, state.chars.reduce((s, c) => s + charMonthlyMeso(c), 0) - rentalMonthlyCost());
  const elW = document.getElementById('totalWeekMeso');
  if (elW) elW.textContent = fmtMeso(weekTotal);
  const elM = document.getElementById('totalMonthMeso');
  if (elM) elM.textContent = fmtMeso(monthTotal);
}

/* ── 캐릭터 목록 렌더 (사이드바: active 1개만) ── */
function renderCharList() {
  const ul = document.getElementById('charList');
  ul.innerHTML = '';
  if (!state.chars.length) {
    ul.innerHTML = '<li style="text-align:center;color:var(--text-sub);font-size:.8rem;padding:14px">캐릭터를 추가하세요</li>';
    updateCrystalBar(); return;
  }
  const i  = state.activeChar ?? 0;
  const ch = state.chars[i];
  if (!ch) { updateCrystalBar(); return; }
  const li = document.createElement('li');
  li.className = 'char-card active';
  const portrait = ch.fetched?.img
    ? `<img src="${ch.fetched.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';this.parentElement.classList.add('char-card__portrait--no')" /><span class="char-card__noimg" style="display:none">NO IMAGE</span>`
    : `<span class="char-card__noimg">NO IMAGE</span>`;
  const jn = charJobName(ch);
  const world = ch.fetched?.world || '';
  const sIcon = world ? serverIconSrc(world) : '';
  const sIconHtml = sIcon ? `<img src="${sIcon}" onerror="this.style.display='none'" />` : '';
  li.innerHTML = `
    <div class="char-card__inner">
      <div class="char-card__txt">
        <div class="char-card__name">${ch.name}</div>
        <div class="char-card__lv">Lv.${ch.level}</div>
        ${world ? `<div class="char-card__world-line">${sIconHtml}${world}</div>` : ''}
        ${jn ? `<div class="char-card__job-line">${jn}</div>` : ''}
        <div class="char-card__btns">
          <button class="ccbtn ccbtn--edit" data-action="edit" data-i="${i}">수정</button>
          <button class="ccbtn ccbtn--del"  data-action="del"  data-i="${i}">삭제</button>
        </div>
      </div>
      <div class="char-card__portrait${ch.fetched?.img ? '' : ' char-card__portrait--no'}">${portrait}</div>
    </div>`;
  li.addEventListener('click', e => { if (!e.target.closest('[data-action]')) selectChar(i); });
  ul.appendChild(li);
  updateCrystalBar();
}

function selectChar(i) {
  state.activeChar = i;
  save();
  renderCharList();
  renderBossTable();
  renderCharInfo();
  syncServerHistThenRender(state.chars[i]);
}

/* ── 보스 테이블 렌더 ── */
function renderBossTable() {
  const ch  = state.chars[state.activeChar];
  const tb  = document.getElementById('bossTableBody');
  const nm  = document.getElementById('bossCharName');
  const cp  = document.getElementById('btnCrystalCount');

  if (!ch) {
    nm.textContent = '캐릭터를 선택하세요';
    cp.innerHTML = `<span class="cc-item"><img src="images/icons/weekly.webp" alt="">0개</span><span class="cc-item"><img src="images/icons/monthly.webp" alt="">0개</span>`;
    tb.innerHTML = `<tr><td colspan="4" class="empty">왼쪽에서 캐릭터를 선택하세요.</td></tr>`;
    document.getElementById('weeklyTotal').textContent = '0 메소';
    return;
  }

  const cW = countWeeklyCrystals(ch);
  const cM = countMonthlyCrystals(ch);
  nm.textContent = `${ch.name} 보스 목록`;
  cp.innerHTML = `<span class="cc-item"><img src="images/icons/weekly.webp" alt="">${cW}개</span><span class="cc-item"><img src="images/icons/monthly.webp" alt="">${cM}개</span>`;

  let total = 0;
  tb.innerHTML = '';

  BOSS_DATA.forEach(boss => {
    const locked = ch.level < boss.minLevel;
    const tr = document.createElement('tr');
    if (locked) tr.classList.add('locked');

    const diffs = Object.keys(boss.diffs);
    const activeDiff = diffs.find(d => ch.checks?.[ck(boss.id, d)]?.on);
    if (activeDiff) { tr.classList.add('done'); }

    const pillsHtml = `<div class="diff-btns" data-boss="${boss.id}">
      ${diffs.map(d =>
        `<span class="dpill ${DIFF_META[d].cls} dpill--sm${activeDiff===d?' sel':''}" data-boss="${boss.id}" data-diff="${d}">
          <span class="dpill__t">${DIFF_META[d].label}</span>
        </span>`
      ).join('')}
    </div>`;

    const maxP  = activeDiff ? getMaxParty(boss, activeDiff) : 6;
    const party = activeDiff ? (ch.checks[ck(boss.id, activeDiff)]?.party ?? 1) : null;
    const price = activeDiff ? Math.floor(boss.diffs[activeDiff] / party) : null;
    if (price && !boss.monthly) total += price; // 월간 보스는 주간 합계 제외

    const partyHtml = !activeDiff
      ? '<span class="party-dash">-</span>'
      : `<div class="party-stepper" data-boss="${boss.id}" data-diff="${activeDiff}">
           <button class="pm" ${party<=1?'disabled':''}>−</button>
           <span class="party-stepper__val">${party}</span>
           <button class="pp" ${party>=maxP?'disabled':''}>+</button>
         </div>`;

    const revHtml = price
      ? `<span class="rev-val">${fmtMeso(price)}</span>`
      : `<span class="rev-dash">-</span>`;

    tr.innerHTML = `
      <td><div class="boss-name-cell">
        <div class="boss-thumb"><img src="${boss.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="noimg" style="display:none">BOSS</span></div>
        <span class="boss-label">${boss.name}</span>
      </div></td>
      <td>${pillsHtml}</td>
      <td>${partyHtml}</td>
      <td>${revHtml}</td>`;
    tb.appendChild(tr);
  });

  const wCost = rentalWeeklyCost();
  const mCost = rentalMonthlyCost();
  const weekNet = total - wCost;
  const wEl2 = document.getElementById('weeklyTotal');
  wEl2.textContent = (weekNet < 0 ? '-' : '') + fmtMeso(Math.abs(weekNet));
  wEl2.style.color = weekNet < 0 ? '#f87171' : 'var(--accent)';
  const resets = thursdaysInMonth();
  const monthEl = document.getElementById('monthlyTotal');
  const monthSubEl = document.getElementById('monthResetCount');
  if (monthEl) {
    const monthNet = charMonthlyMeso(ch) - mCost;
    monthEl.textContent = (monthNet < 0 ? '-' : '') + fmtMeso(Math.abs(monthNet));
    monthEl.style.color = monthNet < 0 ? '#f87171' : '';
  }
  if (monthSubEl) monthSubEl.textContent = `(주${resets}회 기준)`;

  // 난이도 dpill 클릭 → 토글
  tb.querySelectorAll('.diff-btns .dpill').forEach(pill => {
    pill.addEventListener('click', () => {
      const bossId  = pill.dataset.boss;
      const diff    = pill.dataset.diff;
      const boss    = BOSS_DATA.find(b => b.id === bossId);
      const isActive = ch.checks?.[ck(bossId, diff)]?.on;
      if (!ch.checks) ch.checks = {};
      // 같은 보스 다른 난이도 해제
      Object.keys(boss.diffs).forEach(d => { ch.checks[ck(bossId,d)] = { on:false, party: ch.checks[ck(bossId,d)]?.party ?? 1 }; });
      if (!isActive) {
        if (state.chars.reduce((s,c)=>s+countCrystals(c),0) >= MAX_CRYSTALS) {
          showToast(`주간 결정석은 최대 ${MAX_CRYSTALS}개까지 판매 가능합니다.`);
          save(); renderBossTable(); renderCharList(); return;
        }
        if (!boss.monthly && countWeeklyCrystals(ch) >= 14) {
          showToast('캐릭터당 주간 보스는 최대 14개까지 선택 가능합니다.');
          save(); renderBossTable(); renderCharList(); return;
        }
        ch.checks[ck(bossId, diff)] = { on:true, party: ch.checks[ck(bossId, diff)]?.party ?? 1 };
      }
      save(); renderBossTable(); renderCharList();
    });
  });

  // stepper 클릭
  tb.querySelectorAll('.party-stepper').forEach(st => {
    const { boss: bossId, diff } = st.dataset;
    const key = ck(bossId, diff);
    const boss = BOSS_DATA.find(b => b.id === bossId);
    const maxP = getMaxParty(boss, diff);
    st.querySelector('.pm').addEventListener('click', () => {
      const cur = ch.checks[key]?.party ?? 1;
      if (cur > 1) { ch.checks[key].party = cur-1; save(); renderBossTable(); }
    });
    st.querySelector('.pp').addEventListener('click', () => {
      const cur = ch.checks[key]?.party ?? 1;
      if (cur < maxP) { ch.checks[key].party = cur+1; save(); renderBossTable(); }
    });
  });
}

/* ── 대여템 ── */
const RENTAL_ITEMS = [
  { id:'face',    img:'images/icons/Red_Beryl_Face_Accessory.png',   cost: 200_000_000 },
  { id:'eye',     img:'images/icons/Red_Beryl_Eye_Accessory.png',    cost: 200_000_000 },
  { id:'ear',     img:'images/icons/Red_Beryl_Earrings.png',         cost: 300_000_000 },
  { id:'pendant', img:'images/icons/Red_Beryl_Pendant.png',          cost: 300_000_000 },
  { id:'belt',    img:'images/icons/Red_Beryl_Belt.png',             cost: 300_000_000 },
  { id:'ror',     img:'images/icons/Finite_Red_Beryl_Ring(RoR).png', cost: 100_000_000 },
  { id:'cr',      img:'images/icons/Finite_Red_Beryl_Ring(CR).png',  cost: 100_000_000 },
  { id:'arthur',  img:'images/icons/Arthur_Totem.png',               cost: 100_000_000 },
  { id:'flash',   img:'images/icons/Flash_Totem.png',                cost: 100_000_000 },
  { id:'beryl',   img:'images/icons/Red_Beryl_Totem.png',            cost: 100_000_000 },
];

function getRentalState() {
  try { return JSON.parse(localStorage.getItem('rental') || '{"slots":[],"wed":false}'); }
  catch { return { slots: [], wed: false }; }
}
function saveRentalState(s) { localStorage.setItem('rental', JSON.stringify(s)); }

function rentalWeeklyCost() {
  const s = getRentalState();
  return RENTAL_ITEMS.reduce((t, item, i) => t + (s.slots.includes(item.id) ? item.cost : 0), 0);
}
function rentalMonthlyCost() {
  const s = getRentalState();
  const weekly = rentalWeeklyCost();
  return weekly * (s.wed ? 2 : 4);
}

function initRentalSlots() {
  const container = document.getElementById('rentalSlots');
  if (!container) return;
  const s = getRentalState();
  container.innerHTML = '';
  RENTAL_ITEMS.forEach(item => {
    const slot = document.createElement('div');
    slot.className = 'rental-slot' + (s.slots.includes(item.id) ? ' on' : '');
    slot.dataset.id = item.id;
    slot.innerHTML = `<img src="${item.img}" alt="${item.id}" onerror="this.style.opacity='.3'">`;
    slot.addEventListener('click', () => {
      const rs = getRentalState();
      const idx = rs.slots.indexOf(item.id);
      if (idx >= 0) rs.slots.splice(idx, 1); else rs.slots.push(item.id);
      saveRentalState(rs);
      initRentalSlots();
      updateRentalTotals();
    });
    container.appendChild(slot);
  });
  updateRentalTotals();
}

function updateRentalTotals() {
  const wCost = rentalWeeklyCost();
  const label = document.getElementById('rentalCostLabel');
  if (label) label.textContent = wCost > 0 ? `-${fmtMeso(wCost)}` : '';

  const ch = state.chars[state.activeChar];
  if (!ch) return;
  let bossWeekly = 0;
  (ch.checks ? Object.entries(ch.checks) : []).forEach(([key, val]) => {
    if (!val?.on) return;
    const sep = key.lastIndexOf('_');
    const bossId = key.slice(0, sep);
    const diff   = key.slice(sep + 1);
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (!boss || boss.monthly) return;
    bossWeekly += Math.floor((boss.diffs[diff] || 0) / Math.max(1, val.party || 1));
  });
  const wEl = document.getElementById('weeklyTotal');
  const mEl = document.getElementById('monthlyTotal');
  const wCost2 = rentalWeeklyCost();
  const mCost2 = rentalMonthlyCost();
  if (wEl) wEl.textContent = fmtMeso(Math.max(0, bossWeekly - wCost2));
  if (mEl) mEl.textContent = fmtMeso(Math.max(0, charMonthlyMeso(ch) - mCost2));
  updateCrystalBar();
}

document.addEventListener('DOMContentLoaded', () => {
  initRentalSlots();
  const wedCb = document.getElementById('rentalWed');
  if (wedCb) {
    const s = getRentalState();
    wedCb.checked = s.wed;
    wedCb.addEventListener('change', () => {
      const rs = getRentalState();
      rs.wed = wedCb.checked;
      saveRentalState(rs);
      updateRentalTotals();
    });
  }
});

/* ── 보스 초기화 ── */
document.getElementById('btnResetBoss').addEventListener('click', () => {
  const ch = state.chars[state.activeChar];
  if (!ch || !confirm(`${ch.name}의 보스 체크를 초기화할까요?`)) return;
  ch.checks = {};
  save(); renderBossTable(); renderCharList();
});

/* ── 캐릭터 모달 ── */
let editIdx = -1, selectedJob = 0, fetchedInfo = null;

function openCharModal(idx = -1) {
  editIdx = idx;
  selectedJob = idx >= 0 ? state.chars[idx].jobIdx : 0;
  fetchedInfo = idx >= 0 && state.chars[idx].fetched ? { ...state.chars[idx].fetched } : null;
  document.getElementById('modalCharTitle').textContent = idx >= 0 ? '캐릭터 수정' : '캐릭터 추가';
  document.getElementById('inpName').value  = idx >= 0 ? state.chars[idx].name  : '';
  document.getElementById('inpLevel').value = idx >= 0 ? state.chars[idx].level : '';
  document.getElementById('inpJob').value = idx >= 0 ? charJobName(state.chars[idx]) : '';
  document.getElementById('inpJobSearch').value = '';
  document.getElementById('lkName').value = idx >= 0 ? state.chars[idx].name : '';
  document.getElementById('lkResult').innerHTML = '';
  document.getElementById('overlayChar').classList.add('open');
}

/* ── GMS 랭킹 조회 + 히스토리 ──
   랭킹 API는 '현재 상태'만 제공하므로, 조회할 때마다 스냅샷
   (날짜·레벨·경험치·캐릭터이미지)을 로컬에 누적해 히스토리를 만든다. */
const HIST_KEY = 'gms_char_history';
function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; } }
function saveHist(h) { localStorage.setItem(HIST_KEY, JSON.stringify(h)); }
function histKeyOf(d) { return `${(d.region||'NA').toLowerCase()}_${d.reboot?'r':'n'}_${(d.name||'').toLowerCase()}`; }

/* nexon 영문 직업명 → JOB_LIST 인덱스 (정규화 매칭) */
function jobIdxFromName(jobName) {
  if (!jobName) return -1;
  const norm = jobName.toLowerCase().replace(/[^a-z]/g, '');
  return JOB_LIST.findIndex(j => j.name.toLowerCase().replace(/[^a-z]/g, '') === norm);
}

const JOB_ASSET_NAMES = {
  'Dark Knight':'DarkNight',
  'Arch Mage (Fire, Poison)':'Arch_MageFP',
  'Arch Mage (F/P)':'Arch_MageFP',
  'Arch Mage (Ice, Lightning)':'Arch_MageIL',
  'Arch Mage (I/L)':'Arch_MageIL',
  'Bowmaster':'BowMaster',
  'Pathfinder':'PathFinder',
  'Night Lord':'NightLord',
  'Dual Blade':'DualBlade',
  'Buccaneer':'Viper',
  'Corsair':'Captain',
  'Cannoneer':'CannonShooter',
  'Dawn Warrior':'SoulMaster',
  'Blaze Wizard':'FlameWizard',
  'Wind Archer':'WindBreaker',
  'Thunder Breaker':'Striker',
  'Mihile':'Mikhail',
  'Shade':'Eunwol',
  'Battle Mage':'Battle',
  'Demon Slayer':'DemonSlayer',
  'Demon Avenger':'DemonAvenger',
  'Angelic Buster':'AngelicBuster',
  'Erel Light':'ErelLight',
  'Sia Astelle':'SiaAstelle',
  'Hoyoung':'HoYoung',
};
const JOB_HEAD_ASSET_NAMES = {
  'Dark Knight':'DarkNight',
  'Arch Mage (Fire, Poison)':'ArchMageFP',
  'Arch Mage (F/P)':'ArchMageFP',
  'Arch Mage (Ice, Lightning)':'ArchMageIL',
  'Arch Mage (I/L)':'ArchMageIL',
  'Pathfinder':'Pathfinder',
  'Night Lord':'NightLord',
  'Dual Blade':'DualBlade',
  'Buccaneer':'Viper',
  'Corsair':'Captain',
  'Cannoneer':'CannonShoter',
  'Dawn Warrior':'SoulMaster',
  'Blaze Wizard':'FlameWizard',
  'Wind Archer':'Windbreaker',
  'Thunder Breaker':'Striker',
  'Mihile':'Michile',
  'Shade':'Eunwol',
  'Battle Mage':'BattleMage',
  'Demon Slayer':'DemonSlayer',
  'Demon Avenger':'DemonAvenger',
  'Angelic Buster':'AngelicBuster',
  'Erel Light':'ErelLight',
  'Sia Astelle':'SiaAstelle',
  'Hoyoung':'Hoyoung',
  'Khali':'Khalie',
  'Kaiser':'Kasier',
  'Mo Xuan':'Moxuan',
};
const SERVER_ASSET_EXT = { Bera:'webp', Scania:'webp', Kronos:'png', Hyperion:'png' };

/* 캐릭터 직업명/아이콘 — 전부 영문명 기준 (name 이 곧 아이콘 파일명) */
function charJobName(ch) {
  return ch.fetched?.job || JOB_LIST[ch.jobIdx]?.name || '';
}
function _resolveAsset(en, ...maps) {
  if (!en) return null;
  for (const map of maps) {
    if (map[en]) return map[en];
  }
  // 정규화 매칭 (대소문자·공백·특수문자 무시)
  const norm = en.toLowerCase().replace(/[^a-z]/g, '');
  for (const map of maps) {
    const key = Object.keys(map).find(k => k.toLowerCase().replace(/[^a-z]/g, '') === norm);
    if (key) return map[key];
  }
  return en.replace(/\s+/g, '');
}
function charJobIconSrc(ch) {
  const en = ch.fetched?.job || JOB_LIST[ch.jobIdx]?.name;
  const asset = _resolveAsset(en, JOB_ASSET_NAMES);
  return asset ? `images/jobs/${asset}.webp` : '';
}
function charJobHeadSrc(ch) {
  const en = ch.fetched?.job || JOB_LIST[ch.jobIdx]?.name;
  const asset = _resolveAsset(en, JOB_HEAD_ASSET_NAMES, JOB_ASSET_NAMES);
  return asset ? `images/jobs/Head/${asset}.webp` : '';
}
function serverIconSrc(world) {
  const ext = SERVER_ASSET_EXT[world];
  return ext ? `images/server/${encodeURIComponent(world)}.${ext}` : '';
}
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

/* 조회 결과를 히스토리에 기록. 같은 날 중복은 최신값으로 갱신. */
function recordSnapshot(d) {
  const h = loadHist();
  const key = histKeyOf(d);
  const arr = h[key] || [];
  const snap = { date: todayStr(), ts: Date.now(), level: d.level, exp: Number(d.exp)||0, img: d.img || '', job: d.job || '' };
  const last = arr[arr.length - 1];
  if (last && last.date === snap.date) arr[arr.length - 1] = snap;   // 같은 날 → 갱신
  else if (!last || last.exp !== snap.exp || last.img !== snap.img || last.level !== snap.level) arr.push(snap);
  h[key] = arr.slice(-60);   // 최근 60개만 보관
  saveHist(h);
  return h[key];
}

/* 히스토리 HTML (경험치 변화 + 코디 썸네일) */
function renderHistHtml(d) {
  const arr = (loadHist()[histKeyOf(d)] || []).slice().reverse();   // 최신순
  if (arr.length <= 1) return '';
  const expRows = arr.map((s, i) => {
    const prev = arr[i + 1];
    let delta = '';
    if (prev) {
      const diffLv = s.level - prev.level;
      const diffExp = s.exp - prev.exp;
      const parts = [];
      if (diffLv) parts.push(`<span class="hist-up">▲${diffLv}레벨</span>`);
      if (diffExp) parts.push(`<span class="${diffExp>0?'hist-up':'hist-dn'}">${diffExp>0?'+':''}${Number(diffExp).toLocaleString()} EXP</span>`);
      delta = parts.join(' ');
    }
    return `<div class="hist-row">
      <span class="hist-date">${s.date}</span>
      <span class="hist-lv">Lv.${s.level}</span>
      <span class="hist-delta">${delta || '<span class="hp-dim">기준</span>'}</span>
    </div>`;
  }).join('');
  const codies = arr.filter(s => s.img).map(s =>
    `<div class="hist-cody"><img src="${s.img}" onerror="this.style.display='none'" /><span>${s.date.slice(5)}</span></div>`).join('');
  return `
    <div class="hist-sec"><div class="hist-title">경험치 / 레벨 히스토리</div>${expRows}</div>
    `;
}
document.getElementById('lkBtn').addEventListener('click', async () => {
  const name   = document.getElementById('lkName').value.trim();
  const reboot = false;   // Heroic/일반 구분 없이 이름으로 검색됨
  const box    = document.getElementById('lkResult');
  if (!name) { box.innerHTML = '<span class="lk-err">캐릭터명을 입력하세요.</span>'; return; }
  box.innerHTML = '<span class="lk-load">조회 중...</span>';
  try {
    const r = await fetch(`/api/lookup?name=${encodeURIComponent(name)}&reboot=${reboot?1:0}&region=${state.region}`);
    const j = await r.json();
    if (!j.ok) { box.innerHTML = `<span class="lk-err">${j.error}</span>`; return; }
    fetchedInfo = j.data;
    recordSnapshot(j.data);                 // 조회 시점 스냅샷 누적
    // 입력란 자동 채우기
    document.getElementById('inpName').value  = j.data.name;
    document.getElementById('inpLevel').value = j.data.level;
    document.getElementById('inpJob').value = j.data.job || '';
    // 직업 자동 선택
    const ji = jobIdxFromName(j.data.job);
    if (ji >= 0) selectedJob = ji;
    box.innerHTML = `
      <div class="lk-card">
        ${j.data.img ? `<img class="lk-card__av" src="${j.data.img}" onerror="this.style.display='none'" />` : ''}
        <div class="lk-card__info">
          <div class="lk-card__name">${j.data.name} <span class="lk-card__job">${j.data.job}</span></div>
          <div class="lk-card__meta">Lv.${j.data.level} · ${j.data.region} ${j.data.world} · 전체 ${j.data.rank.toLocaleString()}위</div>
          <div class="lk-card__exp">누적 EXP ${Number(j.data.exp).toLocaleString()}</div>
        </div>
      </div>
      <div class="lk-hist">${renderHistHtml(j.data)}</div>`;
  } catch (e) {
    box.innerHTML = '<span class="lk-err">조회 실패 — 서버(serve.js)가 실행 중인지 확인하세요.</span>';
  }
});

function renderJobGrid(filter) {
  const grid = document.getElementById('jobGrid');
  grid.innerHTML = '';
  const q = filter.toLowerCase();
  JOB_LIST.forEach((job, i) => {
    if (q && !job.name.toLowerCase().includes(q)) return;
    const div = document.createElement('div');
    div.className = 'job-item' + (i === selectedJob ? ' sel' : '');
    const iconSrc = charJobHeadSrc({ jobIdx:i, fetched:null }) || charJobIconSrc({ jobIdx:i, fetched:null });
    div.innerHTML = `<img src="${iconSrc}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="job-noimg" style="display:none">JOB</span><span>${job.name}</span>`;
    div.addEventListener('click', () => { selectedJob = i; renderJobGrid(filter); });
    grid.appendChild(div);
  });
}

document.getElementById('inpLevel').addEventListener('input', e => {
  const v = parseInt(e.target.value);
  if (!isNaN(v) && v > 300) e.target.value = 300;
});
document.getElementById('inpJobSearch').addEventListener('input', e => renderJobGrid(e.target.value));
document.getElementById('btnAddChar').addEventListener('click', () => {
  if (state.chars.length >= MAX_CHARS) return alert('최대 20개까지 추가 가능합니다.');
  openCharModal();
});
['modalCharClose','modalCharCancel'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => document.getElementById('overlayChar').classList.remove('open'));
});
document.getElementById('modalCharSave').addEventListener('click', () => {
  if (!fetchedInfo) return alert('랭킹 조회 후 저장할 수 있습니다.');
  const name  = fetchedInfo.name;
  const level = Math.max(200, Math.min(300, parseInt(fetchedInfo.level)||200));
  const ji = jobIdxFromName(fetchedInfo.job);
  selectedJob = ji >= 0 ? ji : selectedJob;
  if (editIdx >= 0) {
    state.chars[editIdx] = { ...state.chars[editIdx], name, level, jobIdx: selectedJob, fetched: fetchedInfo };
  } else {
    state.chars.push({ id: Date.now(), name, level, jobIdx: selectedJob, checks: {}, fetched: fetchedInfo });
    state.activeChar = state.chars.length - 1;
  }
  save();
  document.getElementById('overlayChar').classList.remove('open');
  renderCharList(); renderBossTable(); renderCharInfo();
  syncServerHistThenRender(state.chars[state.activeChar]);
});

// 수정/삭제 버튼 (위임)
document.getElementById('charList').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const i = parseInt(btn.dataset.i);
  if (btn.dataset.action === 'edit') return openCharModal(i);
  document.getElementById('confirmMsg').textContent = `'${state.chars[i].name}' 캐릭터를 삭제하시겠습니까?`;
  document.getElementById('overlayConfirm').classList.add('open');
  document.getElementById('confirmOk').onclick = () => {
    state.chars.splice(i, 1);
    if (state.activeChar >= state.chars.length) state.activeChar = state.chars.length - 1;
    save(); document.getElementById('overlayConfirm').classList.remove('open');
    renderCharList(); renderBossTable();
  };
});
['confirmClose','confirmCancel'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => document.getElementById('overlayConfirm').classList.remove('open'));
});
document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});


/* ── 내보내기 / 불러오기 ── */
document.getElementById('btnExport').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  a.download = `gms_data_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});
document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try { state = JSON.parse(ev.target.result); save(); renderCharList(); renderBossTable(); alert('불러오기 완료!'); }
    catch { alert('파일 형식이 올바르지 않습니다.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ═══════════════════════════════════════════════
   캐릭터 정보 패널 (maplehub 스타일)
   - 좌측: 큰 캐릭터 카드 (이미지 80% + 정보)
   - 우측: 경험치 평균(7/14/30/90일), 일별 EXP 차트, 랭킹
═══════════════════════════════════════════════ */
let charExpChart = null;

/* 서버(Vercel Cron 수집) 히스토리를 가져와 로컬에 병합.
   배포 환경에서만 동작하며, 로컬/미설정 시 조용히 무시되고 로컬 스냅샷이 쓰인다. */
async function fetchServerHist(f) {
  if (!f || !f.name) return null;
  try {
    const r = await fetch(`/api/history?name=${encodeURIComponent(f.name)}&region=${(f.region||'na').toLowerCase()}&reboot=${f.reboot?1:0}`);
    const j = await r.json();
    if (j.ok && Array.isArray(j.data) && j.data.length) {
      const h = loadHist(); h[histKeyOf(f)] = j.data; saveHist(h);
      return j.data;
    }
  } catch (e) { /* 미배포/미설정 → 폴백 */ }
  return null;
}
function syncServerHistThenRender(ch) {
  if (ch?.fetched) fetchServerHist(ch.fetched).then(d => { if (d) renderCharInfo(); });
}

/* 스냅샷 배열(시간순)에서 days일 일평균 EXP 증가량 */
function expDailyAvg(arr, days) {
  if (!arr || arr.length < 2) return null;
  const latest = arr[arr.length - 1];
  const cutoff = latest.ts - days * 86400000;
  let base = null;
  for (const s of arr) { if (s.ts <= cutoff) base = s; }
  if (!base) base = arr[0];                       // 기간보다 데이터가 짧으면 가장 오래된 것
  const elapsed = (latest.ts - base.ts) / 86400000;
  if (elapsed < 0.4) return null;
  return (latest.exp - base.exp) / elapsed;
}

function fmtExp(n) {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (a >= 1e9)  return (n/1e9).toFixed(1) + 'B';
  if (a >= 1e6)  return (n/1e6).toFixed(1) + 'M';
  if (a >= 1e3)  return (n/1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function renderCharInfo() {
  const box = document.getElementById('charInfoBody');
  if (!box) return;
  if (charExpChart) { charExpChart.destroy(); charExpChart = null; }

  if (!state.chars.length) {
    box.innerHTML = '<div class="ci-empty">캐릭터를 추가하세요.</div>';
    return;
  }

  const cards = state.chars.map((ch, i) => {
    const f = ch.fetched;
    const jn = charJobName(ch);
    const world = f?.world || '';
    const region = f?.region || (state.region === 'eu' ? 'EU' : 'NA');
    const sIcon = world ? serverIconSrc(world) : '';
    const sIconHtml = sIcon ? `<img class="ci-servericon" src="${sIcon}" onerror="this.style.display='none'" />` : '';
    const portrait = f?.img
      ? `<img src="${f.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';this.parentElement.classList.add('cg-portrait--no')" /><span class="cg-noimg" style="display:none">NO IMAGE</span>`
      : `<span class="cg-noimg">NO IMAGE</span>`;
    const lv = f?.level || ch.level;
    const headSrc = charJobHeadSrc(ch);
    const headHtml = headSrc ? `<img class="ci-jobicon" src="${headSrc}" onerror="this.style.display='none'" />` : '';
    const rankRow = f?.rank ? `
      <div class="ci-card__ranks">
        <div class="ci-ranks-title">랭킹 / 정보</div>
        <div class="ci-rank-row"><span>${jn || ''}<br>Rank in ${region}</span><b>#${f.rank.toLocaleString()}</b></div>
      </div>` : '';
    const isActive = i === state.activeChar;
    return `
      <div class="cg-card${isActive ? ' cg-card--active' : ''}" data-ci="${i}">
        <div class="cg-portrait${f?.img ? '' : ' cg-portrait--no'}">${portrait}</div>
        <div class="ci-card__body">
          <div class="ci-card__nameline">
            <div>
              <div class="ci-card__name">${ch.name}</div>
              <div class="ci-card__job">${jn || ''}</div>
            </div>
            ${headHtml}
          </div>
          <div class="ci-card__meta">
            <span class="ci-lv">Lv.${lv}</span>
            <span class="ci-server">${sIconHtml}${region} ${world}</span>
          </div>
        </div>
        ${rankRow}
      </div>`;
  }).join('');

  box.innerHTML = `<div class="cg-grid">${cards}</div>`;

  let dragSrc = null;
  box.querySelectorAll('.cg-card').forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      selectChar(parseInt(card.dataset.ci));
    });
    card.addEventListener('dragstart', e => {
      dragSrc = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      box.querySelectorAll('.cg-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (card !== dragSrc) {
        box.querySelectorAll('.cg-card').forEach(c => c.classList.remove('drag-over'));
        card.classList.add('drag-over');
      }
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === card) return;
      const from = parseInt(dragSrc.dataset.ci);
      const to   = parseInt(card.dataset.ci);
      const arr  = state.chars;
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      if (state.activeChar === from) state.activeChar = to;
      else if (from < to && state.activeChar > from && state.activeChar <= to) state.activeChar--;
      else if (from > to && state.activeChar >= to && state.activeChar < from) state.activeChar++;
      save(); renderCharList(); renderBossTable(); renderCharInfo();
    });
  });
}

/* ── 폰트 선택 ── */
const FONT_KEY = 'gms_font';
const fontSel = document.getElementById('fontSel');
function applyFont(name) {
  document.body.style.fontFamily = `'${name}', 'Segoe UI', 'Malgun Gothic', sans-serif`;
  localStorage.setItem(FONT_KEY, name);
  fontSel.value = name;
}
fontSel.addEventListener('change', () => applyFont(fontSel.value));

/* ── 초기화 ── */
load();
applyRegionUI();
applyFont(localStorage.getItem(FONT_KEY) || '8bit');
renderCharList();
renderBossTable();
renderCharInfo();

