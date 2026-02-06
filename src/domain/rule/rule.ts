import murmurhash from "murmurhash";
import type { Roles } from "../user/user.ts";

export type RuleType = "percentage" | "targeted";

export interface RuleDefinition {
	id: string;
	name: string;
	type: RuleType;
	config: string | object;
}

export interface RuleJSON {
	id: string;
	name: string;
	type: RuleType;
	config: object;
}

export type RuleContext = {
	userId?: string;
	roles?: Roles[];
	country?: string;
	plan?: string;
	[key: string]: unknown;
};

export interface Rule {
	id: string;
	name: string;
	type: RuleType;

	evaluate(context: RuleContext): boolean;
	toJSON(): RuleJSON;
}

export interface PercentageConfig {
	percentage: number;
	salt?: string;
	totalBuckets?: number;
}

export class PercentageRule implements Rule {
	public readonly id: string;
	public readonly type = "percentage" as const;
	private config: PercentageConfig;

	private totalBuckets: number;

	constructor(
		public name: string,
		config: string | object,
	) {
		this.id = crypto.randomUUID();
		this.config =
			typeof config === "string"
				? (JSON.parse(config) as PercentageConfig)
				: (config as PercentageConfig);
		this.totalBuckets = this.config.totalBuckets ?? 10;
	}

	private getBucket(seed: string): number {
		const hash = murmurhash.v3(seed);
		return Math.abs(hash) % this.totalBuckets;
	}

	evaluate(context: RuleContext): boolean {
		if (!context.userId) return false;

		const { percentage, salt = "" } = this.config;

		const bucket = this.getBucket(`${this.id}-${context.userId}-${salt}`);

		const activeBuckets = Math.floor((percentage / 100) * this.totalBuckets);

		return bucket < activeBuckets;
	}

	toJSON(): RuleJSON {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			config: this.config,
		};
	}
}

export interface TargetedConfig {
	attribute: string;
	values: unknown[];
}

export class TargetedRule implements Rule {
	public readonly id: string;
	public readonly type = "targeted" as const;
	private config: TargetedConfig;

	constructor(
		public name: string,
		config: string | object,
	) {
		this.id = crypto.randomUUID();
		this.config =
			typeof config === "string"
				? (JSON.parse(config) as TargetedConfig)
				: (config as TargetedConfig);
	}

	evaluate(context: RuleContext): boolean {
		const value = context[this.config.attribute];
		if (value === undefined) return false;

		return this.config.values.includes(value);
	}

	toJSON(): RuleJSON {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			config: this.config,
		};
	}
}
