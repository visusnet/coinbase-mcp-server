# Implemented Coinbase MCP Tools

## Overview

This server now uses the official `@coinbase-sample/advanced-trade-sdk-ts` SDK directly, eliminating all custom domain/repository layers.

**Total Tools: 74**

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

## Technical Indicators (24)

- ✅ `calculate_rsi` - Calculate RSI (Relative Strength Index)
- ✅ `calculate_macd` - Calculate MACD (Moving Average Convergence Divergence)
- ✅ `calculate_sma` - Calculate SMA (Simple Moving Average)
- ✅ `calculate_ema` - Calculate EMA (Exponential Moving Average)
- ✅ `calculate_bollinger_bands` - Calculate Bollinger Bands
- ✅ `calculate_atr` - Calculate ATR (Average True Range)
- ✅ `calculate_stochastic` - Calculate Stochastic Oscillator
- ✅ `calculate_adx` - Calculate ADX (Average Directional Index)
- ✅ `calculate_obv` - Calculate OBV (On-Balance Volume)
- ✅ `calculate_vwap` - Calculate VWAP (Volume Weighted Average Price)
- ✅ `calculate_cci` - Calculate CCI (Commodity Channel Index)
- ✅ `calculate_williams_r` - Calculate Williams %R
- ✅ `calculate_roc` - Calculate ROC (Rate of Change)
- ✅ `calculate_mfi` - Calculate MFI (Money Flow Index)
- ✅ `calculate_psar` - Calculate Parabolic SAR
- ✅ `calculate_ichimoku_cloud` - Calculate Ichimoku Cloud
- ✅ `calculate_keltner_channels` - Calculate Keltner Channels
- ✅ `calculate_fibonacci_retracement` - Calculate Fibonacci Retracement levels
- ✅ `detect_candlestick_patterns` - Detect candlestick patterns (31 patterns)
- ✅ `calculate_volume_profile` - Calculate Volume Profile with POC and Value Area
- ✅ `calculate_pivot_points` - Calculate Pivot Points (Standard, Fibonacci, Woodie, Camarilla, DeMark)
- ✅ `detect_rsi_divergence` - Detect RSI Divergence (bullish, bearish, hidden)
- ✅ `detect_chart_patterns` - Detect chart patterns (Double Top/Bottom, Head & Shoulders, Triangles, Flags)
- ✅ `detect_swing_points` - Detect swing highs/lows using Williams Fractal (5-bar pattern)

## Analysis Tools (2)

- ✅ `analyze_technical_indicators` - Calculate multiple indicators server-side, reducing context usage by ~90-95%. Fetches candles and returns computed values, aggregated signals, price summary, and risk metrics. The response includes an optional `risk` field containing: `volatilityDaily` (daily standard deviation of log returns), `volatilityAnnualized` (annualized volatility), `var95` (Value at Risk at 95% confidence - expected max daily loss %), `maxDrawdown` (maximum peak-to-trough decline as percentage), `sharpeRatio` (risk-adjusted return metric, null if zero volatility), and `riskLevel` (one of: low, moderate, high, extreme)
- ✅ `analyze_technical_indicators_batch` - Analyze multiple products in parallel. Returns results for each product with a summary ranking by signal score

## Market Events (1)

- ✅ `wait_for_market_event` - Wait for specific market conditions via real-time WebSocket. Monitors ticker data and triggers when conditions are met or timeout reached. Supports operators: gt, gte, lt, lte, crossAbove, crossBelow. Fields: price, volume24h, percentChange24h, high24h, low24h. Use instead of polling for efficient event-driven monitoring

## Market Intelligence (1)

- ✅ `get_news_sentiment` - Fetch recent news articles for a trading pair and analyze their sentiment. Returns headlines with individual sentiment scores (AFINN-165 with crypto-specific extensions) and an aggregate sentiment direction (bullish/bearish/neutral). Uses Yahoo Finance for news data
