import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AccountsService } from '../services';
import * as z from 'zod';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for account-related MCP tools.
 */
export class AccountToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly accounts: AccountsService,
  ) {
    super(server);
  }

  public register(): void {
    this.server.registerTool(
      'list_accounts',
      {
        title: 'List Accounts',
        description: 'Get a list of all accounts with their balances',
        inputSchema: {},
      },
      this.call(this.accounts.listAccounts.bind(this.accounts)),
    );

    this.server.registerTool(
      'get_account',
      {
        title: 'Get Account',
        description: 'Get details of a specific account by UUID',
        inputSchema: {
          accountUuid: z
            .string()
            .describe('The UUID of the account to retrieve'),
        },
      },
      this.call(this.accounts.getAccount.bind(this.accounts)),
    );
  }
}
