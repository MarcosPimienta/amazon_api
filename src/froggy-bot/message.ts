import { Client, Events, Message } from 'discord.js';
import axios from 'axios';
import { getWalmartProducts } from '../webscrapper/scrapper';

interface Product {
  asin: string;
  attributes: {
    list_price?: { value: number }[];
  };
  identifiers: { identifier: string; identifierType: string }[];
}

export function setupMessageHandler(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return; // Ignore messages from bots

    const content = message.content.trim();
    if (content.startsWith('!walmart ')) {
      const query = content.replace('!walmart ', '');
      try {
        const walmartProducts = await getWalmartProducts(query);
        if (walmartProducts.length === 0) {
          await message.channel.send('No products found on Walmart.');
          return;
        }

        const upcs = walmartProducts.map((product) =>
          product.upc.replace('-', ''),
        );

        for (const upc of upcs) {
          const response = await axios.post(
            'http://localhost:3000/catalog/fetch-products-by-upcs',
            { upcs: [upc] },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          const products = response.data as Product[];
          let productInfo = `**Products Information for UPC: ${upc}**\n`;

          if (products.length > 0) {
            products.forEach((product) => {
              const cost = product.attributes.list_price?.[0]?.value ?? 'N/A';
              productInfo += `**ASIN**: ${product.asin}, **Cost**: ${cost}\n`;
            });
          } else {
            productInfo += '*No products found for the provided UPC.*\n';
          }

          await message.channel.send(productInfo);
        }
      } catch (error) {
        console.error('Error fetching product information:', error);
        message.channel.send(
          'There was an error fetching the product information. Please try again later.',
        );
      }
    }
  });
}
