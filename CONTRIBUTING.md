# Contributing to Honest.js

Contributions are welcome! Here are ways you can help.

## Ways to contribute

- **Create an issue** — Propose a new feature or report a bug.
- **Open a pull request** — Fix a bug or typo, refactor code, or improve docs.
- **Share** — Write about Honest on your blog, X, or elsewhere.
- **Build with Honest** — Use Honest in your projects and share feedback.

## Early development note

Honest is in early development (pre-v1.0). The API is not stable and may change.
We may not be able to accept every idea or feature request, but we value your
feedback and will do our best to keep the project open and responsive.

## Development setup

This project uses [Bun](https://bun.sh/) as its package manager. Install Bun,
then install dependencies:

```bash
bun install --frozen-lockfile
```

## Before submitting a PR

1. Ensure tests pass:

   ```bash
   bun run test
   ```

2. Run the linter and formatter:

   ```bash
   bun run lint
   bun run format:check
   ```

   Use `bun run lint:fix` and `bun run format` to auto-fix where possible. Husky
   runs lint-staged on commit (ESLint and Prettier on staged files).

## Related projects

You can also contribute to other packages in the Honest.js ecosystem:

- [honestjs/website](https://github.com/honestjs/website)
- [honestjs/examples](https://github.com/honestjs/examples)
- [honestjs/templates](https://github.com/honestjs/templates)
- [honestjs/middleware](https://github.com/honestjs/middleware)
- [honestjs/guards](https://github.com/honestjs/guards)
- [honestjs/pipes](https://github.com/honestjs/pipes)
- [honestjs/filters](https://github.com/honestjs/filters)
- [honestjs/http-essentials](https://github.com/honestjs/http-essentials)

Open issues or pull requests in those repositories as needed.
