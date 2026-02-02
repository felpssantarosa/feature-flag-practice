import type { EvaluationContext, Rule } from "./rule.ts";

export class FeatureFlag {
	private id: string;

	constructor(
		public name: string,
		private rules: Rule[],
	) {
		this.id = crypto.randomUUID();
	}

	isEnabled(context: EvaluationContext): boolean {
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
}
