import { assertEquals } from "std/assert/assert_equals.ts";
import { FeatureFlag } from "../src/domain/flag/flag.ts";
import { PercentageRule, TargetedRule } from "../src/domain/rule/rule.ts";

Deno.test("FeatureFlag.evaluate returns correct reason for percentage", () => {
	const percentageRule = new PercentageRule("rollout", {
		percentage: 100,
		totalBuckets: 10,
	});
	const flag = new FeatureFlag("test", [percentageRule], "test-env");
	const response = flag.evaluate({ userId: "u1" });
	assertEquals(response.enabled, true);
	assertEquals(response.reason, "percentage");
});

Deno.test("FeatureFlag.evaluate returns targeted reason when targeted matches first", () => {
	const targetedRule = new TargetedRule("t", {
		attribute: "country",
		values: ["BR"],
	});
	const percentageRule = new PercentageRule("p", {
		percentage: 100,
		totalBuckets: 10,
	});

	const flag = new FeatureFlag(
		"test2",
		[targetedRule, percentageRule],
		"test-env",
	);

	const response = flag.evaluate({ country: "BR", userId: "u1" });
	assertEquals(response.enabled, true);
	assertEquals(response.reason, "targeted");
});
