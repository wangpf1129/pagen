/** biome-ignore-all lint/style/noNonNullAssertion: k */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const config = z
	.object({
		CLOUDFLARE_D1_TOKEN: z.string(),
		CLOUDFLARE_DATABASE_ID: z.string(),
		CLOUDFLARE_ACCOUNT_ID: z.string(),
	})
	.parse(process.env);

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: config.CLOUDFLARE_ACCOUNT_ID,
		databaseId: config.CLOUDFLARE_DATABASE_ID,
		token: config.CLOUDFLARE_D1_TOKEN,
	},
});
