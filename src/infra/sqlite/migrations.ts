import type { Database } from "@db/sqlite";
import { createConnection } from "../orm/connection.ts";

export function runMigrations(db: Database) {
	const conn = createConnection(db);
	conn.sync();
}
