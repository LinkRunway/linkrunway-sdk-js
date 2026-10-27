# Keep referral links on an existing Next.js website

These are drop-in App Router handlers for a **Node.js application hosted on Vercel**. They forward `/r/:key` and the two app association files to LinkRunway while the website continues serving its other routes. This is a reference example, not a deployed customer integration.

1. Install `@linkrunway/sdk` using the current JavaScript installation command in the repository README. This example requires the `forwardLinkRunway` export (JavaScript SDK 0.2.0 or later).
2. Register the website hostname in LinkRunway, choose `/r`, publish its ownership TXT record, and verify it. Keep the website's existing A/CNAME records with its web host.
3. Open **Settings → Domains → Website forwarding**, create a credential, and save it in the website's server environment as `LINKRUNWAY_DOMAIN_TOKEN`. Set `LINKRUNWAY_API_ORIGIN=https://api.linkrunway.com`. Neither variable should have a `NEXT_PUBLIC_` prefix.
4. Copy `linkrunway.ts` and the `app/` handlers into your app root (or together into `src/`). Merge with existing routes deliberately: these handlers own both association files, so configure all required app associations in LinkRunway before replacing existing files.
5. Deploy and test a real link, HEAD requests, social previews, both association files, an unknown key, and existing website pages. Keep these paths outside authentication middleware, static rewrites and CDN caching. Never cache a redirect containing a click token.

The example accepts one validated address from Vercel's ingress. [Vercel documents its request-header behavior](https://vercel.com/docs/headers/request-headers). It fails closed outside Vercel or when configuration/address validation fails. If another CDN or proxy sits in front of Vercel, validate that topology before relying on the address. For another host, replace the address/country extraction with that host's trusted mechanism; never trust arbitrary public `X-Forwarded-For` values.

The helper preserves DNT/GPC and selected request/response headers, leaves redirects for the visitor to follow, and omits cookies and authorization. The credential grants only GET/HEAD access to the chosen path and association files on one verified domain. It cannot access accounts, workspace APIs or financial events. Use the server API key separately for backend link creation.

Rotation invalidates the previous credential immediately. Update and redeploy the website after rotation; allow for that interruption. Revocation disables forwarding immediately. Never put the platform's global proxy secret in a customer website.

For `/l` domains, move `app/r/[key]` to `app/l/[key]`; the relative import stays the same. Local handler tests can inject a trusted loopback request, but this Vercel example intentionally returns 503 from ordinary local `next dev` without a hosting adapter.
