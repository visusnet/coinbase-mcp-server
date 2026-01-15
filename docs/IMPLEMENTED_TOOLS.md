# Implemented Coinbase MCP Tools

## Overview

This server now uses the official `@coinbase-sample/advanced-trade-sdk-ts` SDK directly, eliminating all custom domain/repository layers.

**Total Tools: 46**

## Accounts (2)

- ✅ `list_accounts` - Get all accounts and their balances
- ✅ `get_account` - Get details of a specific account

## Orders (9)

- ✅ `list_orders` - List all orders with optional filters
- ✅ `get_order` - Get details of a specific order
- ✅ `create_order` - Create a new buy or sell order
- ✅ `preview_order` - Preview order creation before committing
- ✅ `cancel_orders` - Cancel one or more orders
- ✅ `list_fills` - Get executed trades for orders
- ✅ `edit_order` - Edit an existing order (price/size)
- ✅ `preview_edit_order` - Preview order edit before committing
- ✅ `close_position` - Close an open position

## Products (8)

- ✅ `list_products` - List all tradable products
- ✅ `get_product` - Get details of a specific product
- ✅ `get_product_book` - Get the order book for a product
- ✅ `get_product_candles` - Get historic price data (candlesticks)
- ✅ `get_product_candles_batch` - Get historic price data for multiple products in one call
- ✅ `get_market_trades` - Get recent trades for a product
- ✅ `get_best_bid_ask` - Get best bid/ask prices for products
- ✅ `get_market_snapshot` - Get comprehensive market data for multiple products in one call

## Public Data (6 - No Auth Required)

- ✅ `get_server_time` - Get current Coinbase server time
- ✅ `list_public_products` - List all public products
- ✅ `get_public_product` - Get public product details
- ✅ `get_public_product_book` - Get public order book
- ✅ `get_public_product_candles` - Get public candle data
- ✅ `get_public_market_trades` - Get public market trades

## Fees (1)

- ✅ `get_transaction_summary` - Get fee tier and transaction summary

## Portfolios (6)

- ✅ `list_portfolios` - List all portfolios
- ✅ `create_portfolio` - Create a new portfolio
- ✅ `get_portfolio` - Get portfolio details
- ✅ `edit_portfolio` - Edit portfolio name
- ✅ `delete_portfolio` - Delete a portfolio
- ✅ `move_portfolio_funds` - Move funds between portfolios

## Converts (3)

- ✅ `create_convert_quote` - Get a quote for currency conversion
- ✅ `commit_convert_trade` - Execute a currency conversion
- ✅ `get_convert_trade` - Get conversion trade details

## Payment Methods (2)

- ✅ `list_payment_methods` - List available payment methods
- ✅ `get_payment_method` - Get payment method details

## Futures (4)

- ✅ `list_futures_positions` - Get all futures positions
- ✅ `get_futures_position` - Get specific futures position
- ✅ `get_futures_balance_summary` - Get futures balance summary
- ✅ `list_futures_sweeps` - Get all futures sweeps

## Perpetuals (4)

- ✅ `list_perpetuals_positions` - Get all perpetuals positions
- ✅ `get_perpetuals_position` - Get specific perpetuals position
- ✅ `get_perpetuals_portfolio_summary` - Get perpetuals portfolio summary
- ✅ `get_perpetuals_portfolio_balance` - Get perpetuals portfolio balance

## Data API (1)

- ✅ `get_api_key_permissions` - Get current API key permissions
