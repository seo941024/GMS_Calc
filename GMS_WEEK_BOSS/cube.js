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
function _needAdj(base){ const lv=_cubeLv(); return lv>=160&&lv<250&&!_NO_GMS_ADJ.includes(base); }

// ── 옵션명 파싱 ──────────────────────────────────
// pct:    "공격력 : +12%"          → cat="공격력 %", valNum=12
// flat:   "STR : +4"               → cat="STR", valNum=4
// colon:  "재사용 대기시간 : -2초(...)" → cat="재사용 대기시간", valShort="-2초"
// unique: "<쓸만한 블레스>..."      → cat=full name

function _parse(name) {
  let m = /^(.+?) : \+(\d+\.?\d*)(%?)$/.exec(name);
  if (m) { const p=!!m[3]; return {cat:m[1]+(p?' %':''), base:m[1], valNum:+m[2], pct:p, type:p?'pct':'flat', full:name}; }
  m = /^(.+?) : (.+)$/.exec(name);
  if (m) return {cat:m[1], base:m[1], valShort:m[2].replace(/\(.*\)/g,'').trim(), type:'colon', full:name};
  return {cat:name, base:name, type:'unique', full:name};
}

// 숫자 수치가 없는 옵션 → 짧은 표시명
function _shortDisplay(name, p) {
  if (p.type==='colon')  return `${p.cat} ${p.valShort}`;
  if (p.type==='unique') return name.replace(/<([^>]+)>/g,'$1').replace('스킬 사용 가능','스킬').trim();
  return name;
}

// ── 데이터 헬퍼 ─────────────────────────────────

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

// ── 왼쪽 드롭다운 빌드 ───────────────────────────
// pct/flat: 카테고리 1개 항목 (오른쪽 값 SELECT 있음)
// colon/unique: 옵션 개별 항목 (오른쪽 없음)
// data-type 속성으로 row 동작 분기

function _buildLeftOpts(dk, part, lv, grade) {
  const opts = _rawOpts(dk, part, lv, grade);
  if (!opts.length) return '<option>— 데이터 없음 —</option>';
  const html = [], seenCat = new Set();
  for (const o of opts) {
    const p = _parse(o.name);
    if (p.type==='pct'||p.type==='flat') {
      if (!seenCat.has(p.cat)) {
        seenCat.add(p.cat);
        html.push(`<option value="${p.cat}" data-numeric="1" data-pct="${p.pct?1:0}" data-base="${p.base}">${p.cat}</option>`);
      }
    } else {
      const disp = _shortDisplay(o.name, p);
      html.push(`<option value="${o.name}" data-numeric="0">${disp}</option>`);
    }
  }
  return html.join('');
}

// 값 SELECT HTML (pct/flat 전용)
function _buildValOpts(dk, part, lv, grade, catOpt) {
  const cat  = catOpt.value;
  const base = catOpt.dataset.base||cat.replace(/ %$/,'');
  const pct  = catOpt.dataset.pct==='1';
  const adj  = pct && _needAdj(base);
  const opts = _rawOpts(dk, part, lv, grade).filter(o=>_parse(o.name).cat===cat);
  return opts
    .sort((a,b)=>_parse(b.name).valNum-_parse(a.name).valNum)
    .map(o=>{ const v=_parse(o.name).valNum; return `<option value="${o.name}">${adj?v+1:v}</option>`; })
    .join('');
}

// ── 목표 옵션 행 ─────────────────────────────────

function _syncRow(row) {
  const catSel = row.querySelector('.cube-opt-cat');
  const valSel = row.querySelector('.cube-opt-val');
  const valLbl = row.querySelector('.cube-val-label');
  const sel    = catSel.selectedOptions[0];
  const numeric = sel?.dataset.numeric==='1';
  if (numeric) {
    valSel.innerHTML     = _buildValOpts(_dataKey(),_cubePart(),_cubeLv(),_cubeGrade(), sel);
    valSel.style.display = '';
    if (valLbl) valLbl.style.display = '';
  } else {
    valSel.style.display = 'none';
    if (valLbl) valLbl.style.display = 'none';
  }
}

function _refreshRow(row) {
  const catSel = row.querySelector('.cube-opt-cat');
  const prev   = catSel.value;
  catSel.innerHTML = _buildLeftOpts(_dataKey(),_cubePart(),_cubeLv(),_cubeGrade());
  if (prev) catSel.value = prev;
  _syncRow(row);
}

function _addGoalRow() {
  const container = document.getElementById('cubeGoalRows');
  if (!container||container.children.length>=3) return;
  const row = document.createElement('div');
  row.className = 'cube-goal-row';
  row.innerHTML = `
    <select class="sel cube-opt-cat"></select>
    <select class="sel cube-opt-val" style="display:none"></select>
    <span   class="cube-val-label" style="display:none"></span>
    <button class="cube-goal-del" title="삭제">✕</button>`;
  row.querySelector('.cube-opt-cat').addEventListener('change', ()=>_syncRow(row));
  row.querySelector('.cube-goal-del').addEventListener('click', ()=>{ row.remove(); _updateAddBtn(); });
  container.appendChild(row);
  _refreshRow(row);
  _updateAddBtn();
}

