/* ═══════════════════════════════════════════════
   환산주스탯 도우미 — GMS STAT 창 OCR → maplescouter 콘솔코드
═══════════════════════════════════════════════ */

const STAT_JOB_TYPES = [
  { label: 'STR/DEX — 전사 / 해적 일부', stat: ['STR','DEX'],       third: 'ATK'  },
  { label: 'DEX/STR — 궁수 / 해적',      stat: ['DEX','STR'],       third: 'ATK'  },
  { label: 'INT/LUK — 마법사',            stat: ['INT','LUK'],       third: 'MATK' },
  { label: 'LUK/DEX — 도적',              stat: ['LUK','DEX'],       third: 'ATK'  },
  { label: 'STR/DEX/LUK — 제논',          stat: ['STR','DEX','LUK'], third: 'ATK'  },
  { label: 'HP — 데몬어벤져',              stat: ['HP'],              third: 'ATK'  },
];

function parseStatWindow(text) {
  const get = (re) => { const m = text.match(re); return m ? m[1].replace(/,/g,'') : ''; };
  return {
    level:        get(/Lv[\. ]+(\d+)/i),
    STR:          get(/\bSTR\b\s+([\d,]+)/),
    DEX:          get(/\bDEX\b\s+([\d,]+)/),
    INT:          get(/\bINT\b\s+([\d,]+)/),
    LUK:          get(/\bLUK\b\s+([\d,]+)/),
    HP:           get(/\bHP\b\s+([\d,]+)/),
    ATK:          get(/ATTACK POWER\s+[^\d]*([\d,]+)/),
    MATK:         get(/MAGIC ATT\s+([\d,]+)/),
    DAMAGE:       get(/(?<![A-Z ])DAMAGE\s+[^\d]*([\d.]+)%/),
    BOSS_DAMAGE:  get(/BOSS DAMAGE\s+([\d.]+)%/),
    FINAL_DAMAGE: get(/FINAL DAMAGE\s+([\d.]+)%/),
    IGNORE_DEF:   get(/IGNORE DEFENSE\s+([\d.]+)%/),
    NORMAL_DMG:   get(/NORMAL ENEMY DAMAGE\s+([\d.]+)%/),
    CRIT_RATE:    get(/CRITICAL RATE\s+[^\d]*([\d.]+)%/),
    CRIT_DMG:     get(/CRITICAL DAMAGE\s+([\d.]+)%/),
    CD_SEC:       get(/COOLDOWN REDUCTION\s+([\d.]+)\s*sec/i),
    CD_PCT:       get(/COOLDOWN REDUCTION\s+[\d.]+ sec \/ ([\d.]+)%/i),
    BUFF_DUR:     get(/BUFF DURATION\s+([\d.]+)%/),
    CD_NOT:       get(/COOLDOWN NOT APPLIED\s+([\d.]+)%/),
    IGNORE_ELEM:  get(/IGNORE ELEMENTAL RESISTANCE\s+([\d.]+)%/),
    ADD_STATUS:   get(/ADDITIONAL STATUS DAMAGE\s+([\d.]+)%/),
    SUMMONS:      get(/SUMMONS DURATION INCREASE\s+([\d.]+)%/),
  };
}

function buildFields(jtIdx, parsed) {
  const jt   = STAT_JOB_TYPES[jtIdx];
  const rows = [];
  const statKeys = jt.stat.slice(0, 3);
  statKeys.forEach((s, i) => {
    rows.push({ label: `${s} 기본수치`,  key: s,    idx: 3+i*3, note: '합산값 (% 분리 불가)' });
    rows.push({ label: `${s} % 수치`,   key: null,  idx: 4+i*3, val: '0', note: '수동 입력' });
    rows.push({ label: `${s} % 미적용`, key: null,  idx: 5+i*3, val: '0', note: '수동 입력' });
  });
  const direct = [
    { label: '기본 스공',           key: null,          idx: 12, val: '',  note: '수동 입력' },
    { label: '데미지%',             key: 'DAMAGE',      idx: 13 },
    { label: '최종 데미지%',        key: 'FINAL_DAMAGE',idx: 14 },
    { label: '보스 데미지%',        key: 'BOSS_DAMAGE', idx: 15 },
    { label: '방어율 무시%',        key: 'IGNORE_DEF',  idx: 16 },
    { label: '일반 데미지%',        key: 'NORMAL_DMG',  idx: 17 },
    { label: '공격력',              key: 'ATK',         idx: 18 },
    { label: '크리티컬 확률%',      key: 'CRIT_RATE',   idx: 19 },
    { label: '마력',                key: 'MATK',        idx: 20 },
    { label: '크리티컬 데미지%',    key: 'CRIT_DMG',    idx: 21 },
    { label: '재사용 감소(초)',      key: 'CD_SEC',      idx: 22 },
    { label: '재사용 감소(%)',       key: 'CD_PCT',      idx: 23 },
    { label: '버프 지속 시간%',     key: 'BUFF_DUR',    idx: 24 },
    { label: '재사용 미적용%',      key: 'CD_NOT',      idx: 25 },
    { label: '속성 내성 무시%',     key: 'IGNORE_ELEM', idx: 26 },
    { label: '상태이상 추가뎀%',   key: 'ADD_STATUS',  idx: 27 },
    { label: '소환수 지속%',        key: 'SUMMONS',     idx: 28 },
    { label: '아케인 포스',         key: null,          idx: 29, val: '', note: '수동 입력' },
    { label: '어센틱/세이크리드 포스', key: null,       idx: 30, val: '', note: '수동 입력' },
  ];
  return [...rows, ...direct].map(f => ({
    ...f,
    val: f.val !== undefined ? f.val : (f.key ? (parsed[f.key] || '') : ''),
  }));
}

