import axios, { isAxiosError } from "axios";
import {
  HttpPingerInterface,
  PingInput,
  PingResult,
} from "@domain/services/http-pinger.interface";

export class AxiosHttpPingerService implements HttpPingerInterface {
  async ping(input: PingInput): Promise<PingResult> {
    const start = Date.now();

    try {
      const res = await axios.get(input.url, {
        validateStatus: (status) => status === input.expectedResponseStatus,
        timeout: input.timeoutSeconds * 1000,
        transitional: {
          clarifyTimeoutError: true,
        },
      });

      const requestTimeMs = Date.now() - start;
      const responseBody =
        typeof res.data === "string"
          ? res.data
          : JSON.stringify(res.data ?? null);

      return {
        ok: true,
        responseStatus: res.status,
        timedOut: false,
        isError: false,
        responseBody,
        requestTimeMs,
      };
    } catch (err) {
      const requestTimeMs = Date.now() - start;

      if (isAxiosError(err)) {
        const timedOut =
          err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";

        const responseStatus = err.response?.status ?? 0;
        const rawData = err.response?.data;
        const responseBody =
          rawData == null
            ? null
            : typeof rawData === "string"
              ? rawData
              : JSON.stringify(rawData);

        return {
          ok: false,
          responseStatus,
          timedOut,
          isError: true,
          responseBody,
          requestTimeMs,
        };
      }

      return {
        ok: false,
        responseStatus: 0,
        timedOut: false,
        isError: true,
        responseBody: null,
        requestTimeMs,
      };
    }
  }
}
