import {
	PercentageRule,
	type Rule,
	type RuleDefinition,
	type RuleType,
	TargetedRule,
} from "../domain/rule/rule.ts";

export interface RuleRow {
	id: string;
	name: string;
	type: RuleType;
	configJSON: string;
}

export class RuleService {
	create(definition: RuleDefinition): Rule {
		switch (definition.type) {
			case "percentage":
				return new PercentageRule(definition.name, definition.config);

			case "targeted":
				return new TargetedRule(definition.name, definition.config);

			default:
				throw new Error("Unknown rule type");
		}
	}

	createMany(definitions: RuleDefinition[]): Rule[] {
		return definitions.map((definition) => this.create(definition));
	}

	fromRow(row: RuleRow): Rule {
		const config = JSON.parse(row.configJSON);

		switch (row.type) {
			case "percentage":
				return new PercentageRule(row.name, config);

			case "targeted":
				return new TargetedRule(row.name, config);

			default:
				throw new Error(`Unknown rule type: ${row.type}`);
		}
	}
}
