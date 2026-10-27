import { isIP } from 'node:net';
import { forwardLinkRunway } from '@linkrunway/sdk';

/** Vercel-specific example: adapt client-address validation before using another host. */
export async function forward(request: Request) {
  const unavailable = () =>
    new Response('Website link routing is not configured', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  const endpoint = process.env.LINKRUNWAY_API_ORIGIN;
  const token = process.env.LINKRUNWAY_DOMAIN_TOKEN;
  // On Vercel, the ingress overwrites X-Forwarded-For. A generic public Node server does not.
  const clientIp = request.headers.get('x-forwarded-for');
  if (process.env.VERCEL !== '1' || !clientIp || !isIP(clientIp) || !endpoint || !token)
    return unavailable();
  try {
    return await forwardLinkRunway(request, {
      endpoint,
      token,
      clientIp,
      country: request.headers.get('x-vercel-ip-country') ?? undefined,
    });
  } catch {
    return unavailable();
  }
}
