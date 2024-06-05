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
    const upcs = message.content.match(/\b\d{10,12}\b/g);
    console.log('Extracted UPCs:', upcs);

    if (upcs && upcs.length > 0) {
      try {
        let productInfo = 'Products Information:\n';

        // Process each UPC individually
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
            `API Response for UPC ${upc}:` /* JSON.stringify(products, null, 2) */,
          ); // Log API response for debugging

          if (products.length > 0) {
            // Add UPC header
            productInfo += `\nUPC: ${upc}\n`;

            // Add product details
            productInfo += products
              .map((product) => {
                const cost = product.attributes.list_price?.[0]?.value ?? 'N/A';
                return `ASIN: ${product.asin}, Cost: ${cost}`;
              })
              .join('\n');

            // Add a newline after the last ASIN for each UPC
            productInfo += '\n';
          } else {
            productInfo += `\nUPC: ${upc}\nNo products found for the provided UPC.\n`;
          }
        }

        // Split the message into chunks of 2000 characters
        const messages = productInfo.match(/[\s\S]{1,2000}/g) || [];

        for (const msg of messages) {
          await message.channel.send(msg);
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
