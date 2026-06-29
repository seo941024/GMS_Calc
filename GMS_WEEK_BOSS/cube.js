/* ═══════════════════════════════════════════════
   큐브 기댓값 계산기
═══════════════════════════════════════════════ */

const CUBE_MESO  = { red: 12_000_000, black: 22_000_000 };
const CUBE_PARTS = ["무기","엠블렘","보조무기(포스실드, 소울링 제외)","포스실드, 소울링","방패","모자","상의","한벌옷","하의","신발","장갑","망토","벨트","어깨장식","얼굴장식","눈장식","귀고리","반지","펜던트","기계심장"];
const _CUBE_KEY  = { red:'RED', black:'POTENTIAL', master:'ARTISAN', craft:'MASTER' };
const _GRADE_ORDER = ['RARE','EPIC','UNIQUE','LEGENDARY'];
const _GRADE_KR    = { RARE:'레어', EPIC:'에픽', UNIQUE:'유니크', LEGENDARY:'레전드리' };
const _NO_GMS_ADJ  = ['보스 몬스터 공격 시 데미지','몬스터 방어율 무시'];

function _activeType() { return document.querySelector('.cube-type-btn.active')?.dataset.type||'red'; }
function _dataKey()    { return _CUBE_KEY[_activeType()]||'RED'; }
function _cubeLv()     { return parseInt(document.getElementById('cubeLevel')?.value||0); }
function _cubePart()   { return document.getElementById('cubePart')?.value||''; }
function _cubeGrade()  { return document.getElementById('cubeGrade')?.value||'LEGENDARY'; }

// ── 파싱 ─────────────────────────────────────
// pct:    "공격력 : +12%"             → type='pct',  cat='공격력 %', base='공격력', valNum=12
// flat:   "STR : +4"                  → type='flat', cat='STR',      base='STR',   valNum=4
// colon:  "재사용 대기시간 : -2초(...)" → type='colon', cat='재사용 대기시간', valShort='-2초'
// unique: "<쓸만한 블레스>..."          → type='unique'

function _parse(name) {
  let m = /^(.+?) : \+(\d+\.?\d*)(%?)$/.exec(name);
  if (m) { const p=!!m[3]; return {cat:m[1]+(p?' %':''), base:m[1], valNum:+m[2], pct:p, type:p?'pct':'flat', full:name}; }
  m = /^(.+?) : (.+)$/.exec(name);
  if (m) return {cat:m[1], base:m[1], valShort:m[2].replace(/\(.*\)/g,'').trim(), type:'colon', full:name};
  return {cat:name, base:name, type:'unique', full:name};
}

function _extractNum(s) { const m=/(\d+\.?\d*)/.exec(s||''); return m?+m[1]:0; }
function _extractUnit(s) { const m=/[가-힣a-zA-Z초%]+$/.exec((s||'').trim()); return m?m[0]:''; }

// GMS 보정 포함 stat 기여값 반환
function _statContrib(name) {
  const p=_parse(name), lv=_cubeLv();
  if (p.type==='pct'||p.type==='flat') {
    const adj = lv>=160&&lv<250&&!_NO_GMS_ADJ.includes(p.base) ? 1 : 0;
    return {[p.cat]: p.valNum + adj};
  }
  if (p.type==='colon') return {[p.cat]: _extractNum(p.valShort)};
  return {};
}

// ── 데이터 헬퍼 ─────────────────────────────
function _bracket(dk, part, lv) {
  const t=window.CUBE_TABLE; if(!t) return null;
  const lvs=[...new Set(Object.keys(t.optionTable)
    .filter(k=>{const[c,p]=k.split('|');return c===dk&&p===part;})
    .map(k=>+k.split('|')[2]))].sort((a,b)=>a-b);
  if(!lvs.length) return null;
  let pick=lvs[0]; for(const L of lvs) if(L<=lv) pick=L;
  return pick;
}
function _rawOpts(dk, part, lv, grade) {
  const br=_bracket(dk,part,lv); if(!br) return [];
  return window.CUBE_TABLE?.optionTable[`${dk}|${part}|${br}|${grade}`]||[];
}

// ── 왼쪽 드롭다운 ───────────────────────────
// pct/flat/colon: 카테고리 1개 항목, 오른쪽 숫자 INPUT
// unique: 개별 옵션 항목, 오른쪽 없음

