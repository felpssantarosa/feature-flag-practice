import type { Database } from "@db/sqlite";
import type { FlagEntity } from "./entities/Flag.ts";
import type { RuleEntity } from "./entities/Rule.ts";
import type { RuleRow } from "../../services/rule.ts";
import type { EvaluationRow } from "../repository-types.ts";

export class EntityManager {
	constructor(private database: Database) {}

	findFlagRowByNameAndEnvironment(
		name: string,
		environment: string,
	): [string, string, string, number, string | null] | undefined {
		return this.database
			.prepare(
				"SELECT id, name, environment, enabled, description FROM flags WHERE name = ? AND environment = ?",
			)
			.value<[string, string, string, number, string | null]>([
				name,
				environment,
			]);
	}

	findRulesByFlagId(flagId: string): RuleRow[] {
		return this.database
			.prepare(
				`
      SELECT id, type, name, config
      FROM rules
      WHERE flag_id = ?
      ORDER BY position
    `,
			)
			.all([flagId]) as RuleRow[];
	}

	async saveFlagWithRules(
		flag: FlagEntity,
		rules: RuleEntity[],
	): Promise<void> {
		await Promise.resolve(
			this.database.transaction(() => {
				this.database
					.prepare(
						"INSERT OR REPLACE INTO flags (id, name, environment, enabled, description) VALUES (?, ?, ?, ?, ?)",
					)
					.run([
						flag.id,
						flag.name,
						flag.environment,
						flag.enabled ? 1 : 0,
						flag.description,
					]);

				this.database.prepare("DELETE FROM rules WHERE flag_id = ?").run([flag.id]);

				const insertRule = this.database.prepare(
					`
        INSERT INTO rules (id, flag_id, type, name, config, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
				);

				rules.forEach((r) => {
					insertRule.run([
						r.id,
						r.flagId,
						r.type,
						r.name,
						r.config,
						r.position,
					]);
				});
			}),
		);
	}

	saveEvaluation(
		flagId: string,
		environment: string,
		contextJSON: string,
		result: boolean,
		reason: string,
	): void {
		this.database
			.prepare(
				`INSERT INTO evaluations (id, flag_id, environment, context, result, reason) VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.run([
				crypto.randomUUID(),
				flagId,
				environment,
				contextJSON,
				result ? 1 : 0,
				reason,
			]);
	}

	async findEvaluationsByFlagId(flagId: string): Promise<EvaluationRow[]> {
		return this.database
			.prepare(
				`SELECT id, flag_id, environment, context, result, reason, created_at FROM evaluations WHERE flag_id = ? ORDER BY created_at DESC`,
			)
			.all([flagId]);
	}
}
