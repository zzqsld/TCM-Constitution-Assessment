# Security Policy

## Scope
Static front-end only—no server, no data persistence. Risks are primarily:
- DOM XSS via unsanitized dynamic content
- Tampering with classification logic

## Current Mitigations
- `escapeHtml` used for user-provided name fields in report.
- No storage of sensitive personal data.
- No external third-party scripts.

## Reporting a Vulnerability
Open an Issue with prefix `[SECURITY]` and DO NOT include exploit PoC that risks user harm. Provide:
1. Affected file/function
2. Reproduction steps
3. Potential impact
4. Suggested remediation (if any)

For high-impact findings you may temporarily obfuscate details until patch is prepared.

## Out of Scope
- Browser-specific extensions
- Network-level MITM (use HTTPS when hosting)
- Third-party hosting misconfiguration

## Preferred Fix Approach
- Minimal patch
- Add regression scenario to PR description

Thank you for helping keep the project safe.