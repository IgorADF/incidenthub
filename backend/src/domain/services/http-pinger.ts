import type {
	HttpPingerInterface,
	PingInput,
	PingResult,
} from "./http-pinger.interface";

export type HttpPingerTestResponse =
	| {
			ok: true;
			responseStatus: number;
			responseBody?: string;
			requestTimeMs?: number;
	  }
	| {
			ok: false;
			responseStatus: number;
			timedOut: boolean;
			responseBody?: string;
			requestTimeMs?: number;
	  };

export class HttpPingerTestService implements HttpPingerInterface {
	private responseByPattern: Map<RegExp, HttpPingerTestResponse> = new Map();
	private defaultResponse: HttpPingerTestResponse;
	public calls: PingInput[] = [];

	constructor(
		defaultResponse: HttpPingerTestResponse = {
			ok: true,
			responseStatus: 200,
			responseBody: "{}",
			requestTimeMs: 50,
		},
	) {
		this.defaultResponse = defaultResponse;
	}

	whenUrlMatches(pattern: RegExp, response: HttpPingerTestResponse): this {
		this.responseByPattern.set(pattern, response);
		return this;
	}

	async ping(input: PingInput): Promise<PingResult> {
		this.calls.push(input);

		let matched = this.defaultResponse;
		for (const [pattern, response] of this.responseByPattern) {
			if (pattern.test(input.url)) {
				matched = response;
				break;
			}
		}

		const isError = !matched.ok;

		return {
			ok: matched.ok,
			responseStatus: matched.responseStatus,
			timedOut: matched.ok ? false : matched.timedOut,
			isError,
			responseBody: matched.responseBody ?? null,
			requestTimeMs: matched.requestTimeMs ?? 50,
		};
	}
}
