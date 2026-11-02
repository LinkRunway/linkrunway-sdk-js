# Security policy

## Report a vulnerability privately

Email **support@linkrunway.com** with the subject **Security report**. Do not open a public issue or pull request for an undisclosed vulnerability.

Include the affected repository and release, a description of the impact, and the smallest safe reproduction you can provide. Redact credentials, session cookies, personal information, and customer data. Use accounts and systems you control; do not test against other customers or disrupt the hosted service.

If a credential has been exposed, revoke or rotate it immediately. Do not send the secret itself as evidence. If your report requires sensitive files, first ask for a suitable transfer method.

## Updates and disclosure

Reports against any version are welcome. Start by checking whether the issue exists in the latest published release. Fixes are normally delivered in a new release; there is no published long-term-support or backport schedule. A repository's default branch may contain changes that have not shipped.

The maintainers will assess the report and coordinate remediation and disclosure with the reporter. This policy does not promise a response deadline, bounty, certification, or service-level agreement.

## Integration boundaries

- Keep server keys (`lr_sk_…`), signing secrets, and provider credentials on trusted servers.
- Mobile apps and browsers use publishable keys (`lr_pk_…`); these do not authorize financial events or canonical customer identity.
- Request consent before enabling client tracking. Do not put customer data or secrets into URLs, logs, or public issue attachments.
- Validate the integration with your own domains, signing identities, devices, and provider accounts. SDK test coverage does not certify those external systems.
