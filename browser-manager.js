const path = require('path');
const fs = require('fs');
const { install, resolveBuildId, Browser, detectBrowserPlatform } = require('@puppeteer/browsers');

const CHROMIUM_DIR = path.join(path.dirname(process.execPath), 'chromium');

async function ensureChromium() {
  const platform = detectBrowserPlatform();
  const buildId = await resolveBuildId(Browser.CHROMIUM, platform, 'latest');
  const cacheDir = CHROMIUM_DIR;

  // Check if already downloaded by looking for the expected executable
  const installedPath = computeExecutablePath(cacheDir, platform, buildId);
  if (installedPath && fs.existsSync(installedPath)) {
    console.log('Chromium already downloaded, reusing cached version.');
    return installedPath;
  }

  console.log('Downloading Chromium (first run only, this may take a minute)...');
  const installedBrowser = await install({
    browser: Browser.CHROMIUM,
    buildId,
    cacheDir,
  });

  console.log('Chromium downloaded successfully.');
  return installedBrowser.executablePath;
}

function computeExecutablePath(cacheDir, platform, buildId) {
  try {
    const { computeExecutablePath: compute } = require('@puppeteer/browsers');
    return compute({
      browser: Browser.CHROMIUM,
      buildId,
      cacheDir,
    });
  } catch {
    return null;
  }
}

module.exports = { ensureChromium };
