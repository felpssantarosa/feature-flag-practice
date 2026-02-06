import type { RuleDefinition } from "../domain/rule/rule.ts";

export type CreateFlagParams = {
	name: string;
	ruleDefinitions: RuleDefinition[];
};
