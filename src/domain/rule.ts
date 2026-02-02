import murmurhash from "murmurhash";
import type { Roles } from "./user.ts";

export type EvaluationContext = {
	userId?: string;
	roles?: Roles[];
	country?: string;
	plan?: string;
	[key: string]: unknown;
};

export interface Rule {
	name: string;
	evaluate(context: EvaluationContext): boolean;
}

export class PercentageRule implements Rule {
	constructor(
		public name: string,
		private flagId: string,
		private percentage: number,
		private totalBuckets = 10,
	) {}

	private getBucket(seed: string): number {
		const hash = murmurhash.v3(seed);
		return Math.abs(hash) % this.totalBuckets;
	}

	evaluate(context: EvaluationContext): boolean {
		if (!context.userId) return false;

		const bucket = this.getBucket(`${this.flagId}-${context.userId}`);
		const activeBuckets = Math.floor(
			(this.percentage / 100) * this.totalBuckets,
		);

		return bucket < activeBuckets;
	}
}

export class TargetedRule implements Rule {
	constructor(
		public name: string,
		private attribute: string,
		private values: unknown[],
	) {}

	evaluate(context: EvaluationContext): boolean {
		const value = context[this.attribute];
		if (value == null) return false;

		return this.values.includes(value);
	}
}
