# Contributing to NOTWEB

First of all, thank you for your interest in contributing to NOTWEB!

NOTWEB is an open-source project aiming to make website analysis, responsive optimization, AI-assisted reconstruction, and cross-platform application workflows accessible through one unified platform.

We welcome contributions that improve functionality, reliability, security, performance, accessibility, and documentation.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Security Issues](#security-issues)
- [Questions and Discussions](#questions-and-discussions)

## Code of Conduct

All contributors are expected to behave respectfully and constructively.

Harassment, discrimination, personal attacks, and intentionally disruptive behavior are not acceptable.

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the project's standards.

## Before You Start

Before beginning work:

1. Check existing issues and pull requests.
2. Search for duplicate bug reports or feature requests.
3. For major changes, open an issue to discuss the proposal first.
4. Confirm that the change fits the project's goals.
5. Avoid duplicating work that is already in progress.

For new features, explain the problem, proposed solution, expected benefits, and potential limitations.

## Development Setup

### Prerequisites

Install:

- Node.js 22 or another supported version
- pnpm 10 or another compatible version
- Git

Verify your environment:

```bash
node --version
pnpm --version
git --version
```

### Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/notweb.git
cd notweb
```

3. Add the original repository as the upstream remote:

```bash
git remote add upstream https://github.com/not-brajesh/notweb.git
```

4. Install dependencies:

```bash
pnpm install
```

Replace `YOUR_USERNAME` with your GitHub username.

### Create a Branch

Create a separate branch for each contribution:

```bash
git checkout -b feature/short-description
```

Suggested branch prefixes:

- `feature/` — New functionality
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code restructuring
- `test/` — Test improvements
- `chore/` — Maintenance tasks

## Project Structure

NOTWEB uses a pnpm workspace and Turborepo.

- `apps/studio/` — Main developer workspace
- `apps/extension/` — Browser extension
- `apps/api/` — Backend services
- `apps/desktop/` — Desktop application
- `packages/ui/` — Shared interface components
- `packages/shared/` — Shared types and utilities
- `packages/website-analyzer/` — Website analysis
- `packages/responsive-engine/` — Responsive layout tooling
- `packages/ai-engine/` — AI integrations and orchestration
- `packages/device-preview/` — Device preview utilities
- `packages/wrapper-engine/` — Application wrapper workflows
- `packages/pwa-generator/` — PWA generation
- `packages/app-packager/` — Application packaging

Some modules are still under development. Check the current code before relying on planned functionality.

## Contribution Workflow

Follow this process:

1. Understand the existing implementation.
2. Keep the change focused on one purpose.
3. Implement the change using the project's established patterns.
4. Add or update tests where appropriate.
5. Run the relevant quality checks.
6. Update documentation if behavior changes.
7. Commit your changes.
8. Push your branch to your fork.
9. Open a pull request against the original repository.

Before pushing, review the changes:

```bash
git status
git diff
```

Stage only the files relevant to your contribution:

```bash
git add path/to/changed-file
git commit -m "feat: describe your change"
git push -u origin feature/short-description
```

Do not commit secrets, generated files that should remain untracked, or unrelated local changes.

## Coding Standards

### General Principles

- Prefer clear, maintainable, and readable code.
- Use TypeScript for new application and package code where practical.
- Avoid unnecessary dependencies.
- Keep modules focused on a single responsibility.
- Prefer explicit interfaces and predictable error handling.
- Document complex behavior and non-obvious decisions.
- Consider performance, accessibility, and security.
- Avoid breaking existing public interfaces without discussion.

### Formatting

Use the project's Prettier configuration.

Run:

```bash
pnpm format
```

To check formatting without rewriting files:

```bash
pnpm format:check
```

### Linting and Type Checking

When the relevant scripts and dependencies are configured, run:

```bash
pnpm lint
pnpm typecheck
```

Resolve relevant errors before submitting a pull request.

## Testing

New behavior should include appropriate tests whenever practical.

Depending on the affected module, this may include:

- Unit tests for individual functions
- Integration tests for connected components
- End-to-end tests for complete workflows
- Security tests for untrusted input handling
- Regression tests for previously reported bugs

Run the relevant tests using:

```bash
pnpm test
```

Do not claim that tests pass unless you have actually run them and verified the result.

If a test cannot be run, explain why in the pull request.

## Commit Messages

Use short, descriptive commit messages.

Recommended prefixes:

- `feat:` — Add functionality
- `fix:` — Correct a bug
- `docs:` — Update documentation
- `refactor:` — Restructure code
- `test:` — Add or update tests
- `chore:` — Maintenance
- `perf:` — Improve performance
- `security:` — Security-related improvements

Examples:

```text
feat: add responsive layout diagnostics
fix: handle invalid website URLs
docs: improve local setup instructions
test: cover website analyzer edge cases
```

## Pull Requests

Before opening a pull request:

- [ ] The purpose of the change is clear.
- [ ] The implementation follows project conventions.
- [ ] Relevant tests have been added or updated.
- [ ] Formatting and lint checks have been run where available.
- [ ] Documentation has been updated where necessary.
- [ ] No secrets or private data are included.
- [ ] The change does not contain unrelated modifications.

A pull request should include:

1. **Summary:** What changed?
2. **Motivation:** What problem does it solve?
3. **Implementation:** How does it work?
4. **Testing:** What checks were performed?
5. **Limitations:** What remains incomplete?
6. **Screenshots:** Include them when they help explain UI changes.

Keep pull requests focused and reasonably sized.

Maintainers may request changes before merging.

## Security Issues

Please do not publish exploitable vulnerabilities, credentials, private data, or sensitive security details in public issues.

Follow [SECURITY.md](SECURITY.md) for security-reporting guidance.

## Questions and Discussions

For general questions, ideas, and proposed improvements, use the repository's GitHub Issues or other officially provided discussion channels.

Please provide enough context to reproduce bugs and understand feature requests.

## Thank You

Every thoughtful contribution helps NOTWEB become more useful, reliable, and accessible.

We appreciate your time and effort in building an open-source platform for the future of web development.