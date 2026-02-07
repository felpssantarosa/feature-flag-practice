import { assertEquals } from "std/assert/assert_equals.ts";
import fastify from "fastify";
import { Database } from "@db/sqlite";
import { runMigrations } from "../src/infra/sqlite/migrations.ts";
import { FeatureFlagsRepository } from "../src/infra/sqlite/feature-flags-repository.ts";
import { RuleService } from "../src/services/rule.ts";
import { FlagService } from "../src/services/flag.ts";
import { SimpleCache } from "../src/services/cache.ts";
import { FlagController } from "../src/http/controller/flag.ts";

Deno.test("API create and evaluate flow", async () => {
	const database = new Database(":memory:");
	runMigrations(database);

	const app = fastify();

	const featureFlagRepository = new FeatureFlagsRepository(database);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(
		featureFlagRepository,
		ruleService,
		cache,
	);
	const controller = new FlagController(flagService, ruleService);
	controller.initializeRoutes(app);

	await app.ready();

	// Create flag
	const createResp = await app.inject({
		method: "PUT",
		url: "/environments/test/flags/my-flag",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({
			name: "my-flag",
			ruleDefinitions: [
				{ name: "p", type: "percentage", config: { percentage: 100 } },
			],
			enabled: true,
		}),
	});

	assertEquals(createResp.statusCode, 201);

	// Evaluate flag
	const evalResp = await app.inject({
		method: "POST",
		url: "/environments/test/evaluate",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({ flag: "my-flag", context: { userId: "u1" } }),
	});

	assertEquals(evalResp.statusCode, 200);
	const body = JSON.parse(evalResp.body);
	assertEquals(body.enabled, true);
	assertEquals(body.reason, "percentage");

	await app.close();
});
