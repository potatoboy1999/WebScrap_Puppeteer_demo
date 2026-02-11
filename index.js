const config = require('./config');
const { launchBrowser, login, extractFromPage } = require('./scraper');
const { exportToCsv } = require('./csv-export');

async function main() {
  const visible = process.argv.includes('--visible');
  console.log(`Mode: ${visible ? 'visible browser' : 'headless'}`);

  let browser;
  try {
    browser = await launchBrowser(visible);
    const page = await browser.newPage();

    // Step 1: Login
    await login(page, config);

    // Step 2: Visit pages and extract data
    const allData = [];
    for (const pageConfig of config.pagesToVisit) {
      const rows = await extractFromPage(page, pageConfig);
      console.log(`  Extracted ${rows.length} row(s) from ${pageConfig.url}`);
      allData.push(...rows);
    }

    // Step 3: Export to CSV
    await exportToCsv(allData, config.outputFile);

    console.log('Done!');
  } catch (err) {
    console.error('Scraping failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