function _buildLeftOpts(dk, part, lv, grade) {
  const opts = _rawOpts(dk, part, lv, grade);
  if (!opts.length) return '<option>— 데이터 없음 —</option>';
  const html=[], seenCat=new Set(), seenUniq=new Set();
  for (const o of opts) {
    const p=_parse(o.name);
    if (p.type==='pct'||p.type==='flat'||p.type==='colon') {
      if (!seenCat.has(p.cat)) {
        seenCat.add(p.cat);
        const unit = p.type==='pct' ? '%' : (p.type==='colon' ? _extractUnit(p.valShort) : '');
        html.push(`<option value="${p.cat}" data-type="${p.type}" data-unit="${unit}">${p.cat}</option>`);
      }
    } else {
      if (!seenUniq.has(o.name)) {
        seenUniq.add(o.name);
        const disp=o.name.replace(/<([^>]+)>/g,'$1').replace('스킬 사용 가능','스킬').trim();
        html.push(`<option value="${o.name}" data-type="unique">${disp}</option>`);
      }
    }
  }
  return html.join('');
}

// ── 행 동기화 ───────────────────────────────
function _syncRow(row) {
  const catSel=row.querySelector('.cube-opt-cat');
  const inp   =row.querySelector('.cube-opt-inp');
  const unitEl=row.querySelector('.cube-opt-unit');
  const sel   =catSel.selectedOptions[0];
  const type  =sel?.dataset.type||'';
  if (type==='unique') {
    inp.style.display='none'; unitEl.style.display='none';
  } else {
    inp.style.display=''; unitEl.style.display='';
    unitEl.textContent=sel?.dataset.unit||'';
  }
}

// ── 세트 / 행 생성 ──────────────────────────
function _makeRow() {
  const row=document.createElement('div');
  row.className='cube-goal-row';
  row.innerHTML=`
    <select class="sel cube-opt-cat"></select>
    <input  class="inp cube-opt-inp" type="number" min="0" placeholder="합산 수치">
    <span   class="cube-opt-unit"></span>`;
  row.querySelector('.cube-opt-cat').addEventListener('change',()=>_syncRow(row));
  return row;
}

function _addSet() {
  const container=document.getElementById('cubeSetContainer');
  const idx=container.children.length+1;
  const set=document.createElement('div');
  set.className='cube-set';
  set.innerHTML=`
    <div class="cube-set__head">
      <span class="cube-set__title">세트 ${idx}</span>
      <button class="cube-set__del" title="삭제">✕</button>
    </div>
    <div class="cube-set__rows"></div>`;
  set.querySelector('.cube-set__del').addEventListener('click',()=>{
    set.remove(); _renumberSets();
  });
  const rowsEl=set.querySelector('.cube-set__rows');
  for(let i=0;i<3;i++) rowsEl.appendChild(_makeRow());
  container.appendChild(set);
  _refreshAllRows();
}

function _renumberSets() {
  document.querySelectorAll('.cube-set').forEach((s,i)=>{
    s.querySelector('.cube-set__title').textContent=`세트 ${i+1}`;
  });
}

function _refreshAllRows() {
  document.querySelectorAll('.cube-goal-row').forEach(row=>{
    const catSel=row.querySelector('.cube-opt-cat');
    const prev=catSel.value;
    catSel.innerHTML=_buildLeftOpts(_dataKey(),_cubePart(),_cubeLv(),_cubeGrade());
    if(prev) catSel.value=prev;
    _syncRow(row);
  });
}

// ── 등급 드롭다운 ────────────────────────────
function _populateGrade() {
  const sel=document.getElementById('cubeGrade'); if(!sel) return;
  const t=window.CUBE_TABLE; if(!t) return;
  const dk=_dataKey();
  const grades=_GRADE_ORDER.filter(g=>t.optionGrade[dk]?.[g]);
  const prev=sel.value;
  sel.innerHTML=grades.slice().reverse().map(g=>`<option value="${g}">${_GRADE_KR[g]}</option>`).join('');
  if(grades.includes(prev)) sel.value=prev;
}

// ── 확률 계산 (열거법) ───────────────────────
// 3개 라인의 모든 (opt1, opt2, opt3) 조합을 열거,
// 세트 중 하나라도 만족하면 해당 조합의 확률을 합산

