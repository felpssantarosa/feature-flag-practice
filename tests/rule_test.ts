import { assertEquals } from "std/assert/assert_equals.ts";
import { PercentageRule, TargetedRule } from "../src/domain/rule/rule.ts";

Deno.test("PercentageRule is deterministic for same userId", () => {
	const rule = new PercentageRule("half", { percentage: 50, totalBuckets: 10 });
	const ctx = { userId: "user-123" };

	const a = rule.evaluate(ctx);
	const b = rule.evaluate(ctx);

	assertEquals(a, b);
});

Deno.test("PercentageRule respects percentage boundaries", () => {
	const always = new PercentageRule("all", {
		percentage: 100,
		totalBuckets: 10,
	});
	const never = new PercentageRule("none", { percentage: 0, totalBuckets: 10 });

	assertEquals(always.evaluate({ userId: "u1" }), true);
	assertEquals(never.evaluate({ userId: "u1" }), false);
});

Deno.test("TargetedRule matches values", () => {
	const rule = new TargetedRule("country-rule", {
		attribute: "country",
		values: ["BR", "PT"],
	});

	assertEquals(rule.evaluate({ country: "BR" }), true);
	assertEquals(rule.evaluate({ country: "US" }), false);
});
