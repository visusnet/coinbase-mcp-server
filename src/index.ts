#!/usr/bin/env node
import { CoinbaseMcpServer } from './server/CoinbaseMcpServer.js';
import { config } from 'dotenv';

config({ quiet: true }); // Load .env file

function main() {
  const apiKeyName = process.env.COINBASE_API_KEY_NAME;
  const privateKey = process.env.COINBASE_PRIVATE_KEY;

  if (!apiKeyName || !privateKey) {
    console.error(
      'Error: COINBASE_API_KEY_NAME and COINBASE_PRIVATE_KEY environment variables must be set',
    );
    process.exit(1);
  }

  const server = new CoinbaseMcpServer(apiKeyName, privateKey);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port);
}

main();
