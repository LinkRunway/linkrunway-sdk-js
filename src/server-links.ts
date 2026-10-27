import { call, type Transport } from './transport';

export type ServerLinkInput = {
  key: string;
  title: string;
  url: string;
  domainId?: string | null;
  iosUrl?: string | null;
  androidUrl?: string | null;
  appPath?: string | null;
  partnerId?: string | null;
  campaign?: string | null;
  source?: string | null;
  medium?: string | null;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | null>;
  expiresAt?: string | null;
};
export type ServerLink = ServerLinkInput & {
  id: string;
  workspaceId: string;
  shortUrl: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};
export type ServerLinkUpdate = Partial<ServerLinkInput> & { archived?: boolean };

/** Backend link management. Never ship this client or its server key in a mobile app or website. */
export class LinkRunwayServer {
  private readonly transport: Transport;
  constructor(options: {
    endpoint: string;
    apiKey: string;
    fetch?: typeof fetch;
    retries?: number;
  }) {
    if (
      typeof window !== 'undefined' ||
      typeof document !== 'undefined' ||
      'WorkerGlobalScope' in globalThis
    )
      throw new Error('Server secrets must never be used in a browser');
    if (!options.apiKey.startsWith('lr_sk_'))
      throw new Error('Link management requires a server key');
    const url = new URL(options.endpoint);
    if (
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error('Use an HTTPS API endpoint without credentials or query parameters');
    this.transport = {
      ...options,
      fetch: options.fetch ?? fetch,
      retries: Math.max(0, Math.min(5, options.retries ?? 2)),
    };
  }
  /** Retry with the same key and identical content. Conflicting reuse returns HTTP 409. */
  async createLink(input: ServerLinkInput): Promise<ServerLink & { duplicate: boolean }> {
    return (
      await call<ServerLink & { duplicate: boolean }>(this.transport, 'POST', 'server/links', input)
    ).data;
  }
  async getLink(id: string): Promise<ServerLink> {
    return (await call<ServerLink>(this.transport, 'GET', `server/links/${encodeURIComponent(id)}`))
      .data;
  }
  async listLinks(query: { page?: number; limit?: number; search?: string } = {}) {
    const params = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    );
    return (
      await call<{ items: ServerLink[]; total: number; page: number; limit: number }>(
        this.transport,
        'GET',
        `server/links?${params}`,
      )
    ).data;
  }
  async updateLink(id: string, input: ServerLinkUpdate): Promise<ServerLink> {
    return (
      await call<ServerLink>(
        this.transport,
        'PATCH',
        `server/links/${encodeURIComponent(id)}`,
        input,
      )
    ).data;
  }
}
