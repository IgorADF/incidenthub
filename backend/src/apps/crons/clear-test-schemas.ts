import { createDefaultDbClient } from "@infra/db/prisma-client";
import cron from "node-cron";
import { CleanupTestSchemasHelper } from "../api/e2e/helpers/cleanup-test-schemas-class";

//At 12:00 every day
cron.schedule("0 12 * * *", async () => {
	const dbClient = await createDefaultDbClient();
	const cleanupHelper = new CleanupTestSchemasHelper(dbClient.prisma);
	await cleanupHelper.run();
});

console.log("Jobs started");
