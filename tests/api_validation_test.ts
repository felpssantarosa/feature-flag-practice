import { assertEquals } from "std/assert/assert_equals.ts";
import fastify from "fastify";
import { Database } from "@db/sqlite";
import { runMigrations } from "../src/infra/sqlite/migrations.ts";
import { FeatureFlagsRepository } from "../src/infra/sqlite/feature-flags-repository.ts";
import { RuleService } from "../src/services/rule.ts";
import { FlagService } from "../src/services/flag.ts";
import { SimpleCache } from "../src/services/cache.ts";
import { FlagController } from "../src/http/controller/flag.ts";

Deno.test("Evaluate missing flag field returns 400", async () => {
	const db = new Database(":memory:");
	runMigrations(db);

	const repo = new FeatureFlagsRepository(db);
	const ruleSvc = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagSvc = new FlagService(repo, ruleSvc, cache);
	const controller = new FlagController(flagSvc, ruleSvc);

	const app = fastify();
	controller.initializeRoutes(app);
	await app.ready();

	const response = await app.inject({
		method: "POST",
		url: "/environments/test/evaluate",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({}),
	});

	assertEquals(response.statusCode, 400);
	const body = JSON.parse(response.body);

	// Fastify validation error message may vary; assert it mentions the missing property
	if (typeof body.message === "string") {
		if (!body.message.includes("flag")) {
			throw new Error(`unexpected message: ${body.message}`);
		}
	} else {
		throw new Error("expected validation message to be present");
	}

	await app.close();
});

Deno.test("Evaluate non-existent flag returns 404", async () => {
	const database = new Database(":memory:");
	runMigrations(database);

	const featureFlagRepository = new FeatureFlagsRepository(database);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(
		featureFlagRepository,
		ruleService,
		cache,
	);
	const controller = new FlagController(flagService, ruleService);
	const app = fastify();
	controller.initializeRoutes(app);
	await app.ready();

	const response = await app.inject({
		method: "POST",
		url: "/environments/test/evaluate",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({ flag: "no-flag", context: {} }),
	});

	assertEquals(response.statusCode, 404);
	const body = JSON.parse(response.body);
	assertEquals(body.message, "feature flag not found");

	await app.close();
});

Deno.test("Bulk evaluate returns per-flag results and records evaluations", async () => {
	const db = new Database(":memory:");
	runMigrations(db);

	const featureFlagRepository = new FeatureFlagsRepository(db);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(
		featureFlagRepository,
		ruleService,
		cache,
	);
	const controller = new FlagController(flagService, ruleService);
	const app = fastify();
	controller.initializeRoutes(app);
	await app.ready();

	// create one flag
	await app.inject({
		method: "PUT",
		url: "/environments/test/flags/one",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({
			name: "one",
			ruleDefinitions: [
				{ name: "p", type: "percentage", config: { percentage: 100 } },
			],
			enabled: true,
		}),
	});

	const response = await app.inject({
		method: "POST",
		url: "/environments/test/evaluate/bulk",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({
			flags: ["one", "missing"],
			context: { userId: "u1" },
		}),
	});

	assertEquals(response.statusCode, 200);
	const body = JSON.parse(response.body);
	assertEquals(typeof body.one === "object", true);
	assertEquals(body.missing.reason, "not-found");

	// ensure evaluations persisted for 'one'
	const foundOne = await flagService.findFlagByName("one", "test");
	if (!foundOne) throw new Error("flag not found after create");
	const evs = await flagService.getEvaluations(foundOne.getId());
	if (evs.length === 0) throw new Error("expected evaluation to be recorded");

	await app.close();
});

Deno.test("Update flag changes enabled and description and rules", async () => {
	const database = new Database(":memory:");
	runMigrations(database);

	const featureFlagRepository = new FeatureFlagsRepository(database);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(
		featureFlagRepository,
		ruleService,
		cache,
	);
	const controller = new FlagController(flagService, ruleService);
	const app = fastify();
	controller.initializeRoutes(app);
	await app.ready();

	// create
	await app.inject({
		method: "PUT",
		url: "/environments/test/flags/up",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({
			name: "up",
			ruleDefinitions: [
				{ name: "p", type: "percentage", config: { percentage: 0 } },
			],
			enabled: true,
		}),
	});

	// update
	const updateResp = await app.inject({
		method: "PUT",
		url: "/environments/test/flags/up",
		headers: { "content-type": "application/json" },
		payload: JSON.stringify({
			ruleDefinitions: [
				{
					name: "t",
					type: "targeted",
					config: { attribute: "country", values: ["BR"] },
				},
			],
			enabled: false,
			description: "updated",
		}),
	});

	assertEquals(updateResp.statusCode, 200);

	// inspect DB rows after update
	const flagsRows = database
		.prepare("SELECT id, name, enabled, description FROM flags")
		.all();
	console.log("flags rows after update count", flagsRows.length);

	const getResp = await app.inject({
		method: "GET",
		url: "/flags/up?env=test",
	});
	assertEquals(getResp.statusCode, 200);
	const flag = JSON.parse(getResp.body);
	assertEquals(flag.enabled, false);
	assertEquals(flag.description, "updated");
	// ensure rule changed
	assertEquals(flag.rules.length, 1);
	assertEquals(flag.rules[0].type, "targeted");

	await app.close();
});

Deno.test("Invalid JSON in request returns 400", async () => {
	const database = new Database(":memory:");
	runMigrations(database);

	const featureFlagRepository = new FeatureFlagsRepository(database);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(
		featureFlagRepository,
		ruleService,
		cache,
	);
	const controller = new FlagController(flagService, ruleService);
	const app = fastify();
	controller.initializeRoutes(app);
	await app.ready();

	const response = await app.inject({
		method: "PUT",
		url: "/environments/test/flags/invalid",
		headers: { "content-type": "application/json" },
		payload: "not-json",
	});
	assertEquals(response.statusCode, 400);

	await app.close();
});