function generateConsoleCode(fields) {
  const lines = [
    `// byeolnim.app 생성 — maplescouter.com/ko/input 콘솔(F12)에 붙여넣기`,
    `(function(){`,
    `  const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;`,
    `  const set=(i,v)=>{const el=document.querySelectorAll('input')[i];if(!el||v===''||v==null)return;s.call(el,String(v));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};`,
  ];
  fields.forEach(f => {
    if (f.val !== '' && f.val != null && f.val !== undefined)
      lines.push(`  set(${f.idx},'${f.val}'); // ${f.label}`);
  });
  lines.push(`})();`);
  return lines.join('\n');
}

/* ─── UI ─── */
function initStatOCR() {
  const sec = document.getElementById('sec-statocr');
  if (!sec) return;

  let _parsed = {}, _fields = [], _jtIdx = 0;
  let _img = null; // 원본 Image 객체
  let _crop = null; // {x,y,w,h} 크롭 영역 (canvas 픽셀 기준)
  let _dragging = false, _dragStart = null;

  const jobOpts = STAT_JOB_TYPES.map((jt,i)=>`<option value="${i}">${jt.label}</option>`).join('');

  sec.innerHTML = `
    <div class="sec-head"><h2 class="sec-title">환산주스탯 도우미</h2></div>
    <div class="sf-tabs" style="margin-bottom:12px">
      <button class="sf-tab active" id="statTabOcr">자동 추출 (OCR)</button>
      <button class="sf-tab" id="statTabManual">수동 입력</button>
    </div>
    <hr class="sec-sep"/>
    <div class="sf-layout">
      <!-- 좌측 -->
      <div class="card" style="display:flex;flex-direction:column;gap:16px;min-width:0">
        <div>
          <div class="card__title">직업 스탯 유형</div>
          <select class="sel w100" id="statJobType" style="margin-top:8px">${jobOpts}</select>
        </div>

        <div id="statPanelOcr">
          <div class="card__title">STAT 창 스크린샷</div>
          <div class="stat-paste-zone" id="statPasteZone" tabindex="0">
            <p>여기에 스크린샷 <b>Ctrl+V</b> 붙여넣기</p>
            <p style="font-size:.75rem;color:var(--text-sub);margin-top:4px">또는 클릭하여 파일 선택</p>
            <input type="file" id="statFileInput" accept="image/*" style="display:none"/>
          </div>
          <div id="statCropWrap" style="display:none;margin-top:8px">
            <p style="font-size:.78rem;color:#fbbf24;margin-bottom:6px">📌 STAT 창 영역을 드래그로 선택하세요</p>
            <div style="position:relative;display:inline-block;max-width:100%">
              <canvas id="statPreviewCanvas" style="max-width:100%;border-radius:8px;cursor:crosshair;display:block"></canvas>
              <canvas id="statOverlayCanvas" style="position:absolute;top:0;left:0;max-width:100%;border-radius:8px;cursor:crosshair;pointer-events:none"></canvas>
            </div>
            <div style="margin-top:6px;font-size:.75rem;color:var(--text-sub)" id="statCropInfo">선택 영역 없음</div>
          </div>
          <button class="sbtn sbtn--primary w100" id="statOcrBtn" style="margin-top:10px" disabled>OCR 실행</button>
          <div id="statOcrStatus" style="font-size:.78rem;color:var(--text-sub);margin-top:6px;text-align:center"></div>
        </div>

        <div id="statPanelManual" style="display:none">
          <p style="font-size:.8rem;color:var(--text-sub)">아래 테이블에 직접 입력하세요.</p>
          <button class="sbtn sbtn--ghost w100" id="statManualInitBtn" style="margin-top:8px">테이블 초기화</button>
        </div>

        <div>
          <button class="sbtn sbtn--primary w100" id="statCopyBtn" disabled>📋 콘솔코드 복사</button>
          <p style="font-size:.72rem;color:var(--text-sub);margin-top:6px;line-height:1.6">
            복사 후 <a href="https://maplescouter.com/ko/input" target="_blank" style="color:var(--primary)">maplescouter 직접입력</a> 페이지에서<br>F12 → 콘솔 탭에 붙여넣고 Enter
          </p>
        </div>
      </div>

      <!-- 우측 결과 -->
      <div class="card" style="min-width:0;overflow-x:auto">
        <div class="card__title">추출 결과 <span style="font-size:.72rem;font-weight:400;color:var(--text-sub)">(수정 가능)</span></div>
        <div id="statResultTable" style="margin-top:10px"><p class="empty">OCR 실행 또는 수동 입력을 시작하세요.</p></div>
      </div>
    </div>`;

  /* 탭 전환 */
  sec.querySelector('#statTabOcr').addEventListener('click', () => {
    sec.querySelectorAll('.sf-tab').forEach(t=>t.classList.remove('active'));
    sec.querySelector('#statTabOcr').classList.add('active');
    document.getElementById('statPanelOcr').style.display = '';
    document.getElementById('statPanelManual').style.display = 'none';
  });
  sec.querySelector('#statTabManual').addEventListener('click', () => {
    sec.querySelectorAll('.sf-tab').forEach(t=>t.classList.remove('active'));
    sec.querySelector('#statTabManual').classList.add('active');
    document.getElementById('statPanelOcr').style.display = 'none';
    document.getElementById('statPanelManual').style.display = '';
    renderTable({});
  });
  document.getElementById('statManualInitBtn')?.addEventListener('click', ()=>renderTable({}));
  document.getElementById('statJobType').addEventListener('change', e=>{
    _jtIdx = parseInt(e.target.value);
    renderTable(_parsed);
  });

  /* 이미지 로드 */
  const pasteZone = document.getElementById('statPasteZone');
  const fileInput = document.getElementById('statFileInput');
  pasteZone.addEventListener('click', ()=>fileInput.click());
  fileInput.addEventListener('change', e=>{ if(e.target.files[0]) loadImageFile(e.target.files[0]); });
  pasteZone.addEventListener('paste', handlePaste);
  document.addEventListener('paste', e=>{
    if(sec.classList.contains('active')) handlePaste(e);
  });

  function handlePaste(e) {
    const item = [...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));
    if (item) loadImageFile(item.getAsFile());
  }

  function loadImageFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      _img  = img;
      _crop = null;
      const canvas = document.getElementById('statPreviewCanvas');
      const overlay = document.getElementById('statOverlayCanvas');
      // 표시 스케일 (max 800px)
      const dispW = Math.min(img.naturalWidth, 800);
      const scale = dispW / img.naturalWidth;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.style.width  = dispW + 'px';
      canvas.style.height = Math.round(img.naturalHeight * scale) + 'px';
      overlay.width  = img.naturalWidth;
      overlay.height = img.naturalHeight;
      overlay.style.width  = dispW + 'px';
      overlay.style.height = Math.round(img.naturalHeight * scale) + 'px';
      canvas.getContext('2d').drawImage(img, 0, 0);
      document.getElementById('statPasteZone').style.display = 'none';
      document.getElementById('statCropWrap').style.display  = '';
      document.getElementById('statOcrBtn').disabled = false;
      document.getElementById('statOcrStatus').textContent = '영역을 드래그해서 STAT 창만 선택 후 OCR 실행';
      URL.revokeObjectURL(url);
      initCropDrag(canvas, overlay, img.naturalWidth / dispW);
    };
    img.src = url;
  }

  /* 크롭 드래그 */
  function initCropDrag(canvas, overlay, pixelRatio) {
    _dragging = false; _dragStart = null; _crop = null;

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.round((e.clientX - r.left) * pixelRatio),
        y: Math.round((e.clientY - r.top)  * pixelRatio),
      };
    }

    function drawOverlay() {
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      if (!_crop) return;
      // 어두운 마스크
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      // 선택 영역 투명하게
      ctx.clearRect(_crop.x, _crop.y, _crop.w, _crop.h);
      // 테두리
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 3;
      ctx.strokeRect(_crop.x, _crop.y, _crop.w, _crop.h);
    }

    canvas.onmousedown = e => {
      _dragging = true;
      _dragStart = getPos(e);
    };
    canvas.onmousemove = e => {
      if (!_dragging) return;
      const cur = getPos(e);
      _crop = {
        x: Math.min(_dragStart.x, cur.x),
        y: Math.min(_dragStart.y, cur.y),
        w: Math.abs(cur.x - _dragStart.x),
        h: Math.abs(cur.y - _dragStart.y),
      };
      drawOverlay();
    };
    canvas.onmouseup = e => {
      _dragging = false;
      if (_crop && _crop.w > 10 && _crop.h > 10) {
        document.getElementById('statCropInfo').textContent =
          `선택: ${_crop.w}×${_crop.h}px`;
      } else {
        _crop = null;
        drawOverlay();
      }
    };
    canvas.onmouseleave = () => { _dragging = false; };
  }

  /* OCR 실행 */
  document.getElementById('statOcrBtn').addEventListener('click', async () => {
    const btn    = document.getElementById('statOcrBtn');
    const status = document.getElementById('statOcrStatus');
    btn.disabled = true;

    // 크롭 영역이 있으면 해당 부분만, 없으면 전체
    let ocrCanvas;
    if (_crop && _crop.w > 10 && _crop.h > 10) {
      ocrCanvas = document.createElement('canvas');
      ocrCanvas.width  = _crop.w;
      ocrCanvas.height = _crop.h;
      ocrCanvas.getContext('2d').drawImage(
        _img, _crop.x, _crop.y, _crop.w, _crop.h, 0, 0, _crop.w, _crop.h
      );
      status.textContent = `선택 영역(${_crop.w}×${_crop.h}) OCR 중...`;
    } else {
      ocrCanvas = document.getElementById('statPreviewCanvas');
      status.textContent = '전체 이미지 OCR 중... (STAT 창 영역 드래그 선택 권장)';
    }

    try {
      if (!window.Tesseract) {
        status.textContent = 'Tesseract 엔진 다운로드 중...';
        await new Promise((res,rej)=>{
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      const { data: { text } } = await Tesseract.recognize(ocrCanvas, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text')
            status.textContent = `OCR 중... ${Math.round(m.progress*100)}%`;
        }
      });

      _parsed = parseStatWindow(text);
      renderTable(_parsed);
      status.textContent = '✅ OCR 완료 — 값을 확인·수정 후 콘솔코드를 복사하세요.';
    } catch(e) {
      status.textContent = '❌ OCR 오류: ' + e.message;
    } finally {
      btn.disabled = false;
    }
  });

  /* 테이블 렌더링 */
  function renderTable(parsed) {
    _parsed = parsed;
    _jtIdx  = parseInt(document.getElementById('statJobType').value);
    _fields = buildFields(_jtIdx, parsed);
    const tbody = _fields.map((f,i) => `
      <tr>
        <td class="stat-lbl">${f.label}${f.note?`<br><span class="stat-note">${f.note}</span>`:''}</td>
        <td><input class="inp stat-val-inp" data-i="${i}" value="${f.val||''}" placeholder="—"/></td>
        <td class="stat-idx">[${f.idx}]</td>
      </tr>`).join('');
    document.getElementById('statResultTable').innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;font-size:.78rem;color:var(--text-sub);border-bottom:1px solid var(--border)">필드</th>
          <th style="text-align:left;padding:6px 8px;font-size:.78rem;color:var(--text-sub);border-bottom:1px solid var(--border)">값</th>
          <th style="text-align:left;padding:6px 8px;font-size:.78rem;color:var(--text-sub);border-bottom:1px solid var(--border)">인덱스</th>
        </tr></thead>
        <tbody>${tbody}</tbody>
      </table>`;
    document.querySelectorAll('.stat-val-inp').forEach(inp => {
      inp.addEventListener('input', () => { _fields[parseInt(inp.dataset.i)].val = inp.value; });
    });
    document.getElementById('statCopyBtn').disabled = false;
  }

  /* 콘솔코드 복사 */
  document.getElementById('statCopyBtn').addEventListener('click', () => {
    const code = generateConsoleCode(_fields);
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('statCopyBtn');
      btn.textContent = '✅ 복사됨!';
      setTimeout(()=>{ btn.textContent = '📋 콘솔코드 복사'; }, 2000);
    });
  });
}

initStatOCR();
