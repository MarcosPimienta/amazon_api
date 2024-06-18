import { getWalmartProducts } from './scrapper';

async function testScraper() {
  try {
    const products = await getWalmartProducts('laptop');
    console.log('Scraped products:', products);
  } catch (error) {
    console.error('Error scraping products:', error);
  }
}

testScraper();
