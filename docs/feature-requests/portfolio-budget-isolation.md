# Portfolio Budget Isolation: The HODL Safe Concept

## Problem

The trading bot has access to the entire Default portfolio. The only constraint on the trading budget is a text instruction in the skill ("Sacred Rule"). A single miscalculation, edge case, or hallucination is enough for the bot to trade with assets that don't belong to it.

## Idea

A dedicated "HODL Safe" portfolio protects the user's main holdings from the trading bot. On cold start, the bot creates a separate portfolio and moves everything except the allocated trading budget into it. Since CDP API keys can only trade within their bound portfolio, the bot is restricted to the budget remaining in the Default portfolio — a hard limit at the API level, not just software logic. Replenishing the budget, securing profits, and dissolving the isolation all work through the existing portfolio management tools, which operate cross-portfolio. No code changes needed — only skill instructions.

## Why This Is Good

The core problem with the current approach is that budget enforcement exists purely in software. The skill defines a "Sacred Rule" that forbids the bot from trading beyond the budget. But this rule is just a text instruction — a hallucination, a calculation error, or an edge case in state management is enough for the bot to access assets it doesn't own. With portfolio isolation, this boundary shifts from a text instruction to API infrastructure: the assets are physically not in the API key's portfolio, so the bot simply cannot trade them. No bug, no prompt error, and no faulty calculation can circumvent this. It's the same difference as between "please don't touch" and a locked door.

Beyond that, the entire budget tracking simplifies considerably. Currently the bot must maintain the remaining budget in the state file every cycle — subtracting fees, adding profits, and validating the result against actual account balances. With portfolio isolation, the truth is trivial: whatever is in the Default portfolio is the budget. Nothing more, nothing less. The state file becomes a supplement rather than the single source of truth.

The risk of total loss due to a software error also drops drastically. If the bot places orders in an infinite loop or burns the entire budget in a single trade through an edge case, only the funds in the Default portfolio are affected. The main holdings in the HODL Safe remain untouched.

## Transfer Prohibition: No Autonomous Fund Movement

The skill must contain an explicit prohibition against transferring funds from the HODL Safe or other portfolios without direct user request. This is the critical complement to API-level isolation: the API prevents the bot from trading in the HODL Safe, but it does not prevent it from calling `move_portfolio_funds` to pull assets back into the Default portfolio. This management operation works cross-portfolio — intentionally so for budget replenishment and profit securing, but only on explicit user request.

Without this prohibition, the bot could autonomously decide to reload funds from the HODL Safe when the budget is exhausted. It could argue that a particularly strong signal justifies more capital, or that a position needs to be rescued. This must not happen. The separation between trading budget and main holdings is a deliberate user decision, not a recommendation that the bot may override situationally.

Specifically, the skill must enforce these rules:

- `move_portfolio_funds` with the HODL Safe as source may only be called after explicit user request ("replenish budget", "add 10 EUR from BTC", etc.)
- The bot must never autonomously suggest replenishing the budget and execute the transfer in the same step
- When the budget is exhausted, the bot reports "Budget exhausted" and waits for the user — it does not reload autonomously
- Dissolving the HODL Safe (moving all funds back to Default) requires an explicit user instruction
- Even in dry-run mode, no transfer may be simulated or prepared that would execute without user consent

This prohibition is the software-side complement to API-level trade isolation. Together they form two layers of protection: the API prevents unauthorized trading, the prohibition prevents unauthorized fund movement.

## What Can Be Removed From the Skill

The "Sacred Rule" in the skill — the long paragraph explaining that the budget is the only capital source and all other holdings are off limits — goes from a critical behavioral instruction to a secondary reminder. The API already enforces what the text previously only requested.

The Budget Consistency Validation in the state schema, which checks the calculated remaining budget against the stored value after every trade and warns on discrepancies, becomes largely redundant. The actual balance in the Default portfolio is the truth. Instead of an elaborate calculation involving initial budget plus realized PnL minus fees minus open positions, a single `list_accounts` call suffices.

The reconciliation logic during session resume, which currently uses budget-based ownership to determine which assets belong to the bot, also simplifies. In the Default portfolio, everything belongs to the bot — there are no foreign assets that could be accidentally touched.

## What Can Be Removed From the State File

The field `session.budget.remaining` loses its role as the primary budget source. It can still be maintained as a cache to avoid querying the API for every decision, but it is no longer the source of truth. Drift between state and reality is unproblematic because reality is trivially queryable.

The fields `session.budget.sourceAmount` and `session.budget.sourcePrice`, which record the original funding amount and conversion rate, remain useful for display but no longer control anything. Previously they define how much BTC the bot may sell at most. With portfolio isolation, the answer is simpler: as much BTC as is in the Default portfolio.

The entire budget exhaustion check in workflow step 9, which calculates whether enough budget remains for another trade, reduces to a balance query. If the Default portfolio doesn't have sufficient funds, the order preview fails — the API provides the feedback directly.

## How It Works

The reverse logic is the key: instead of moving the trading budget into a new portfolio where the API key cannot trade, the main holdings are moved out of the Default portfolio. The bot continues trading in the Default portfolio, but only the allocated budget remains there. Management operations like creating portfolios, moving funds, and fetching breakdowns work cross-portfolio — only `create_order` is bound to the key's portfolio.

On cold start, the bot identifies the Default portfolio via `list_portfolios`, creates a new portfolio as the safe, calculates the current price via `get_product` to convert the budget into crypto, and then moves everything except the budget amount into the safe via `move_portfolio_funds`. On warm start, it verifies that the safe still exists and the state file is consistent.

Replenishing the budget works in the other direction: the user says "add 10 EUR from BTC", the bot calculates the equivalent, checks whether enough exists in the safe, and moves the amount back to the Default portfolio. Securing profits works analogously: calculate the excess in the Default portfolio and move it to the safe. Dissolution means moving everything from the safe back to Default.

## Where "HODL" Comes From and Alternative Names

HODL is a typo that became a meme. In December 2013, during a Bitcoin crash, a user named GameKyuubi posted an emotional thread on the BitcoinTalk forum titled "I AM HODLING". He meant "HOLDING" but was drunk and missed the keys. The post went viral and HODL became synonymous with the strategy of holding cryptocurrencies long-term and not panic-selling. It has since been retroactively read as an acronym: Hold On for Dear Life.

In the context of this feature, "HODL Safe" describes the portfolio where long-term holdings are securely stored while the bot trades with a small budget. The name is concise and immediately understandable to anyone in the crypto world.

Alternative names worth considering: "Vault" would be more neutral and technical — Coinbase itself uses the term for secure storage. "Reserve" emphasizes the character as a reserve fund. "Cold Storage" is an analogy to hardware wallets stored offline, but doesn't fit perfectly since the portfolio is still online. "Safe" alone would be the shortest variant. "Treasury" sounds more professional, almost institutional. "Nest Egg" would be colloquial but too informal. Ultimately "HODL Safe" is the best choice because it communicates in a single phrase what the portfolio does and why: it holds the assets tight, no matter what the bot does.

## Priority

High. The current budget isolation via text instruction is the biggest weakness in the autonomous trading setup.
