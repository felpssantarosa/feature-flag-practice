import { assert } from "std/assert/assert.ts";
import { assertEquals } from "std/assert/assert_equals.ts";
import { Database } from "@db/sqlite";
import { runMigrations } from "../src/infra/sqlite/migrations.ts";
import { FeatureFlagsRepository } from "../src/infra/sqlite/feature-flags-repository.ts";
import { FlagService } from "../src/services/flag.ts";
import { RuleService } from "../src/services/rule.ts";
import { SimpleCache } from "../src/services/cache.ts";

Deno.test("Repository save/find with environment and metadata", async () => {
	const database = new Database(":memory:");
	runMigrations(database);

	const flagRepository = new FeatureFlagsRepository(database);
	const ruleService = new RuleService();
	const cache = new SimpleCache<{ enabled: boolean; reason: string }>(5000);
	const flagService = new FlagService(flagRepository, ruleService, cache);

	const flag = await flagService.createFlag({
		name: "repo-test",
		ruleDefinitions: [],
		environment: "test",
		enabled: true,
		description: "testing",
	});

	const flagFound = await flagService.findFlagByName("repo-test", "test");

	assert(flagFound);
	assertEquals(flagFound?.getId(), flag.getId());
	assertEquals(flagFound?.getEnvironment(), "test");

	await flagService.recordEvaluation(
		flag.getId(),
		"test",
		{ userId: "u1" },
		{ enabled: true, reason: "none" },
	);

	const evals = await flagService.getEvaluations(flag.getId());
	assert(evals.length >= 1);
	assertEquals(evals[0].flag_id, flag.getId());
});
