# Keep referral links on an existing Next.js website

These are drop-in App Router handlers for a **Node.js application hosted on Vercel**. They forward `/r/:key` and the two app association files to LinkRunway while the website continues serving its other routes. The website keeps its own homepage and static routes.

1. Install `@linkrunway/sdk` using the current JavaScript installation command in the repository README. Use JavaScript SDK 0.3.0 or later for the root handler. The prefixed handler also works on 0.2.0.
2. Register the website hostname in LinkRunway, choose `/r`, publish its ownership TXT record, and verify it. Keep the website's existing A/CNAME records with its web host.
3. Open **Settings → Domains → Website forwarding**, create a credential, and save it in the website's server environment as `LINKRUNWAY_DOMAIN_TOKEN`. Set `LINKRUNWAY_API_ORIGIN=https://api.linkrunway.com`. Neither variable should have a `NEXT_PUBLIC_` prefix.
4. For web tracking, copy `linkrunway.ts` and the `app/r/[key]` handler into your app root (or together into `src/`). For native app opening, also serve the association file for each supported platform and preserve any existing associations.
5. Deploy and test a real link, HEAD requests, social previews, an unknown key and existing website pages. Check each association file you enabled. Keep these paths outside authentication middleware, static rewrites and CDN caching. Never cache a redirect containing a click token.

The example accepts one validated address from Vercel's ingress. [Vercel documents its request-header behavior](https://vercel.com/docs/headers/request-headers). It fails closed outside Vercel or when configuration/address validation fails. If another CDN or proxy sits in front of Vercel, validate that topology before relying on the address. For another host, replace the address/country extraction with that host's trusted mechanism; never trust arbitrary public `X-Forwarded-For` values.

The helper preserves DNT/GPC and selected request/response headers, leaves redirects for the visitor to follow, and omits cookies and authorization. The credential grants only GET/HEAD access to the chosen path and association files on one verified domain. It cannot access accounts, workspace APIs or financial events. Use the server API key separately for backend link creation.

Rotation invalidates the previous credential immediately. Update and redeploy the website after rotation; allow for that interruption. Revocation disables forwarding immediately. Never put the platform's global proxy secret in a customer website.

For `/l` domains, move `app/r/[key]` to `app/l/[key]`; the relative import stays the same. Local handler tests can inject a trusted loopback request, but this Vercel example intentionally returns 503 from ordinary local `next dev` without a hosting adapter.

### Optional root URLs

For a domain configured with link path `/`, copy `root-link.ts` alongside `linkrunway.ts`. Set `LINKRUNWAY_ROOT_LINKS=true`. In your site's single-segment route, handle existing pages first and then call `forwardRootLink(request, siteFallback)` from GET and HEAD. Pass your normal missing-page handler as siteFallback. The adapter forwards generated codes and the route verification challenge. Add individual named links to the comma-separated `LINKRUNWAY_ROOT_NAMES` environment variable. Unregistered names return to the website's fallback.
