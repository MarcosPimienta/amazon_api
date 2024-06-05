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

    // Extract UPCs from the message
    const upcs = message.content.match(/\b\d{12}\b/g); // Assuming UPCs are 12-digit numbers
    console.log('Extracted UPCs:', upcs);

    if (upcs && upcs.length > 0) {
      try {
        let productInfo = 'Products Information:\n';

        // Process each UPC individually
        for (const upc of upcs) {
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
            JSON.stringify(products, null, 2),
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
          } else {
            productInfo += `\nUPC: ${upc}\nNo products found for the provided UPC.\n`;
          }
        }

        // Send the formatted product information to the Discord chat
        message.channel.send(productInfo);
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
