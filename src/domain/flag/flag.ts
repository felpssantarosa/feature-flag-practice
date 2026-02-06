import type { Rule, RuleContext } from "../rule/rule.ts";

export class FeatureFlag {
	private id: string;

	constructor(
		public name: string,
		private rules: Rule[],
	) {
		this.id = crypto.randomUUID();
	}

	getId(): string {
		return this.id;
	}

	getRules(): Rule[] {
		return this.rules;
	}

	isEnabled(context: RuleContext): boolean {
		return this.rules.every((rule) => rule.evaluate(context));
	}

	static fromJSON(data: {
		id: string;
		name: string;
		rules: Rule[];
	}): FeatureFlag {
		const flag = new FeatureFlag(data.name, data.rules);
		flag.id = data.id;

		return flag;
	}

	toJSON(): { id: string; name: string; rules: Rule[] } {
		return {
			id: this.id,
			name: this.name,
			rules: this.rules,
		};
	}
}
