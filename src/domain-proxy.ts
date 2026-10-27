export type DomainProxyOptions = {
  endpoint: string;
  token: string;
  /** Obtain this from your trusted hosting platform, never an unchecked request header. */
  clientIp: string;
  country?: string;
  fetch?: typeof fetch;
};
const associationPaths = new Set([
  '/.well-known/apple-app-site-association',
  '/.well-known/assetlinks.json',
]);
const requestHeaders = ['user-agent', 'accept', 'accept-language', 'referer', 'dnt', 'sec-gpc'];
const responseHeaders = [
  'location',
  'content-type',
  'cache-control',
  'content-security-policy',
  'referrer-policy',
  'x-robots-tag',
  'retry-after',
  'vary',
];

/** Forward only public links/association files from a website's server using its domain credential. */
export async function forwardLinkRunway(
  request: Request,
  options: DomainProxyOptions,
): Promise<Response> {
  if (
    typeof window !== 'undefined' ||
    typeof document !== 'undefined' ||
    'WorkerGlobalScope' in globalThis
  )
    throw new Error('Domain forwarding credentials belong on your website server');
  const endpoint = new URL(options.endpoint);
  if (
    (endpoint.protocol !== 'https:' &&
      !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== '/'
  )
    throw new Error('Use an HTTPS API origin without a path, credentials, query or fragment');
  if (!/^lr_dp_[A-Za-z0-9_-]{43}$/.test(options.token))
    throw new Error('Use a domain forwarding credential');
  if (
    !options.clientIp ||
    options.clientIp.length > 45 ||
    !/^[0-9a-fA-F:.]+$/.test(options.clientIp)
  )
    throw new Error('Provide one client IP from your trusted website ingress');
  const original = new URL(request.url);
  if (
    !['GET', 'HEAD'].includes(request.method) ||
    (!associationPaths.has(original.pathname) &&
      !/^\/(l|r)\/[A-Za-z0-9_-]{3,60}$/.test(original.pathname))
  )
    return new Response('This is not a LinkRunway forwarding route', { status: 404 });
  const headers = new Headers();
  for (const name of requestHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set('x-linkrunway-domain-token', options.token);
  headers.set('x-linkrunway-client-ip', options.clientIp);
  if (options.country && /^[A-Z]{2}$/.test(options.country))
    headers.set('x-linkrunway-client-country', options.country);
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 10000);
  request.signal.addEventListener('abort', abort, { once: true });
  if (request.signal.aborted) abort();
  try {
    const upstream = await (options.fetch ?? fetch)(
      `${endpoint.origin}${original.pathname}${original.search}`,
      {
        method: request.method,
        headers,
        redirect: 'manual',
        signal: controller.signal,
      },
    );
    const outgoing = new Headers({ 'X-Content-Type-Options': 'nosniff' });
    for (const name of responseHeaders) {
      const value = upstream.headers.get(name);
      if (value !== null) outgoing.set(name, value);
    }
    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      headers: outgoing,
    });
  } catch {
    return new Response('Link service temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}
