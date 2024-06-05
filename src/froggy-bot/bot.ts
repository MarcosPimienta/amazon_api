import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { setupMessageHandler } from './message';

dotenv.config();

// Create a new client instance with necessary intents
const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export function startBot() {
  // When the client is ready, run this code (only once).
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // Set up the message handler
  setupMessageHandler(client);

  // Log in to Discord with your client's token
  client.login(process.env.DISCORD_TOKEN);
}
