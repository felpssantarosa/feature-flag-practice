import type { FeatureFlag } from "../domain/flag/flag.ts";

export type FeatureFlagRepository = {
	save: (featureflag: FeatureFlag) => Promise<void>;
	update: (featureflag: FeatureFlag) => Promise<void>;
	findByName: (name: string) => Promise<FeatureFlag | null>;
};