function _computeAllSets() {
  const dk=_dataKey(), part=_cubePart(), lv=_cubeLv(), grade=_cubeGrade();
  const t=window.CUBE_TABLE; if(!t) return 0;
  const og=t.optionGrade[dk]?.[grade]; if(!og) return 0;
  const gi=_GRADE_ORDER.indexOf(grade);
  const lower=gi>0?_GRADE_ORDER[gi-1]:null;

  const curOpts=_rawOpts(dk,part,lv,grade);
  const lowOpts=lower?_rawOpts(dk,part,lv,lower):[];
  const allNames=[...new Set([...curOpts.map(o=>o.name),...lowOpts.map(o=>o.name)])];
  if(!allNames.length) return 0;

  const curMap=Object.fromEntries(curOpts.map(o=>[o.name,o.probability]));
  const lowMap=Object.fromEntries(lowOpts.map(o=>[o.name,o.probability]));

  const lineProbs=[1,2,3].map(ln=>{
    const info=og.find(o=>o.line===ln);
    const cp=info?.currentGradeProb??0, lp=info?.lowerGradeProb??0;
    return allNames.map(name=>cp*(curMap[name]||0)+lp*(lowMap[name]||0));
  });

  // UI에서 세트 파싱
  const sets=[];
  document.querySelectorAll('.cube-set').forEach(setEl=>{
    const goals=[];
    setEl.querySelectorAll('.cube-goal-row').forEach(row=>{
      const catSel=row.querySelector('.cube-opt-cat');
      const inp   =row.querySelector('.cube-opt-inp');
      const sel   =catSel.selectedOptions[0];
      if(!sel) return;
      const type=sel.dataset.type||'';
      if(type==='unique') {
        goals.push({isUnique:true, kmsName:catSel.value});
      } else {
        const target=parseFloat(inp.value);
        if(!isNaN(target)&&target>0) goals.push({isUnique:false, cat:catSel.value, target});
      }
    });
    if(goals.length) sets.push(goals);
  });
  if(!sets.length) return 0;

  // 세트 만족 체크
  function checkSet(set, opts) {
    for(const goal of set) {
      if(goal.isUnique) {
        if(!opts.includes(goal.kmsName)) return false;
      } else {
        let total=0;
        for(const o of opts){ const c=_statContrib(o); total+=c[goal.cat]||0; }
        if(total<goal.target) return false;
      }
    }
    return true;
  }

  const n=allNames.length;
  let totalP=0;
  for(let i=0;i<n;i++){
    const p1=lineProbs[0][i]; if(!p1) continue;
    for(let j=0;j<n;j++){
      const p2=lineProbs[1][j]; if(!p2) continue;
      for(let k=0;k<n;k++){
        const p3=lineProbs[2][k]; if(!p3) continue;
        const combo=[allNames[i],allNames[j],allNames[k]];
        if(sets.some(s=>checkSet(s,combo))) totalP+=p1*p2*p3;
      }
    }
  }
  return totalP;
}

// ── 결과 렌더 ────────────────────────────────
function _renderResult(p) {
  const el=document.getElementById('cubeResults');
  const meso=CUBE_MESO[_activeType()]??null;
  const ec=1/p;
  el.innerHTML=`
    <div class="sf-res-item"><span class="sf-res-label">성공 확률</span><span class="sf-res-val big">${(p*100).toFixed(4)}%</span></div>
    <div class="sf-res-item"><span class="sf-res-label">기댓값 (평균 큐브 수)</span><span class="sf-res-val">${Math.ceil(ec).toLocaleString()} 개</span></div>
    ${meso!=null?`<div class="sf-res-item"><span class="sf-res-label">기댓값 (평균 메소)</span><span class="sf-res-val">${fmtMeso(Math.round(ec*meso))}</span></div>`:''}
    <div class="sf-res-item"><span class="sf-res-label">10만 회 기대 성공</span><span class="sf-res-val">${Math.round(100000*p).toLocaleString()} 회</span></div>
    <div class="sf-res-item"><span class="sf-res-label">10% 확률 이내</span><span class="sf-res-val">${Math.ceil(ec*0.105).toLocaleString()} 개</span></div>
    <div class="sf-res-item"><span class="sf-res-label">90% 확률 이내</span><span class="sf-res-val" style="color:var(--danger)">${Math.ceil(ec*2.303).toLocaleString()} 개</span></div>`;
}

// ── 초기화 ──────────────────────────────────
async function initCube() {
  const partSel=document.getElementById('cubePart');
  if(partSel) partSel.innerHTML=CUBE_PARTS.map(p=>`<option value="${p}">${p}</option>`).join('');

  document.querySelectorAll('.cube-type-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.cube-type-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); _populateGrade(); _refreshAllRows();
  }));

  ['cubePart','cubeGrade'].forEach(id=>document.getElementById(id)?.addEventListener('change',_refreshAllRows));
  document.getElementById('cubeLevel')?.addEventListener('input',_refreshAllRows);
  document.getElementById('cubeAddSetBtn')?.addEventListener('click',_addSet);

  _populateGrade();
  _addSet(); // 기본 세트 1개

  document.getElementById('cubeExpectedBtn')?.addEventListener('click',()=>{
    const el=document.getElementById('cubeResults');
    const p=_computeAllSets();
    if(!p){el.innerHTML='<p class="empty">목표 옵션을 입력하거나 데이터를 확인하세요.</p>';return;}
    _renderResult(p);
  });
}
