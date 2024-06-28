const puppeteer = require('puppeteer');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const artemisConfig = {
  'x-art-webtoken': '',
};

async function fetchArtemisToken() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);

    page.on('request', async (req) => {
      if (req.interceptResolutionState().action === 'already-handled') return;
      const url = req.url();
      console.log('trying to capture token');
      console.log(url);
      if (
        (url.includes('/DAU') ||
          url.includes('/FEES') ||
          url.includes('/PRICE') ||
          url.includes(
            '/MC,FEES,REVENUE,DEX_VOLUMES,WEEKLY_DEVS_CORE,DAILY_TXNS,DAU,TVL'
          )) &&
        req.method() == 'GET'
      ) {
        console.log('INSIDE a captive request');
        const headers = req.headers();
        console.log('old config', artemisConfig);
        artemisConfig['x-art-webtoken'] = headers['x-art-webtoken'];
        console.log('updated artemis token');
        console.log(artemisConfig);
      } else {
        req.continue();
      }
    });

    await page.goto('https://app.artemis.xyz/project/sei');
    await delay(2000);
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = { artemisConfig, fetchArtemisToken };
