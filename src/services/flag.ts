import { FeatureFlag } from "../domain/flag/flag.ts";
import type { FeatureFlagRepository } from "../infra/repository-types.ts";
import type { CreateFlagParams } from "./flag-types.ts";
import type { RuleService } from "./rule.ts";

export class FlagService {
	constructor(
		private flagRepository: FeatureFlagRepository,
		private ruleService: RuleService,
	) {}

	public async createFlag({
		name,
		ruleDefinitions,
	}: CreateFlagParams): Promise<FeatureFlag> {
		const rules = this.ruleService.createMany(ruleDefinitions);

		const flag = new FeatureFlag(name, rules);

		await this.flagRepository.save(flag);

		return flag;
	}

	public async updateFlag(flag: FeatureFlag): Promise<FeatureFlag> {
		await this.flagRepository.update(flag);

		return flag;
	}

	async findFlagByName(name: string): Promise<FeatureFlag | null> {
		return await this.flagRepository.findByName(name);
	}
}
