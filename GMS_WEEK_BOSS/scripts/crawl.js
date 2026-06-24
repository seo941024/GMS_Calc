/* GMS_WEEK_BOSS/scripts/crawl.js
   GitHub Actions에서 실행되는 Puppeteer 크롤러
   GMS 랭킹 페이지 → Redis 저장
*/
const puppeteer = require('puppeteer');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const BASE = 'https://www.nexon.com/maplestory/rankings';
const REGIONS = ['north-america', 'europe'];
const TYPES = ['overall', 'job', 'legion'];
const WORLD_TYPES = ['both', 'heroic'];

const REGION_CODE = { 'north-america': 'na', 'europe': 'eu' };
const REBOOT_CODE = { 'heroic': 1, 'both': 0, 'interactive': 0 };

async function scrapePage(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // 실제 데이터 셀이 나올 때까지 최대 30초 대기
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('tbody tr').length > 0,
      { timeout: 30000 }
    );
  } catch {
    return [];
  }

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    const result = [];
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length < 3) return;
      const name = row.querySelector('b')?.textContent?.trim();
      const rankText = tds[0]?.textContent?.trim().replace(/,/g, '');
      const job = row.querySelector('b + div, b ~ div')?.textContent?.trim();
      const expText = tds[tds.length - 1]?.textContent?.trim().replace(/,/g, '');
      if (name && rankText && /^\d+$/.test(rankText)) {
        result.push({
          rank: parseInt(rankText, 10),
          name: name.toLowerCase(),
          job: job || '',
          exp: Number(expText) || 0,
        });
      }
    });
    return result;
  });

  return data;
}

async function crawlAllPages(browser, region, type, worldType) {
  const regionCode = REGION_CODE[region];
  const result = {};
  let pageNum = 1;
  const maxPages = 300;

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`크롤링 시작: ${region} / ${type} / ${worldType}`);

  while (pageNum <= maxPages) {
    const url = `${BASE}/${region}/${type}/weekly?world_type=${worldType}&page=${pageNum}`;
    try {
      const rows = await scrapePage(page, url);
      if (rows.length === 0) {
        console.log(`  ${pageNum}페이지 데이터 없음 → 종료`);
        break;
      }
      for (const row of rows) {
        if (!row.name) continue;
        result[row.name] = result[row.name] || {};
        if (type === 'overall') result[row.name].worldRank   = row.rank;
        if (type === 'job')     result[row.name].jobRankWorld = row.rank;
        if (type === 'legion')  result[row.name].legionRank  = row.rank;
        result[row.name].job    = row.job || result[row.name].job;
        result[row.name].reboot = REBOOT_CODE[worldType];
      }
      console.log(`  ${pageNum}페이지: ${rows.length}명`);
      pageNum++;
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  ${pageNum}페이지 오류:`, e.message);
      break;
    }
  }

  await page.close();
  return result;
}

function mergeData(base, patch) {
  for (const [k, v] of Object.entries(patch)) {
    base[k] = Object.assign(base[k] || {}, v);
  }
}

async function main() {
  console.log('=== GMS 랭킹 크롤러 시작 ===');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const naData = {};
    const euData = {};

    for (const type of TYPES) {
      for (const worldType of WORLD_TYPES) {
        const data = await crawlAllPages(browser, 'north-america', type, worldType);
        mergeData(naData, data);
      }
    }

    for (const type of TYPES) {
      for (const worldType of WORLD_TYPES) {
        const data = await crawlAllPages(browser, 'europe', type, worldType);
        mergeData(euData, data);
      }
    }

    console.log(`\n크롤링 완료: NA ${Object.keys(naData).length}명, EU ${Object.keys(euData).length}명`);

    if (Object.keys(naData).length === 0 && Object.keys(euData).length === 0) {
      console.error('데이터 없음 → Redis 저장 스킵');
      process.exit(1);
    }

    const ts = Date.now();
    const pipe = redis.pipeline();

    for (const [name, data] of Object.entries(naData)) {
      pipe.set(`rnk:na:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }
    for (const [name, data] of Object.entries(euData)) {
      pipe.set(`rnk:eu:${name}`, JSON.stringify({ ...data, ts }), { ex: 60 * 60 * 25 });
    }

    await pipe.exec();
    console.log('Redis 저장 완료!');

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });