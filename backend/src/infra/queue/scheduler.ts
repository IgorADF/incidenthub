import { healthcheckQueue } from "./client";

await healthcheckQueue.upsertJobScheduler(
  "hc-repeat-every-5s",
  {
    every: 5000,
  },
  {
    name: "every-job",
    data: { jobData: "data" },
    opts: {}, // Optional additional job options
  },
);
