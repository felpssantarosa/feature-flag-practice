import { FeatureFlag } from "../domain/flag/flag.ts";
import type { RuleContext } from "../domain/rule/rule.ts";
import type { FeatureFlagRepository } from "../infra/repository-types.ts";
import type { SimpleCache } from "./cache.ts";
import type { CreateFlagParams } from "./flag-types.ts";
import type { RuleService } from "./rule.ts";

interface EvaluationResponse {
	response?: { enabled: boolean; reason: string };
	error?: { message: string; httpErrorCode: number };
}

export class FlagService {
	constructor(
		private flagRepository: FeatureFlagRepository,
		private ruleService: RuleService,
		private cache: SimpleCache<{ enabled: boolean; reason: string }>,
	) {}

	public async createFlag({
		name,
		ruleDefinitions,
		environment,
	}: CreateFlagParams): Promise<FeatureFlag> {
		const rules = this.ruleService.createMany(ruleDefinitions);

		const flag = new FeatureFlag(name, rules, environment);

		await this.flagRepository.save(flag);

		return flag;
	}

	public async updateFlag(flag: FeatureFlag): Promise<FeatureFlag> {
		await this.flagRepository.update(flag);

		return flag;
	}

	async findFlagByName(
		name: string,
		environment: string,
	): Promise<FeatureFlag | null> {
		return await this.flagRepository.findByName(name, environment);
	}

	async recordEvaluation(
		flagId: string,
		environment: string,
		context: Record<string, unknown>,
		result: { enabled: boolean; reason: string },
	) {
		return await this.flagRepository.recordEvaluation(
			flagId,
			environment,
			context,
			result,
		);
	}

	async getEvaluations(flagId: string) {
		return await this.flagRepository.getEvaluations(flagId);
	}

	async evaluate(
		flagName: string,
		environment: string,
		context: Record<string, unknown>,
	): Promise<EvaluationResponse> {
		if (!flagName)
			return {
				error: { message: "flag name is required", httpErrorCode: 400 },
			};

		const flag = await this.findFlagByName(flagName, environment);

		if (!flag)
			return {
				error: { message: "feature flag not found", httpErrorCode: 404 },
			};
		const cacheKey = `${environment}::${flag.getId()}::${JSON.stringify(context)}`;
		const cached = this.cache.get(cacheKey);

		if (cached) return { response: cached };

		const result = flag.evaluate(context as unknown as RuleContext);

		await this.recordEvaluation(
			flag.getId(),
			environment,
			context as Record<string, unknown>,
			result,
		);

		this.cache.set(cacheKey, result);

		return { response: result };
	}

	async bulkEvaluate(
		flagNames: string[],
		environment: string,
		context: Record<string, unknown>,
	) {
		const results: Record<string, { enabled: boolean; reason: string }> = {};

		for (const flagName of flagNames) {
			const flag = await this.findFlagByName(flagName, environment);

			if (!flag) {
				results[flagName] = { enabled: false, reason: "not-found" };
				continue;
			}

			const evaluation = flag.evaluate(context);
			results[flagName] = evaluation;

			await this.recordEvaluation(
				flag.getId(),
				environment,
				context as Record<string, unknown>,
				evaluation,
			);
		}
	}
}
