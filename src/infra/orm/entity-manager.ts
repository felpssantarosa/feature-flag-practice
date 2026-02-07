import type { Database } from "@db/sqlite";
import type { FlagEntity } from "./entities/Flag.ts";
import type { RuleEntity } from "./entities/Rule.ts";
import type { RuleRow } from "../../services/rule.ts";
import type { EvaluationRow } from "../repository-types.ts";

export type FlagRow = {
	id: string;
	name: string;
	environment: string;
	enabled: number;
	description: string | null;
};

export class EntityManager {
	constructor(private readonly database: Database) {}

	findFlagRowByNameAndEnvironment(
		name: string,
		environment: string,
	): FlagRow | undefined {
		return this.database
			.prepare(
				`
        SELECT
          id,
          name,
          environment,
          enabled,
          description
        FROM flags
        WHERE name = ? AND environment = ?
      `,
			)
			.get([name, environment]) as FlagRow | undefined;
	}

	findRulesByFlagId(flagId: string): RuleRow[] {
		return this.database
			.prepare(
				`
        SELECT
          id,
          type,
          name,
          config AS configJSON
        FROM rules
        WHERE flag_id = ?
        ORDER BY position
      `,
			)
			.all([flagId]) as RuleRow[];
	}

	saveFlagWithRules(flag: FlagEntity, rules: RuleEntity[]): void {
		const transaction = this.database.transaction(() => {
			this.saveFlag(flag);
			this.replaceRules(flag.id, rules);
		});

		transaction();
	}

	private saveFlag(flag: FlagEntity): void {
		this.database
			.prepare(
				`
        INSERT OR REPLACE INTO flags
          (id, name, environment, enabled, description)
        VALUES (?, ?, ?, ?, ?)
      `,
			)
			.run([
				flag.id,
				flag.name,
				flag.environment,
				flag.enabled ? 1 : 0,
				flag.description,
			]);
	}

	private replaceRules(flagId: string, rules: RuleEntity[]): void {
		this.database.prepare(`DELETE FROM rules WHERE flag_id = ?`).run([flagId]);

		if (rules.length === 0) return;

		const insertRule = this.database.prepare(
			`
        INSERT INTO rules
          (id, flag_id, type, name, config, position)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
		);

		for (const rule of rules) {
			insertRule.run([
				rule.id,
				rule.flagId,
				rule.type,
				rule.name,
				rule.config,
				rule.position,
			]);
		}
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
				`
        INSERT INTO evaluations
          (id, flag_id, environment, context, result, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
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

	findEvaluationsByFlagId(flagId: string): EvaluationRow[] {
		return this.database
			.prepare(
				`
        SELECT
          id,
          flag_id,
          environment,
          context,
          result,
          reason,
          created_at
        FROM evaluations
        WHERE flag_id = ?
        ORDER BY created_at DESC
      `,
			)
			.all([flagId]) as EvaluationRow[];
	}
}
