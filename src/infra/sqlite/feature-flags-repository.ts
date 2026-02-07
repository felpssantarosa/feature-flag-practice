import { Database } from "@db/sqlite";
import { FeatureFlag } from "../../domain/flag/flag.ts";
import type { RuleRow } from "../../services/rule.ts";
import type {
	EvaluationRow,
	FeatureFlagRepository,
} from "../repository-types.ts";
import { FlagEntity } from "../orm/entities/Flag.ts";
import { RuleEntity } from "../orm/entities/Rule.ts";
import { EntityManager } from "../orm/entity-manager.ts";
import { createRuleFromDefinition } from "../../domain/rule/rule-factory.ts";

export class FeatureFlagsRepository implements FeatureFlagRepository {
	private em: EntityManager;

	constructor(db = new Database("production.db")) {
		this.em = new EntityManager(db);
	}

	async save(flag: FeatureFlag) {
		await this.persist(flag);
	}

	async update(flag: FeatureFlag) {
		await this.persist(flag);
	}

	findByName(name: string, environment: string): Promise<FeatureFlag | null> {
		const flagRow = this.em.findFlagRowByName(name, environment);

		if (!flagRow) return new Promise((resolve) => resolve(null));

		const [id, flagName, env, enabledNum, description] = flagRow;

		const ruleRows = this.em.findRulesByFlagId(id);

		const rules = ruleRows.map((row: RuleRow) =>
			createRuleFromDefinition({
				id: row.id,
				type: row.type,
				name: row.name,
				config: JSON.parse(row.configJSON),
			}),
		);

		return new Promise((resolve) =>
			resolve(
				FeatureFlag.fromJSON({
					id,
					name: flagName,
					rules,
					environment: env,
					enabled: Boolean(enabledNum),
					description,
				}),
			),
		);
	}

	private async persist(flag: FeatureFlag): Promise<void> {
		const { id, name, rules, environment, enabled, description } =
			flag.toJSON();

		const flagEntity = new FlagEntity({
			id,
			name,
			environment,
			enabled,
			description,
		});

		const ruleEntities = rules.map((rule, index) => {
			const def = rule.toJSON();

			return new RuleEntity({
				id: def.id,
				flagId: flagEntity.id,
				type: def.type,
				name: def.name,
				config: JSON.stringify(def.config),
				position: index,
			});
		});

		await this.em.saveFlagWithRules(flagEntity, ruleEntities);
	}

	async recordEvaluation(
		flagId: string,
		environment: string,
		context: Record<string, unknown>,
		result: { enabled: boolean; reason: string },
	) {
		this.em.saveEvaluation(
			flagId,
			environment,
			JSON.stringify(context),
			result.enabled,
			result.reason,
		);
	}

	async getEvaluations(flagId: string): Promise<EvaluationRow[]> {
		return this.em.findEvaluationsByFlagId(flagId);
	}
}
