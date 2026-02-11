const config = require('./config');
const { launchBrowser, login, extractFromPage } = require('./scraper');
const { exportToCsv } = require('./csv-export');
const { readMovieIds } = require('./xlsx-reader');

async function main() {
  const visible = process.argv.includes('--visible');
  console.log(`Mode: ${visible ? 'visible browser' : 'headless'}`);

  // Read movie IDs from the xlsx file
  const movieIds = readMovieIds(config.movieListFile);
  if (!movieIds.length) {
    console.log('No movie IDs found. Exiting.');
    return;
  }

  // Build page configs from the ID list
  const pagesToVisit = movieIds.map(id => ({
    url: config.urlTemplate.replace('{movieId}', id),
    waitFor: config.waitFor,
    custom: config.extractor,
  }));

  let browser;
  try {
    browser = await launchBrowser(visible);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Login (skip if configured)
    if (!config.skipLogin) {
      await login(page, config);
    } else {
      console.log('Skipping login (skipLogin is true)');
    }

    // Visit each movie page and extract data
    const allData = [];
    for (let i = 0; i < pagesToVisit.length; i++) {
      const pageConfig = pagesToVisit[i];
      console.log(`[${i + 1}/${pagesToVisit.length}] Scraping ${pageConfig.url}`);
      try {
        const rows = await extractFromPage(page, pageConfig);
        console.log(`  Extracted ${rows.length} row(s)`);
        allData.push(...rows);
      } catch (err) {
        console.error(`  Failed to scrape ${pageConfig.url}: ${err.message}`);
      }
    }

    // Export to CSV
    await exportToCsv(allData, config.outputFile);

    console.log(`Done! Scraped ${allData.length} movie(s).`);
  } catch (err) {
    console.error('Scraping failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
