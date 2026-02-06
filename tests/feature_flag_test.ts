import { assertEquals } from "std/assert/assert_equals.ts";
import { FeatureFlag } from "../src/domain/flag/flag.ts";
import { PercentageRule, TargetedRule } from "../src/domain/rule/rule.ts";

Deno.test("FeatureFlag.evaluate returns correct reason for percentage", () => {
	const p = new PercentageRule("rollout", {
		percentage: 100,
		totalBuckets: 10,
	});
	const flag = new FeatureFlag("test", [p], "test-env");

	const res = flag.evaluate({ userId: "u1" });
	assertEquals(res.enabled, true);
	assertEquals(res.reason, "percentage");
});

Deno.test("FeatureFlag.evaluate returns targeted reason when targeted matches first", () => {
	const t = new TargetedRule("t", { attribute: "country", values: ["BR"] });
	const p = new PercentageRule("p", { percentage: 100, totalBuckets: 10 });
	// order matters — targeted first
	const flag = new FeatureFlag("test2", [t, p], "test-env");

	const res = flag.evaluate({ country: "BR", userId: "u1" });
	assertEquals(res.enabled, true);
	assertEquals(res.reason, "targeted");
});
