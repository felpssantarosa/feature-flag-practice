import type { Database } from "@db/sqlite";
import type { FlagEntity } from "./entities/Flag.ts";
import type { RuleEntity } from "./entities/Rule.ts";
import type { RuleRow } from "../../services/rule.ts";

export class EntityManager {
	constructor(private db: Database) {}

	findFlagRowByNameAndEnvironment(
		name: string,
		environment: string,
	): [string, string, string] | undefined {
		return this.db
			.prepare(
				"SELECT id, name, environment FROM flags WHERE name = ? AND environment = ?",
			)
			.value<[string, string, string]>([name, environment]);
	}

	findRulesByFlagId(flagId: string): RuleRow[] {
		return this.db
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
			this.db.transaction(() => {
				this.db
					.prepare(
						"INSERT OR REPLACE INTO flags (id, name, environment) VALUES (?, ?, ?)",
					)
					.run([flag.id, flag.name, flag.environment]);

				this.db.prepare("DELETE FROM rules WHERE flag_id = ?").run([flag.id]);

				const insertRule = this.db.prepare(
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
}
