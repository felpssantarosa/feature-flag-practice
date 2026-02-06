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
		return this.rules.some((rule) => rule.evaluate(context));
	}

	evaluate(context: RuleContext): { enabled: boolean; reason: string } {
		if (!this.rules || this.rules.length === 0) {
			return { enabled: false, reason: "no-rules" };
		}

		for (const rule of this.rules) {
			if (rule.evaluate(context)) {
				return { enabled: true, reason: rule.type };
			}
		}

		return { enabled: false, reason: "none" };
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
