import { Client, Events, Message } from 'discord.js';
import axios from 'axios';

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

    // Extract UPCs from the message (allowing 10-12 digit numbers)
    const upcs = message.content.match(/\b[\d-]{5,15}\b/g);
    console.log('Extracted UPCs:', upcs);

    if (upcs && upcs.length > 0) {
      try {
        for (let upc of upcs) {
          // Remove hyphens from UPC
          upc = upc.replace(/-/g, '');

          // Call the NestJS API to retrieve product information
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
          console.log(
            `API Response for UPC ${upc}:`,
            //JSON.stringify(products, null, 2),
          ); // Log API response for debugging

          let productInfo = `**UPC: ${upc}**\n`;

          if (products.length > 0) {
            // Add product details
            productInfo += products
              .map((product) => {
                const cost = product.attributes.list_price?.[0]?.value ?? 'N/A';
                return `**ASIN**: ${product.asin}, **Cost**: ${cost}`;
              })
              .join('\n');
          } else {
            productInfo += `No products found for the provided UPC.`;
          }

          // Send the message
          await message.channel.send(productInfo);
        }
      } catch (error) {
        console.error('Error fetching product information:', error);
        message.channel.send(
          'There was an error fetching the product information. Please try again later.',
        );
      }
    } else {
      message.channel.send('No valid UPCs found in your message.');
    }
  });
}
