export interface PingInput {
  url: string;
  timeoutSeconds: number;
  expectedResponseStatus: number;
}

export interface PingResult {
  ok: boolean;
  responseStatus: number;
  timedOut: boolean;
  isError: boolean;
  responseBody: string | null;
  requestTimeMs: number;
}

export interface HttpPingerInterface {
  ping: (input: PingInput) => Promise<PingResult>;
}
