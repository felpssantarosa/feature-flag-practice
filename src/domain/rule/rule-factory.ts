import {
	PercentageRule,
	type Rule,
	type RuleDefinition,
	TargetedRule,
} from "./rule.ts";

export function createRuleFromDefinition(definition: RuleDefinition): Rule {
	switch (definition.type) {
		case "percentage":
			return new PercentageRule(definition.name, definition.config);
		case "targeted":
			return new TargetedRule(definition.name, definition.config);
		default:
			throw new Error(`Unsupported rule type: ${definition.type}`);
	}
}
