import type { FeatureFlag } from "../domain/flag/flag.ts";

export interface EvaluationRow {
	id: string;
	flag_id: string;
	environment: string;
	context: string;
	result: number;
	reason: string;
	created_at: number;
}

export type FeatureFlagRepository = {
	save: (featureflag: FeatureFlag) => Promise<void>;
	update: (featureflag: FeatureFlag) => Promise<void>;
	findByName: (
		name: string,
		environment: string,
	) => Promise<FeatureFlag | null>;
	recordEvaluation: (
		flagId: string,
		environment: string,
		context: Record<string, unknown>,
		result: { enabled: boolean; reason: string },
	) => Promise<void>;
	getEvaluations: (flagId: string) => Promise<EvaluationRow[]>;
};
