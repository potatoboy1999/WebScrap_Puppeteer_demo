const puppeteer = require('puppeteer');

async function launchBrowser(visible) {
  return puppeteer.launch({
    headless: !visible,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=en-US',
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

async function extractFromPage(page, pageConfig) {
  console.log(`Navigating to: ${pageConfig.url}`);
  await page.goto(pageConfig.url, { waitUntil: 'networkidle2' });
  await page.waitForSelector(pageConfig.waitFor);

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
