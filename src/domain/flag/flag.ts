import type { Rule, RuleContext } from "../rule/rule.ts";

export class FeatureFlag {
	private id: string;

	constructor(
		public name: string,
		private rules: Rule[],
		private environment: string,
		public enabled: boolean = false,
		public description: string | null = null,
	) {
		this.id = crypto.randomUUID();
	}

	getId(): string {
		return this.id;
	}

	getRules(): Rule[] {
		return this.rules;
	}

	getEnvironment(): string {
		return this.environment;
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
		environment: string;
		enabled?: boolean;
		description?: string | null;
	}): FeatureFlag {
		const flag = new FeatureFlag(
			data.name,
			data.rules,
			data.environment,
			data.enabled ?? false,
			data.description ?? null,
		);
		flag.id = data.id;

		return flag;
	}

	toJSON(): {
		id: string;
		name: string;
		rules: Rule[];
		environment: string;
		enabled: boolean;
		description?: string | null;
	} {
		return {
			id: this.id,
			name: this.name,
			rules: this.rules,
			environment: this.environment,
			enabled: this.enabled,
			description: this.description,
		};
	}
}