function _refreshGoalRows() { document.querySelectorAll('.cube-goal-row').forEach(_refreshRow); }
function _updateAddBtn()    { const b=document.getElementById('cubeAddGoalBtn'); if(b) b.disabled=document.querySelectorAll('.cube-goal-row').length>=3; }

// ── 등급 드롭다운 ────────────────────────────────

function _populateGrade() {
  const sel=document.getElementById('cubeGrade'); if(!sel) return;
  const t=window.CUBE_TABLE; if(!t) return;
  const dk=_dataKey();
  const grades=_GRADE_ORDER.filter(g=>t.optionGrade[dk]?.[g]);
  const prev=sel.value;
  sel.innerHTML=grades.slice().reverse().map(g=>`<option value="${g}">${_GRADE_KR[g]}</option>`).join('');
  if(grades.includes(prev)) sel.value=prev;
}

// ── 확률 계산 ────────────────────────────────────

function _computeP(kmsNames) {
  const dk=_dataKey(), part=_cubePart(), lv=_cubeLv(), grade=_cubeGrade();
  const t=window.CUBE_TABLE; if(!t) return 0;
  const og=t.optionGrade[dk]?.[grade]; if(!og) return 0;
  const gi=_GRADE_ORDER.indexOf(grade);
  const lower=gi>0?_GRADE_ORDER[gi-1]:null;

  const names=kmsNames.map((_,i)=>`__g${i}__`);
  const getP=(g,kn)=>_rawOpts(dk,part,lv,g).find(o=>o.name===kn)?.probability??0;

  const buildLine=ln=>{
    const info=og.find(o=>o.line===ln);
    const cp=info?.currentGradeProb??0, lp=info?.lowerGradeProb??0;
    const opts=kmsNames.map((kn,i)=>({
      name:names[i],
      probability: cp*getP(grade,kn)+(lower?lp*getP(lower,kn):0)
    }));
    const tot=opts.reduce((s,o)=>s+o.probability,0);
    if(tot<1) opts.push({name:'__rest__',probability:1-tot});
    return opts;
  };

  const lines=[buildLine(1),buildLine(2),buildLine(3)];
  const pp=lines.map(opts=>names.map(nm=>{
    const tot=opts.reduce((s,o)=>s+o.probability,0);
    return tot?(opts.find(o=>o.name===nm)?.probability??0)/tot:0;
  }));

  const inj=[];
  if(names.length===1){for(let i=0;i<3;i++)inj.push([i]);}
  else if(names.length===2){for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(i!==j)inj.push([i,j]);}
  else{[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]].forEach(s=>inj.push(s));}

  const m=inj.length; let res=0;
  for(let mask=1;mask<(1<<m);mask++){
    const chosen=[]; for(let b=0;b<m;b++) if(mask&(1<<b)) chosen.push(b);
    const sign=chosen.length%2===1?1:-1;
    const req=[new Set(),new Set(),new Set()];
    for(const bi of chosen){const s=inj[bi];for(let k=0;k<names.length;k++)req[s[k]].add(k);}
    let prob=1,valid=true;
    for(let l=0;l<3;l++){
      const rs=[...req[l]]; if(!rs.length) continue;
      const strs=[...new Set(rs.map(k=>names[k]))]; if(strs.length>1){valid=false;break;}
      prob*=pp[l][rs[0]];
    }
    if(valid) res+=sign*prob;
  }
  return res;
}

// ── 결과 렌더 ────────────────────────────────────

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

// ── 초기화 ──────────────────────────────────────

async function initCube() {
  const partSel=document.getElementById('cubePart');
  if(partSel) partSel.innerHTML=CUBE_PARTS.map(p=>`<option value="${p}">${p}</option>`).join('');

  document.querySelectorAll('.cube-type-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.cube-type-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); _populateGrade(); _refreshGoalRows();
  }));

  ['cubePart','cubeGrade'].forEach(id=>document.getElementById(id)?.addEventListener('change',_refreshGoalRows));
  document.getElementById('cubeLevel')?.addEventListener('input',_refreshGoalRows);
  document.getElementById('cubeAddGoalBtn')?.addEventListener('click',_addGoalRow);

  _populateGrade();
  _addGoalRow();

  document.getElementById('cubeExpectedBtn')?.addEventListener('click',()=>{
    const el=document.getElementById('cubeResults');
    const kmsNames=[...document.querySelectorAll('.cube-goal-row')].map(row=>{
      const catSel=row.querySelector('.cube-opt-cat');
      const valSel=row.querySelector('.cube-opt-val');
      const numeric=catSel.selectedOptions[0]?.dataset.numeric==='1';
      return numeric ? valSel.value : catSel.value;
    }).filter(Boolean);

    if(!kmsNames.length){alert('목표 옵션을 1개 이상 선택하세요.');return;}
    const p=_computeP(kmsNames);
    if(!p){el.innerHTML='<p class="empty">해당 옵션 데이터가 없습니다. 부위·레벨·등급을 확인하세요.</p>';return;}
    _renderResult(p);
  });
}
