/* =============================================
   data.js — 모든 게임 데이터 (GMS 기준, 일부 근삿값)
   ============================================= */

/* ── 주보 ── */
const BOSS_DATA = [
  { id:'jupiter',    name:'유피테르',            diffs:{normal:0,hard:0},                                                               maxParty:3, minLevel:295, img:'images/bosses/jupiter.webp' },
  { id:'baldrix',    name:'발드릭스',            diffs:{normal:2_800_000_000,hard:4_200_000_000},                                        maxParty:3, minLevel:290, img:'images/bosses/baldrix.webp' },
  { id:'limbo',      name:'림보',                diffs:{normal:2_100_000_000,hard:3_745_000_000},                                        maxParty:3, minLevel:285, img:'images/bosses/limbo.webp' },
  { id:'hyungseong', name:'찬란한 흉성',         diffs:{normal:1_452_000_000,hard:3_990_000_000},                                        maxParty:3, minLevel:280, img:'images/bosses/hyungseong.webp' },
  { id:'kaling',     name:'카링',                diffs:{easy:1_031_250_000,normal:1_506_500_000,hard:2_990_000_000,extreme:6_026_000_000},maxParty:6, minLevel:275, img:'images/bosses/kaling.webp' },
  { id:'daejuk',     name:'최초의 대적자',       diffs:{easy:985_000_000,normal:1_365_000_000,hard:2_940_000_000,extreme:5_880_000_000},  maxParty:3, minLevel:270, img:'images/bosses/daejuk.webp' },
  { id:'kalos',      name:'감시자 칼로스',       diffs:{easy:937_500_000,normal:1_300_000_000,chaos:2_600_000_000,extreme:5_200_000_000}, maxParty:6, minLevel:270, img:'images/bosses/kalos.webp' },
  { id:'seren',      name:'선택받은 세렌',       diffs:{normal:889_021_875,hard:1_096_562_500,extreme:4_235_000_000},                     maxParty:6, minLevel:260, img:'images/bosses/seren.webp' },
  { id:'blackmage',  name:'검은 마법사',         diffs:{hard:4_500_000_000,extreme:18_000_000_000},                                      maxParty:6, minLevel:255, img:'images/bosses/blackmage.webp', monthly:true },
  { id:'jinhilla',   name:'진 힐라',             diffs:{normal:581_880_000,hard:762_105_000},                                            maxParty:6, minLevel:250, img:'images/bosses/jinhilla.webp' },
  { id:'dunkel',     name:'듄켈',                diffs:{normal:316_875_000,hard:667_920_000},                                            maxParty:6, minLevel:255, img:'images/bosses/dunkel.webp' },
  { id:'dusk',       name:'더스크',              diffs:{normal:297_675_000,hard:563_945_000},                                            maxParty:6, minLevel:245, img:'images/bosses/dusk.webp' },
  { id:'will',       name:'윌',                  diffs:{easy:246_744_750,normal:279_075_000,hard:621_810_000},                            maxParty:6, minLevel:235, img:'images/bosses/will.webp' },
  { id:'lucid',      name:'루시드',              diffs:{easy:237_009_375,normal:253_828_125,hard:504_000_000},                           maxParty:6, minLevel:220, img:'images/bosses/lucid.webp' },
  { id:'gaensl',     name:'가디언 엔젤 슬라임',  diffs:{normal:231_673_500,chaos:600_578_125},                                           maxParty:6, minLevel:200, img:'images/bosses/gaensl.webp' },
  { id:'demian',     name:'데미안',              diffs:{normal:169_000_000,hard:421_875_000},                                            maxParty:6, minLevel:200, img:'images/bosses/demian.webp' },
  { id:'suu',        name:'스우',                diffs:{normal:162_562_500,hard:444_675_000,extreme:1_397_500_000},                      maxParty:{normal:6,hard:6,extreme:2}, minLevel:200, img:'images/bosses/suu.webp' },
  { id:'papulus',    name:'파풀라투스',          diffs:{chaos:132_250_000},                                                              maxParty:6, minLevel:180, img:'images/bosses/papulus.webp' },
  { id:'akechi',     name:'아케치',              diffs:{normal:144_000_000},                                                             maxParty:6, minLevel:140, img:'images/bosses/Akechi.png' },
  { id:'nohime',     name:'노히메',              diffs:{normal:81_000_000},                                                              maxParty:6, minLevel:140, img:'images/bosses/Princess_No.png' },
  { id:'vellum',     name:'벨룸',                diffs:{chaos:105_062_500},                                                              maxParty:6, minLevel:180, img:'images/bosses/vellum.webp' },
  { id:'bq',         name:'블러디퀸',            diffs:{chaos:81_000_000},                                                               maxParty:6, minLevel:180, img:'images/bosses/bq.webp' },
  { id:'pierre',     name:'피에르',              diffs:{chaos:81_000_000},                                                               maxParty:6, minLevel:180, img:'images/bosses/pierre.webp' },
  { id:'vanvan',     name:'반반',                diffs:{chaos:81_000_000},                                                               maxParty:6, minLevel:180, img:'images/bosses/vanvan.webp' },
  { id:'magnus',     name:'매그너스',            diffs:{hard:95_062_500},                                                                maxParty:6, minLevel:155, img:'images/bosses/magnus.webp' },
  { id:'cygnus',     name:'시그너스',            diffs:{easy:45_562_500,normal:72_250_000},                                              maxParty:6, minLevel:140, img:'images/bosses/cygnus.webp' },
  { id:'pinkbean',   name:'핑크빈',              diffs:{chaos:64_000_000},                                                               maxParty:6, minLevel:140, img:'images/bosses/pinkbean.webp' },
  { id:'hilla',      name:'힐라',                diffs:{hard:56_250_000},                                                                maxParty:6, minLevel:120, img:'images/bosses/hilla.webp' },
  { id:'zakum',      name:'자쿰',                diffs:{chaos:81_000_000},                                                               maxParty:6, minLevel:140, img:'images/bosses/zakum.webp' },
];

