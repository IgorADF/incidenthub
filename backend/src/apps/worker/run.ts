import { ServiceType } from "@domain/entities/service";
import { prismaClient } from "@infra/db/prisma-client";
import axios, { isAxiosError } from "axios";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null });

type HealthcheckJobData = ServiceType;

const worker = new Worker<HealthcheckJobData>(
  "healthchecks",
  async (job: Job<HealthcheckJobData>) => {
    const service = job.data;
    const start = Date.now();

    if (!service.enabled) {
      // pular e desabilitar
    }

    try {
      const res = await axios.get(service.url, {
        validateStatus: (status) => status == service.expectedResponseStatus,
        timeout: service.timeoutSeconds * 1000,
        transitional: {
          clarifyTimeoutError: true,
        },
      });

      const requestTime = Date.now() - start;

      await prismaClient.healthCheck.create({
        data: {
          id: "",
          serviceId: service.id,
          url: service.url,
          requestTime,
          isError: false,
          timedOut: false,
          responseStatus: res.status,
          responseJsonData: res.data,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const timedOut =
          err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
        const requestTime = Date.now() - start;

        await prismaClient.healthCheck.create({
          data: {
            id: "",
            serviceId: service.id,
            url: service.url,
            requestTime,
            isError: true,
            timedOut,
            responseStatus: err.response?.status ?? 999,
            responseJsonData: err.response?.data,
            createdAt: new Date(),
          },
        });

        console.error("Axios error:", err.message);
        return;
      } else {
        // pensar no que fazer aqui
      }
    }
  },
  {
    connection,
    concurrency: 50, // 50 chamadas HTTP simultâneas por worker
  },
);
