# Security Policy

## Overview

Security is a core consideration in the development of NOTWEB.

NOTWEB aims to provide tools for website analysis, responsive optimization, AI-assisted development, Progressive Web App generation, and cross-platform application workflows.

As the project evolves, we will work to identify, document, and address security vulnerabilities responsibly.

## Supported Versions

NOTWEB is currently under active development.

| Version | Security Support |
| ------- | ---------------- |
| Development branch | Best-effort security fixes |
| Released versions | Support status will be documented with each release |

Security support may change as the project matures.

## Reporting a Vulnerability

**Please do not publicly disclose an unpatched security vulnerability.**

If you discover a potential security issue, report it privately through the repository's available GitHub security reporting feature, if enabled.

If private vulnerability reporting is unavailable, contact the project maintainers through an appropriate private channel.

Include the following information when possible:

- A clear description of the vulnerability.
- The affected component or file.
- Steps to reproduce the issue.
- The potential security impact.
- Relevant logs or screenshots, after removing secrets and personal information.
- A suggested mitigation, if you have one.

Do not include passwords, API keys, access tokens, personal information, or confidential website data in your report.

## Responsible Disclosure

Please give maintainers a reasonable opportunity to investigate and address a vulnerability before publicly disclosing technical details.

Do not exploit vulnerabilities to access data, disrupt services, or compromise systems belonging to other people.

Security research should be limited to systems you own or are explicitly authorized to test.

## Security Areas

The following areas require particular attention as NOTWEB develops.

### 1. Website Analysis

- Treat website content and downloaded resources as untrusted input.
- Validate URLs before requesting external resources.
- Protect against server-side request forgery (SSRF).
- Restrict access to localhost, private networks, and cloud metadata endpoints where applicable.
- Limit redirects, response sizes, request durations, and resource consumption.
- Avoid executing arbitrary website scripts during static analysis.

### 2. Browser Extension

- Request only the permissions required for a feature.
- Validate messages exchanged between extension components.
- Protect extension storage and sensitive user data.
- Avoid exposing credentials or private information to websites.
- Apply appropriate content security policies.

### 3. AI Integrations

- Treat website content and retrieved documents as untrusted input.
- Protect against prompt injection and unintended tool execution.
- Do not expose API keys in client-side bundles or public repositories.
- Require appropriate authorization before performing sensitive actions.
- Make external data transmission clear to users.

### 4. File Generation and Packaging

- Validate file paths and generated filenames.
- Prevent path traversal and unsafe archive extraction.
- Avoid embedding secrets in generated applications.
- Validate dependencies and generated configuration files.
- Do not execute generated code without an explicit, appropriate security boundary.

### 5. API and Authentication

- Validate incoming data on the server.
- Apply authentication and authorization where required.
- Use rate limits and request-size limits for exposed endpoints.
- Store secrets outside source control.
- Avoid returning sensitive internal error details to clients.

## Secret Management

Never commit the following to the repository:

- API keys and access tokens.
- Passwords and private keys.
- Production credentials.
- Private certificates.
- Sensitive personal information.
- Confidential customer or website data.

Use environment variables or an appropriate secret-management system for sensitive configuration.

Keep local environment files out of version control.

If a secret is accidentally committed, revoke or rotate it immediately. Removing it from the latest commit alone may not remove it from Git history.

## Dependency Security

Contributors should:

- Prefer reputable and maintained dependencies.
- Review dependency changes before merging.
- Avoid unnecessary packages.
- Investigate reported vulnerabilities.
- Keep dependencies reasonably up to date.
- Never ignore a security warning without understanding its implications.

## Security Updates

When a vulnerability is confirmed, maintainers will assess its severity, determine an appropriate fix, and communicate relevant information when it is safe to do so.

The response time depends on severity, reproducibility, and the availability of a reliable fix.

## Scope and Limitations

This policy describes the project's intended security practices. It does not guarantee that every component is secure or that all listed protections have already been implemented.

NOTWEB is under development. Security controls must be implemented, tested, and reviewed before the associated features are considered production-ready.

## Thank You

Responsible security research helps make NOTWEB safer for developers and users.

Thank you for reporting vulnerabilities responsibly.