# Contributing to Honest.js

First off — thank you. Honest is in early development (pre-v1.0), so the API is still evolving and we may not be able to
accept every idea. But your feedback, bug reports, and contributions genuinely shape the project.

---

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [New to open source?](#new-to-open-source)
- [Project structure](#project-structure)
- [Development setup](#development-setup)
- [Making changes](#making-changes)
- [Submitting a pull request](#submitting-a-pull-request)
- [Reporting security vulnerabilities](#reporting-security-vulnerabilities)
- [Related projects](#related-projects)

---

## Ways to contribute

- **Report a bug** — open an issue using the bug report template
- **Propose a feature** — start a [Discussion](https://github.com/honestjs/honest/discussions) before opening an issue
  for large ideas
- **Fix a bug or typo** — open a PR directly for small, well-scoped fixes
- **Improve docs** — clarity improvements are always welcome
- **Share** — write about Honest, post on X, or use it in your projects

---

## New to open source?

Look for issues labeled
[good first issue](https://github.com/honestjs/honest/issues?q=state%3Aopen%20label%3A%22good%20first%20issue%22). These
are intentionally small and well-scoped. Feel free to comment on an issue to claim it before starting work — this avoids
duplicate effort.

---

## Development setup

This project uses [Bun](https://bun.sh/) as its package manager.

```bash
# 1. Fork and clone the repo
git clone https://github.com/<your-username>/honest.git
cd honest

# 2. Install dependencies
bun install --frozen-lockfile

# 3. Run the test suite to verify your setup
bun run test
```

---

## Making changes

### Branch naming

Branch off `master` and use one of these prefixes:

```
feat/<short-description>     # new feature
fix/<short-description>      # bug fix
docs/<short-description>     # documentation only
chore/<short-description>    # tooling, CI, refactors
```

### Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). This is enforced by `commitlint` on every
commit.

```
feat: add support for async guards
fix: resolve decorator metadata loss on minification
docs: clarify pipe execution order
chore: upgrade typescript to 5.5
```

`husky` runs `lint-staged` on commit — ESLint and Prettier will auto-check staged files.

---

## Submitting a pull request

1. **Open an issue first** for anything beyond a small fix. PRs without prior discussion may be closed if they don't
   align with the project direction.

2. **Keep PRs focused.** One concern per PR. Mixed changes are harder to review and harder to revert.

3. **Before pushing:**

    ```bash
    bun run test          # all tests must pass
    bun run lint          # no lint errors
    bun run format:check  # formatting must be consistent

    # Auto-fix where possible:
    bun run lint:fix
    bun run format
    ```

4. **In your PR description:**
    - Reference the related issue (`Closes #123`)
    - Briefly describe what changed and why
    - Note anything that reviewers should pay special attention to

5. A maintainer will review your PR. We aim to respond within a few days. Please be patient — this is a small team.

---

## Reporting security vulnerabilities

**Do not open a public issue for security vulnerabilities.**

Please use [GitHub's private vulnerability reporting](https://github.com/honestjs/honest/security/advisories/new) or
email `security@honestjs.dev`.

---

## Code of conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to
uphold it. Please report unacceptable behavior to `conduct@honestjs.dev`.

---

## Related projects

You can also contribute to other packages in the Honest.js ecosystem:

| Package                                                                 | Description        |
| ----------------------------------------------------------------------- | ------------------ |
| [honestjs/website](https://github.com/honestjs/website)                 | Documentation site |
| [honestjs/examples](https://github.com/honestjs/examples)               | Example apps       |
| [honestjs/templates](https://github.com/honestjs/templates)             | Project templates  |
| [honestjs/middleware](https://github.com/honestjs/middleware)           | Middleware         |
| [honestjs/guards](https://github.com/honestjs/guards)                   | Guard primitives   |
| [honestjs/pipes](https://github.com/honestjs/pipes)                     | Pipe primitives    |
| [honestjs/filters](https://github.com/honestjs/filters)                 | Exception filters  |
| [honestjs/http-essentials](https://github.com/honestjs/http-essentials) | HTTP utilities     |