const DIFF_META = {
  none:    { label:'-',  cls:'diff-none'    },
  easy:    { label:'EASY',    cls:'diff-easy'    },
  normal:  { label:'NORMAL',  cls:'diff-normal'  },
  hard:    { label:'HARD',    cls:'diff-hard'    },
  chaos:   { label:'CHAOS',   cls:'diff-chaos'   },
  extreme: { label:'EXTREME', cls:'diff-extreme' },
};

const MAX_CRYSTALS = 180;
const MAX_CHARS    = 20;

/* ── 직업 목록 (nexon 영문 직업명 기준 / name 이 곧 아이콘 파일명) ── */
const JOB_LIST = [
  {name:'Hero'},{name:'Paladin'},{name:'Dark Knight'},
  {name:'Arch Mage (Fire, Poison)'},{name:'Arch Mage (Ice, Lightning)'},{name:'Bishop'},
  {name:'Bowmaster'},{name:'Marksman'},{name:'Pathfinder'},
  {name:'Night Lord'},{name:'Shadower'},{name:'Dual Blade'},
  {name:'Buccaneer'},{name:'Corsair'},{name:'Cannoneer'},
  {name:'Dawn Warrior'},{name:'Blaze Wizard'},{name:'Wind Archer'},{name:'Night Walker'},{name:'Thunder Breaker'},{name:'Mihile'},
  {name:'Aran'},{name:'Evan'},{name:'Mercedes'},{name:'Phantom'},{name:'Luminous'},{name:'Shade'},
  {name:'Battle Mage'},{name:'Wild Hunter'},{name:'Mechanic'},{name:'Blaster'},
  {name:'Demon Slayer'},{name:'Demon Avenger'},{name:'Xenon'},
  {name:'Kaiser'},{name:'Kain'},{name:'Cadena'},{name:'Angelic Buster'},
  {name:'Hayato'},{name:'Kanna'},
  {name:'Illium'},{name:'Ark'},{name:'Adele'},{name:'Khali'},
  {name:'Hoyoung'},{name:'Lara'},{name:'Ren'},
  {name:'Zero'},{name:'Kinesis'},{name:'Lynn'},
  {name:'Erel Light'},{name:'Sia Astelle'},
];

/* ══════════════════════════════════════════════
   HEXA Matrix 솔 에르다 비용 (근삿값 — 게임 패치로 변경될 수 있음)
   [SE(솔 에르다), SEF(솔 에르다 조각)]  레벨 n→n+1 비용
══════════════════════════════════════════════ */
// 스킬 코어 (오리진) lv 0→30
const HEXA_SKILL_COSTS = [
  [5,100],[1,30],[1,35],[1,40],[2,45],[2,50],[2,55],[3,60],[3,65],[10,200],
  [3,80],[3,90],[4,100],[4,110],[4,120],[4,130],[4,140],[4,150],[5,160],[15,350],
  [5,170],[5,180],[5,190],[5,200],[5,210],[6,220],[6,230],[6,240],[7,250],[20,500],
];
// 마스터리 코어 lv 0→30
const HEXA_MASTERY_COSTS = [
  [3,50],[1,15],[1,18],[1,20],[1,23],[1,25],[1,28],[2,30],[2,33],[5,100],
  [2,40],[2,45],[2,50],[2,55],[2,60],[2,65],[2,70],[2,75],[3,80],[8,175],
  [3,85],[3,90],[3,95],[3,100],[3,105],[3,110],[3,115],[3,120],[4,125],[10,250],
];
// 강화 코어 lv 0→30
const HEXA_BOOST_COSTS = [
  [4,75],[1,23],[1,27],[1,30],[2,34],[2,38],[2,42],[3,45],[3,49],[8,150],
  [3,60],[3,68],[3,75],[3,83],[3,90],[3,98],[3,105],[3,113],[4,120],[12,263],
  [4,128],[4,135],[4,143],[4,150],[4,158],[5,165],[5,173],[5,180],[6,188],[15,375],
];
// 공용 코어 (Sol Janus / Sol Hecate) lv 0→30
const HEXA_COMMON_COSTS = [
  [7,125],[2,38],[2,44],[2,50],[3,57],[3,63],[3,69],[5,75],[5,82],[14,300],
  [5,110],[5,124],[6,138],[6,152],[6,165],[6,179],[6,193],[6,207],[7,220],[17,525],
  [7,234],[7,248],[7,262],[7,275],[7,289],[9,303],[9,317],[9,330],[10,344],[20,750],
];
// 하위 호환용 alias
const HEXA_ORIGIN_COSTS = HEXA_SKILL_COSTS;

