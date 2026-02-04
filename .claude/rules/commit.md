# Writing Git Commits

## DOs

- Use Conventional Commits format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Start with a short, imperative summary (max 50 chars)
- Include a bullet point list in the body describing each change
- End with a summary of the impact
- Look into the commit history for good examples of commit messages and reuse patterns when applicable
- Use scopes to indicate the area of the codebase affected, e.g. `feat(orders)`

## DON'Ts
- Don't use vague messages like "Update code" or "Fix bug"
- Do not add a Co-Authored-By line
- **NEVER use --no-verify** - Pre-commit hooks exist to prevent broken code from being committed. If hooks fail, fix the issue instead of bypassing them.

## Conventional Commit Scopes

- Look into the commit history for existing scopes and reuse them when applicable
- If the change affects multiple areas, choose the most relevant scope, a general scope like `core` or `services` is acceptable, but avoid creating new scopes unnecessarily
