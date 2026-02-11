const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function launchBrowser(visible, executablePath) {
  return puppeteer.launch({
    headless: visible ? false : 'shell',
    executablePath,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=en-US',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

async function login(page, config) {
  console.log(`Navigating to login page: ${config.loginUrl}`);
  await page.goto(config.loginUrl, { waitUntil: 'networkidle2' });

  const { usernameInput, passwordInput, submitButton } = config.loginSelectors;

  await page.waitForSelector(usernameInput);
  await page.type(usernameInput, config.credentials.username, { delay: 50 });
  await page.type(passwordInput, config.credentials.password, { delay: 50 });

  console.log('Submitting login form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click(submitButton),
  ]);

  console.log(`Logged in. Current URL: ${page.url()}`);
}

async function extractFromPage(page, pageConfig, debug) {
  console.log(`Navigating to: ${pageConfig.url}`);
  await page.goto(pageConfig.url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Dismiss cookie consent if present (IMDB uses this on first visit)
  try {
    const consentBtn = await page.$('[data-testid="accept-button"], .fc-cta-consent, button[aria-label="Accept"]');
    if (consentBtn) {
      console.log('  Dismissing cookie consent...');
      await consentBtn.click();
      await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
    }
  } catch {}

  try {
    await page.waitForSelector(pageConfig.waitFor, { timeout: 30000 });
  } catch (selectorErr) {
    if (debug) {
      const debugDir = path.join(path.dirname(process.execPath), 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const slug = pageConfig.url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
      await page.screenshot({ path: path.join(debugDir, `${slug}.png`), fullPage: true });
      const pageUrl = page.url();
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 2000) || '');
      console.error(`  DEBUG: Current URL: ${pageUrl}`);
      console.error(`  DEBUG: Page title: ${title}`);
      console.error(`  DEBUG: Body text (first 500 chars): ${bodyText.slice(0, 500)}`);
      console.error(`  DEBUG: Screenshot saved to debug/${slug}.png`);
    }
    throw selectorErr;
  }

  // Custom extraction function takes priority
  if (pageConfig.custom) {
    return pageConfig.custom(page);
  }

  const { rowSelector, dataSelectors } = pageConfig;

  if (rowSelector) {
    // Extract repeating rows
    return page.$$eval(rowSelector, (rows, selectors) => {
      return rows.map(row => {
        const record = {};
        for (const [key, selector] of Object.entries(selectors)) {
          if (selector.startsWith('attr:')) {
            // Format: "attr:attributeName:cssSelector"
            const parts = selector.split(':');
            const attr = parts[1];
            const sel = parts.slice(2).join(':');
            const el = row.querySelector(sel);
            record[key] = el ? el.getAttribute(attr) : '';
          } else {
            const el = row.querySelector(selector);
            record[key] = el ? el.textContent.trim() : '';
          }
        }
        return record;
      });
    }, dataSelectors);
  } else {
    // Extract single values from the page
    const record = {};
    for (const [key, selector] of Object.entries(dataSelectors)) {
      if (selector.startsWith('attr:')) {
        const parts = selector.split(':');
        const attr = parts[1];
        const sel = parts.slice(2).join(':');
        record[key] = await page.$eval(sel, (el, a) => el.getAttribute(a) || '', attr);
      } else {
        record[key] = await page.$eval(selector, el => el.textContent.trim());
      }
    }
    return [record];
  }
}

module.exports = { launchBrowser, login, extractFromPage };