/* ══════════════════════════════════════════════
   직업별 헥사 스킬 데이터
   folder: images/skill/{folder}/ 안에 1.webp~14.webp 배치
   skill[0~1]=스킬코어, mastery[0~3]=마스터리, boost[0~3]=강화, common[0~1]=공용
══════════════════════════════════════════════ */
const HEXA_JOB_DATA = {
  /* ── 이미지 폴더가 있는 직업 ── */
  'Mercedes': {
    folder:  'Mercedes',
    skill:   ['언페이딩 글로리', '엘리멘탈 스피릿'],
    mastery: ['이슈타르의 링 VI', '래쓰 오브 엔릴 VI', '유니콘 스파이크 VI', '엘리멘탈 나이트 VI'],
    boost:   ['엘리멘탈 고스트 강화', '실피디아 강화', '이르칼라의 숨결 강화', '로얄 나이츠 강화'],
    common:  ['솔 야누스', '솔 헤카테', '프리드의 가호 VI'],
  },
  'Adele': {
    folder:  'Adele',
    skill:   ['스킬 노드 1', '스킬 노드 2'],
    mastery: ['마스터리 1', '마스터리 2', '마스터리 3', '마스터리 4'],
    boost:   ['부스트 1', '부스트 2', '부스트 3', '부스트 4'],
    common:  ['솔 야누스', '솔 헤카테'],
  },
  /* ── 이미지 폴더 없는 직업 (이름만 지정, 이미지 추가 시 folder도 설정) ── */
  'Hero':           { folder:'Hero', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Paladin':        { folder:'Paladin', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Dark Knight':    { folder:'DarkNight', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Arch Mage (Fire, Poison)':     { folder:'Arch_MageFP', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Arch Mage (Ice, Lightning)':   { folder:'Arch_MageIL', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Bishop':         { folder:'Bishop', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Bowmaster':      { folder:'BowMaster', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Marksman':       { folder:'Marksman', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Pathfinder':     { folder:'PathFinder', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Night Lord':     { folder:'NightLord', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Shadower':       { folder:'Shadower', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Dual Blade':     { folder:'DualBlade', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Buccaneer':      { folder:'Viper', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Corsair':        { folder:'Captain', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Cannoneer':      { folder:'CannonShooter', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Dawn Warrior':   { folder:'SoulMaster', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Blaze Wizard':   { folder:'FlameWizard', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Wind Archer':    { folder:'WindBreaker', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Night Walker':   { folder:'NightWalker', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Thunder Breaker':{ folder:'Striker', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Mihile':         { folder:'Mikhail', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Aran':           { folder:'Aran', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Evan':           { folder:'Evan', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Phantom':        { folder:'Phantom', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Luminous':       { folder:'Luminous', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Shade':          { folder:'Eunwol', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Battle Mage':    { folder:'Battle', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Wild Hunter':    { folder:'WildHunter', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Mechanic':       { folder:'Mechanic', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Blaster':        { folder:'Blaster', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Demon Slayer':   { folder:'DemonSlayer', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Demon Avenger':  { folder:'DemonAvenger', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Xenon':          { folder:'Xenon', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Kaiser':         { folder:'Kasier', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Kain':           { folder:'Kain', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Cadena':         { folder:'Cadena', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Angelic Buster': { folder:'AngelicBuster', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Hayato':         { folder:'Hayato', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Kanna':          { folder:'Kanna', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Illium':         { folder:'Illium', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Ark':            { folder:'Ark', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Khali':          { folder:'Khalie', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Hoyoung':        { folder:'HoYoung', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Lara':           { folder:'Lara', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Ren':            { folder:'Ren', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Zero':           { folder:'Zero', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Kinesis':        { folder:'Kinesis', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Lynn':           { folder:'Lynn', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Erel Light':     { folder:'ErelLight', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
  'Sia Astelle':    { folder:'SiaAstelle', skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테','공용코어 1'] },
};
const HEXA_DEFAULT_DATA = { folder:null, skill:['스킬 노드 1','스킬 노드 2'], mastery:['마스터리 1','마스터리 2','마스터리 3','마스터리 4'], boost:['부스트 1','부스트 2','부스트 3','부스트 4'], common:['솔 야누스','솔 헤카테'] };

/* 누적 비용 헬퍼 */
function hexaCumulative(costTable, fromLv, toLv) {
  let se = 0, sef = 0;
  for (let i = fromLv; i < toLv; i++) {
    se  += costTable[i][0];
    sef += costTable[i][1];
  }
  return { se, sef };
}

/* ══════════════════════════════════════════════
   스타포스
══════════════════════════════════════════════ */
// [성공률, 실패율(유지or하락), 파괴율]
const SF_RATES = [
  [.95,.05,.00],[.90,.10,.00],[.85,.15,.00],[.85,.15,.00],[.80,.20,.00],
  [.75,.24,.01],[.70,.29,.01],[.65,.34,.01],[.60,.39,.01],[.55,.44,.01],
  [.50,.49,.01],[.45,.53,.02],[.40,.58,.02],[.35,.63,.02],[.30,.68,.02],
  [.30,.68,.02],[.30,.68,.02],[.30,.68,.02],[.30,.68,.02],[.30,.68,.02],
  [.30,.67,.03],[.30,.67,.03],[.03,.92,.05],[.02,.91,.07],[.01,.90,.09],
];
// 10성 이상 실패 시 별 하락 여부 (true = 하락)
const SF_DECREASE = [
  false,false,false,false,false,false,false,false,false,false,
  true,true,true,true,true,true,true,true,true,true,
  true,true,true,true,true,
];
// 파괴 방지 성 (12★, 17★, 22★에서 실패해도 12/17/22로 돌아옴)
const SF_NO_BOOM_FLOORS = new Set([12, 17, 22]);

// 아이템 레벨별 기준 비용 (1성당 메소, 레벨200 기준)
const SF_BASE_COST_200 = [
  500_000, 900_000, 1_400_000, 2_000_000, 2_800_000,
  3_800_000, 5_200_000, 7_000_000, 9_500_000, 12_500_000,
  16_500_000, 21_500_000, 28_000_000, 36_000_000, 46_000_000,
  58_000_000, 73_000_000, 91_000_000, 114_000_000, 142_000_000,
  176_000_000, 218_000_000, 268_000_000, 330_000_000, 410_000_000,
];

function sfCost(itemLevel, star) {
  const scale = Math.pow(itemLevel / 200, 2.7);
  return Math.round(SF_BASE_COST_200[star] * scale / 10_000) * 10_000;
}

/* ══════════════════════════════════════════════
   보스 HP 테이블 (근삿값, 단위: 억메소 아닌 HP수치)
   hp 단위: 억 (100,000,000)
══════════════════════════════════════════════ */
/* lv: 보스 레벨 / force: 요구 포스(근삿값) / ftype: 'arc'(아케인·파랑) | 'auth'(어센틱·보라) | null
   ※ 포스 수치는 근삿값이며 maplehub 등과 대조 필요.
     데미지 보정(미구현, 참고용):
      - 아케인포스: 요구량의 150% 도달 시 데미지 1.5배
      - 어센틱포스: 요구량 +10마다 +5%, 최대 125% */
const BOSS_HP_TABLE = [
  {name:'유피테르',           diff:'노말',     hp:102_600_000,  lv:295, pdr:380, force:810,  ftype:'auth'},
  {name:'유피테르',           diff:'하드',     hp:494_000_000,  lv:295, pdr:380, force:810,  ftype:'auth'},
  {name:'발드릭스',           diff:'노말',     hp:90_600_000,   lv:290, pdr:380, force:700,  ftype:'auth'},
  {name:'발드릭스',           diff:'하드',     hp:203_400_000,  lv:290, pdr:380, force:700,  ftype:'auth'},
  {name:'림보',               diff:'노말',     hp:64_800_000,   lv:285, pdr:380, force:500,  ftype:'auth'},
  {name:'림보',               diff:'하드',     hp:125_500_000,  lv:285, pdr:380, force:500,  ftype:'auth'},
  {name:'찬란한 흉성',        diff:'노말',     hp:32_600_000,   lv:280, pdr:380, force:400,  ftype:'auth'},
  {name:'찬란한 흉성',        diff:'하드',     hp:147_000_000,  lv:280, pdr:380, force:550,  ftype:'auth'},
  {name:'카링',               diff:'이지',     hp:9_210_000,    lv:275, pdr:380, force:230,  ftype:'auth'},
  {name:'카링',               diff:'노말',     hp:39_300_000,   lv:285, pdr:380, force:330,  ftype:'auth'},
  {name:'카링',               diff:'하드',     hp:94_000_000,   lv:285, pdr:380, force:350,  ftype:'auth'},
  {name:'카링',               diff:'익스트림', hp:545_900_000,  lv:285, pdr:380, force:480,  ftype:'auth'},
  {name:'최초의 대적자',      diff:'이지',     hp:5_710_900,    lv:270, pdr:380, force:220,  ftype:'auth'},
  {name:'최초의 대적자',      diff:'노말',     hp:16_400_000,   lv:280, pdr:380, force:320,  ftype:'auth'},
  {name:'최초의 대적자',      diff:'하드',     hp:105_900_000,  lv:285, pdr:380, force:340,  ftype:'auth'},
  {name:'최초의 대적자',      diff:'익스트림', hp:335_600_000,  lv:290, pdr:380, force:460,  ftype:'auth'},
  {name:'감시자 칼로스',      diff:'이지',     hp:3_570_000,    lv:270, pdr:380, force:200,  ftype:'auth'},
  {name:'감시자 칼로스',      diff:'노말',     hp:10_600_000,   lv:280, pdr:380, force:300,  ftype:'auth'},
  {name:'감시자 칼로스',      diff:'카오스',   hp:51_000_000,   lv:285, pdr:380, force:330,  ftype:'auth'},
  {name:'감시자 칼로스',      diff:'익스트림', hp:215_700_000,  lv:285, pdr:380, force:440,  ftype:'auth'},
  {name:'선택받은 세렌',      diff:'노말',     hp:2_080_000,    lv:270, pdr:380, force:200,  ftype:'auth'},
  {name:'선택받은 세렌',      diff:'하드',     hp:4_830_000,    lv:275, pdr:380, force:200,  ftype:'auth'},
  {name:'선택받은 세렌',      diff:'익스트림', hp:64_800_000,   lv:280, pdr:380, force:200,  ftype:'auth'},
  {name:'검은 마법사',        diff:'하드',     hp:4_725_000,    lv:275, pdr:300, force:1320, ftype:'arc'},
  {name:'검은 마법사',        diff:'익스트림', hp:48_100_000,   lv:280, pdr:300, force:1320, ftype:'arc'},
  {name:'진 힐라',            diff:'노말',     hp:880_000,      lv:250, pdr:300, force:820,  ftype:'arc'},
  {name:'진 힐라',            diff:'하드',     hp:1_760_000,    lv:255, pdr:300, force:900,  ftype:'arc'},
  {name:'듄켈',               diff:'노말',     hp:260_000,      lv:265, pdr:300, force:850,  ftype:'arc'},
  {name:'듄켈',               diff:'하드',     hp:1_575_000,    lv:265, pdr:300, force:850,  ftype:'arc'},
  {name:'더스크',             diff:'노말',     hp:255_000,      lv:255, pdr:300, force:730,  ftype:'arc'},
  {name:'더스크',             diff:'카오스',   hp:1_275_000,    lv:255, pdr:300, force:730,  ftype:'arc'},
  {name:'윌',                 diff:'이지',     hp:168_000,      lv:235, pdr:300, force:560,  ftype:'arc'},
  {name:'윌',                 diff:'노말',     hp:252_000,      lv:250, pdr:300, force:760,  ftype:'arc'},
  {name:'윌',                 diff:'하드',     hp:1_260_000,    lv:250, pdr:300, force:760,  ftype:'arc'},
  {name:'루시드',             diff:'이지',     hp:120_000,      lv:230, pdr:300, force:360,  ftype:'arc'},
  {name:'루시드',             diff:'노말',     hp:240_000,      lv:230, pdr:300, force:360,  ftype:'arc'},
  {name:'루시드',             diff:'하드',     hp:1_176_000,    lv:230, pdr:300, force:360,  ftype:'arc'},
  {name:'가디언 엔젤 슬라임', diff:'노말',     hp:50_000,       lv:210, pdr:300, force:null, ftype:null},
  {name:'가디언 엔젤 슬라임', diff:'카오스',   hp:900_000,      lv:220, pdr:300, force:null, ftype:null},
  {name:'데미안',             diff:'노말',     hp:12_000,       lv:190, pdr:300, force:null, ftype:null},
  {name:'데미안',             diff:'하드',     hp:360_000,      lv:210, pdr:300, force:null, ftype:null},
  {name:'스우',               diff:'노말',     hp:15_700,       lv:190, pdr:300, force:null, ftype:null},
  {name:'스우',               diff:'하드',     hp:335_000,      lv:210, pdr:300, force:null, ftype:null},
  {name:'스우',               diff:'익스트림', hp:18_100_000,   lv:285, pdr:380, force:null, ftype:null, nameOverride:'섬멸병기 스우'},
  {name:'파풀라투스',         diff:'카오스',   hp:5_040,        lv:180, pdr:250, force:null, ftype:null},
  {name:'아케치',             diff:'노말',     hp:3_040,        lv:140, pdr:300, force:null, ftype:null},
  {name:'노히메',             diff:'노말',     hp:5_000,        lv:140, pdr:100, force:null, ftype:null},
  {name:'벨룸',               diff:'카오스',   hp:2_000,        lv:180, pdr:200, force:null, ftype:null},
  {name:'블러디퀸',           diff:'카오스',   hp:1_400,        lv:180, pdr:120, force:null, ftype:null},
  {name:'피에르',             diff:'카오스',   hp:800,          lv:180, pdr:80,  force:null, ftype:null},
  {name:'반반',               diff:'카오스',   hp:1_000,        lv:180, pdr:100, force:null, ftype:null},
  {name:'매그너스',           diff:'하드',     hp:1_200,        lv:155, pdr:120, force:null, ftype:null},
  {name:'시그너스',           diff:'이지',     hp:105,          lv:140, pdr:100, force:null, ftype:null},
  {name:'시그너스',           diff:'노말',     hp:210,          lv:160, pdr:100, force:null, ftype:null},
  {name:'핑크빈',             diff:'카오스',   hp:693,          lv:140, pdr:100, force:null, ftype:null},
  {name:'힐라',               diff:'하드',     hp:168,          lv:120, pdr:100, force:null, ftype:null},
  {name:'자쿰',               diff:'카오스',   hp:840,          lv:140, pdr:100, force:null, ftype:null},
];

// 포뻥: 요구포스 초과분 5당 +2% 데미지 (최대 +100%)
function forceBoost(myForce, requiredForce) {
  if (myForce < requiredForce) {
    const penalty = Math.floor((requiredForce - myForce) / 5) * 10;
    return { pct: -Math.min(penalty, 100), penalty: true };
  }
  const bonus = Math.floor((myForce - requiredForce) / 5) * 2;
  return { pct: Math.min(bonus, 100), penalty: false };
}

// 아케인 심볼 레벨별 누적 경험치 (1→20레벨)
const ARCANE_SYM_EXP = [
  0,12,15,20,27,36,48,64,86,115,154,207,277,371,496,664,888,1188,1590,2130,
];
// 어센틱 심볼 레벨별 누적 경험치
const SACRED_SYM_EXP = [
  0,20,30,45,67,100,150,225,338,507,760,1140,1710,2565,3848,5772,8658,12987,19480,29220,
];

/* ══════════════════════════════════════════════
   해방 계산기 — 제네시스 (어둠의 흔적 누적/소모 방식)
   (근삿값 — 패치에 따라 변경될 수 있음)
══════════════════════════════════════════════ */

/* 보스 격파 시 어둠의 흔적 획득량 (난이도별)
   ※ blackmage 는 월간 보스 → 주간이 아닌 월 1회 누적 */
const TRACE_YIELD = {
  suu:      { normal:10, hard:50, extreme:50 },
  demian:   { normal:10, hard:50 },
  lucid:    { easy:15,  normal:20, hard:65 },
  will:     { easy:15,  normal:25, hard:75 },
  dusk:     { normal:20, hard:65 },
  dunkel:   { normal:25, hard:75 },
  jinhilla: { normal:45, hard:90 },
  blackmage:{ hard:600, extreme:600 },
};

/* 제네시스 해방 퀘스트 체인 — 누적 흔적 임계치(cum).
   각 퀘스트 소모량 = 해당 cum - 직전 cum.
   목표(해방) 누적 = 6500 */
const GENESIS_QUESTS = [
  { name:'반 레온',      cum:0    },
  { name:'아카이럼',     cum:500  },
  { name:'매그너스',     cum:1000 },
  { name:'스우', cum:1500 },
  { name:'데미안',       cum:2500 },
  { name:'윌',           cum:3500 },
  { name:'루시드',       cum:4500 },
  { name:'진 힐라',      cum:5500 },
];
const GENESIS_TARGET = 6500;
const TRACE_HOLD_MAX = 3000;
const GENESIS_PASS_MULT = 3;     // 제네시스 패스: 흔적 획득 3배

/* ─── 데스티니 해방 ─── */
const DESTINY_RESOLVE_YIELD = {
  seren:      { 하드:6,   익스트림:80 },
  kalos:      { 노말:10,  하드:70,  카오스:400 },
  daejuk:     { 노말:20,  하드:120, 익스트림:500 },
  kaling:     { 노말:20,  하드:160, 익스트림:1200 },
  hyungseong: { 노말:20,  하드:380 },
  limbo:      { 노말:120, 하드:360 },
  baldrix:    { 노말:150, 하드:450 },
  jupiter:    { 노말:160, 하드:500 },
};
const DESTINY_BOSS_META = [
  { id:'seren',       name:'선택받은 세렌',  maxParty:6, img:'images/bosses/seren.webp' },
  { id:'kalos',       name:'감시자 칼로스',  maxParty:6, img:'images/bosses/kalos.webp' },
  { id:'daejuk',      name:'최초의 대적자',  maxParty:3, img:'images/bosses/daejuk.webp' },
  { id:'kaling',      name:'카링',           maxParty:6, img:'images/bosses/kaling.webp' },
  { id:'hyungseong',  name:'찬란한 흉성',    maxParty:3, img:'images/bosses/hyungseong.webp' },
  { id:'limbo',       name:'림보',           maxParty:3, img:'images/bosses/limbo.webp' },
  { id:'baldrix',     name:'발드릭스',       maxParty:3, img:'images/bosses/baldrix.webp' },
  { id:'jupiter',     name:'유피테르',       maxParty:3, img:'images/bosses/jupiter.webp' },
];
const DESTINY_QUESTS = [
  { name:'세렌',     phase:1 },
  { name:'칼로스',   phase:1 },
  { name:'카링',     phase:1 },
  { name:'대적자',   phase:2 },
  { name:'림보',     phase:2 },
  { name:'발드릭스', phase:2 },
];
const DESTINY_1ST_TARGET = 7500;
const DESTINY_2ND_TARGET  = 45000;
const DESTINY_RESOLVE_MAX = 50000;

/* ══════════════════════════════════════════════
   보스 HP 페이즈 데이터 (직접 기입)
   형식: '보스명_난이도': [{label:'페이즈1', hp:'300억'}]
   ※ BOSS_HP_TABLE 의 diff 값(한글)과 동일하게 키를 작성하세요.
══════════════════════════════════════════════ */
const BOSS_HP_PHASES = {
  // ── 아케치 ──
  '아케치_노말': [
    { label:'Phase 1', hp:'152B' },
    { label:'Phase 2', hp:'152B' },
  ],
  // ── 파풀라투스 ──
  '파풀라투스_카오스': [
    { label:'Phase 1', hp:'378B' },
    { label:'Phase 2', hp:'126B' },
  ],
  // ── 데미안 ──
  '데미안_노말': [
    { label:'Phase 1', hp:'840B' },
    { label:'Phase 2', hp:'360B' },
  ],
  '데미안_하드': [
    { label:'Phase 1', hp:'25.20T' },
    { label:'Phase 2', hp:'10.80T' },
  ],
  // ── 스우 (Lotus) ──
  '스우_노말': [
    { label:'Phase 1', hp:'470B' },
    { label:'Phase 2', hp:'470B' },
    { label:'Phase 3', hp:'630B' },
  ],
  '스우_하드': [
    { label:'Phase 1', hp:'10T' },
    { label:'Phase 2', hp:'10T' },
    { label:'Phase 3', hp:'13.50T' },
  ],
  '스우_익스트림': [
    { label:'Phase 1', hp:'545T' },
    { label:'Phase 2', hp:'545T' },
    { label:'Phase 3', hp:'720T' },
  ],
  // ── 루시드 (Lucid) ──
  '루시드_이지': [
    { label:'Phase 1', hp:'6T' },
    { label:'Phase 2', hp:'6T' },
  ],
  '루시드_노말': [
    { label:'Phase 1', hp:'12T' },
    { label:'Phase 2', hp:'12T' },
  ],
  '루시드_하드': [
    { label:'Phase 1', hp:'50.80T' },
    { label:'Phase 2', hp:'54T' },
    { label:'Phase 3', hp:'12.80T' },
  ],
  // ── 윌 (Will) ──
  '윌_이지': [
    { label:'Phase 1 Blue (×3)', hp:'933.33B' },
    { label:'Phase 1 Purple (×3)', hp:'933.33B' },
    { label:'Phase 2 (×2)', hp:'2.10T' },
    { label:'Phase 3', hp:'7T' },
  ],
  '윌_노말': [
    { label:'Phase 1 Blue (×3)', hp:'1.40T' },
    { label:'Phase 1 Purple (×3)', hp:'1.40T' },
    { label:'Phase 2 (×2)', hp:'3.15T' },
    { label:'Phase 3', hp:'10.50T' },
  ],
  '윌_하드': [
    { label:'Phase 1 Blue (×3)', hp:'7T' },
    { label:'Phase 1 Purple (×3)', hp:'7T' },
    { label:'Phase 2 (×2)', hp:'15.75T' },
    { label:'Phase 3', hp:'52.50T' },
  ],
  // ── 진 힐라 (Verus Hilla) ──
  '진 힐라_노말': [
    { label:'Phase 1', hp:'22T' },
    { label:'Phase 2', hp:'22T' },
    { label:'Phase 3', hp:'22T' },
    { label:'Phase 4', hp:'22T' },
  ],
  '진 힐라_하드': [
    { label:'Phase 1', hp:'44T' },
    { label:'Phase 2', hp:'44T' },
    { label:'Phase 3', hp:'44T' },
    { label:'Phase 4', hp:'44T' },
  ],
  // ── 검은 마법사 (Black Mage) ──
  '검은 마법사_하드': [
    { label:'Phase 1', hp:'63T' },
    { label:'Phase 2', hp:'115.50T' },
    { label:'Phase 3', hp:'157.50T' },
    { label:'Phase 4', hp:'136.50T' },
  ],
  '검은 마법사_익스트림': [
    { label:'Phase 1', hp:'1.18Q' },
    { label:'Phase 2', hp:'1.19Q' },
    { label:'Phase 3', hp:'1.28Q' },
    { label:'Phase 4', hp:'1.15Q' },
  ],
  // ── 선택받은 세렌 (Chosen Seren) ──
  '선택받은 세렌_노말': [
    { label:'Phase 1', hp:'52.50T' },
    { label:'Phase 2', hp:'155.50T' },
  ],
  '선택받은 세렌_하드': [
    { label:'Phase 1', hp:'126T' },
    { label:'Phase 2', hp:'357T' },
  ],
  '선택받은 세렌_익스트림': [
    { label:'Phase 1', hp:'1.32Q' },
    { label:'Phase 2', hp:'5.16Q' },
  ],
  // ── 감시자 칼로스 (Kalos the Guardian) ──
  '감시자 칼로스_이지': [
    { label:'Phase 1', hp:'94.50T' },
    { label:'Phase 2 (×4)', hp:'65.63T' },
  ],
  '감시자 칼로스_노말': [
    { label:'Phase 1', hp:'336T' },
    { label:'Phase 2 (×4)', hp:'180T' },
  ],
  '감시자 칼로스_카오스': [
    { label:'Phase 1', hp:'1.06Q' },
    { label:'Phase 2 (×4)', hp:'1.01Q' },
  ],
  '감시자 칼로스_익스트림': [
    { label:'Phase 1', hp:'5.97Q' },
    { label:'Phase 2 (×4)', hp:'3.90Q' },
  ],
  // ── 최초의 대적자 (The First Adversary) ──
  '최초의 대적자_이지': [
    { label:'Phase 1', hp:'171.54T' },
    { label:'Phase 2', hp:'171.54T' },
    { label:'Phase 3', hp:'228.01T' },
  ],
  '최초의 대적자_노말': [
    { label:'Phase 1', hp:'494.11T' },
    { label:'Phase 2', hp:'494.11T' },
    { label:'Phase 3', hp:'646.78T' },
  ],
  '최초의 대적자_익스트림': [
    { label:'Phase 1', hp:'10.08Q' },
    { label:'Phase 2', hp:'10.08Q' },
    { label:'Phase 3', hp:'13.40Q' },
  ],
  '최초의 대적자_하드': [
    { label:'Phase 1', hp:'3.18Q' },
    { label:'Phase 2', hp:'3.18Q' },
    { label:'Phase 3', hp:'4.23Q' },
  ],
  // ── 카링 (Kaling) ──
  '카링_이지': [
    { label:'Phase 1 Perils (×3)', hp:'96T' },
    { label:'Phase 2', hp:'105T' },
    { label:'Phase 3 Kaling', hp:'150T' },
    { label:'Phase 3 Perils (×3)', hp:'126T' },
  ],
  '카링_노말': [
    { label:'Phase 1 Perils (×3)', hp:'400T' },
    { label:'Phase 2', hp:'468T' },
    { label:'Phase 3 Kaling', hp:'722T' },
    { label:'Phase 3 Perils (×3)', hp:'512T' },
  ],
  '카링_하드': [
    { label:'Phase 1 Perils (×3)', hp:'906T' },
    { label:'Phase 2', hp:'1.40Q' },
    { label:'Phase 3 Kaling', hp:'2.24Q' },
    { label:'Phase 3 Perils (×3)', hp:'1.83Q' },
  ],
  '카링_익스트림': [
    { label:'Phase 1 Perils (×3)', hp:'6.07Q' },
    { label:'Phase 2', hp:'6.93Q' },
    { label:'Phase 3 Kaling', hp:'8.66Q' },
    { label:'Phase 3 Perils (×3)', hp:'6.93Q' },
  ],
  // ── 찬란한 흉성 (Malefic Star) ──
  '찬란한 흉성_노말': [
    { label:'Phase 1', hp:'657.60T' },
    { label:'Phase 2', hp:'1.30Q' },
    { label:'Phase 3', hp:'1.30Q' },
  ],
  '찬란한 흉성_하드': [
    { label:'Phase 1', hp:'2.90Q' },
    { label:'Phase 2', hp:'5.90Q' },
    { label:'Phase 3', hp:'5.90Q' },
  ],
  // ── 림보 (Limbo) ──
  '림보_노말': [
    { label:'Phase 1', hp:'1.94Q' },
    { label:'Phase 2 (×2)', hp:'970T' },
    { label:'Phase 3', hp:'2.60Q' },
  ],
  '림보_하드': [
    { label:'Phase 1', hp:'3.78Q' },
    { label:'Phase 2 (×2)', hp:'1.89Q' },
    { label:'Phase 3', hp:'4.99Q' },
  ],
  // ── 발드릭스 (Baldrix) ──
  '발드릭스_노말': [
    { label:'Phase 1', hp:'2.38Q' },
    { label:'Phase 2', hp:'2.53Q' },
    { label:'Phase 3', hp:'4.15Q' },
  ],
  '발드릭스_하드': [
    { label:'Phase 1', hp:'5.34Q' },
    { label:'Phase 2', hp:'5.69Q' },
    { label:'Phase 3', hp:'9.31Q' },
  ],
  '유피테르_노말': [
    { label:'Phase 1', hp:'2.05Q' },
    { label:'Phase 2', hp:'3.08Q' },
    { label:'Phase 3', hp:'5.13Q' },
  ],
  '유피테르_하드': [
    { label:'Phase 1', hp:'9.88Q' },
    { label:'Phase 2', hp:'14.82Q' },
    { label:'Phase 3', hp:'24.70Q' },
  ],
};
