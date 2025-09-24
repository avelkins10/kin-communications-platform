export interface QuickbaseClientOptions {
  realmHost: string;
  userToken: string;
}

export class QuickbaseClient {
  private baseUrl: string;
  private token: string;
  constructor(opts: QuickbaseClientOptions) {
    this.baseUrl = `https://${opts.realmHost}`;
    this.token = opts.userToken;
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "QB-Realm-Hostname": this.baseUrl.replace(/^https:\/\//, ""),
      Authorization: `QB-USER-TOKEN ${this.token}`
    } as const;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Quickbase GET ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Quickbase POST ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }
}


