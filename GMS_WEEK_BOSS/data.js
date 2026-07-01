/* =============================================
   data.js — 보스 · 직업 공통 데이터
   ============================================= */

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
  { id:'dusk',       name:'더스크',              diffs:{normal:297_675_000,chaos:563_945_000},                                           maxParty:6, minLevel:245, img:'images/bosses/dusk.webp' },
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
  none:    { label:'-',       cls:'diff-none'    },
  easy:    { label:'EASY',    cls:'diff-easy'    },
  normal:  { label:'NORMAL',  cls:'diff-normal'  },
  hard:    { label:'HARD',    cls:'diff-hard'    },
  chaos:   { label:'CHAOS',   cls:'diff-chaos'   },
  extreme: { label:'EXTREME', cls:'diff-extreme' },
};

const MAX_CRYSTALS = 180;
const MAX_CHARS    = 20;

const STORAGE_KEYS = {
  boss:        'gms_boss_v2',
  charHistory: 'gms_char_history',
  font:        'gms_font',
  genesis:     'lib_genesis_v2',
  destiny:     'lib_destiny_v1',
  hexaSkill:   'hx_skill',
  hexaMastery: 'hx_mastery',
  hexaBoost:   'hx_boost',
  hexaCommon:  'hx_common',
};

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
