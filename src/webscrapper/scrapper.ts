// src/webscrapper/scrapper.ts
import puppeteer from 'puppeteer-core';

export interface WalmartProduct {
  title: string;
  price: string;
  link: string;
  upc: string;
}

async function getWalmartProducts(query: string): Promise<WalmartProduct[]> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const url = `https://www.walmart.com/search/?query=${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: 'networkidle2' });

  const products = await page.evaluate(() => {
    const items: WalmartProduct[] = [];
    document
      .querySelectorAll('.search-result-gridview-item-wrapper')
      .forEach((item) => {
        const title =
          item.querySelector('.product-title-link span')?.textContent || 'N/A';
        const price =
          item.querySelector('.price-main .price-characteristic')
            ?.textContent || 'N/A';
        const link =
          item.querySelector('.product-title-link')?.getAttribute('href') ||
          'N/A';
        const upc = item.querySelector('.product-code')?.textContent || 'N/A'; // Assumes there's a way to find the UPC on the search result page
        items.push({ title, price, link, upc });
      });
    return items;
  });

  await browser.close();
  return products;
}

export { getWalmartProducts };
