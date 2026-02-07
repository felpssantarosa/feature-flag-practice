import type { Database } from "@db/sqlite";

export interface Connection {
	db: Database;
	sync: () => void;
}

export function createConnection(db: Database): Connection {
	return {
		db,
		sync() {
			db.prepare(`
        CREATE TABLE IF NOT EXISTS flags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          environment TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          UNIQUE(name, environment)
        )
      `).run();

			db.prepare(`
        CREATE TABLE IF NOT EXISTS rules (
          id TEXT PRIMARY KEY,
          flag_id TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          config TEXT NOT NULL,
          position INTEGER NOT NULL,
          FOREIGN KEY (flag_id) REFERENCES flags(id)
        )
      `).run();

			db.prepare(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id TEXT PRIMARY KEY,
          flag_id TEXT NOT NULL,
          environment TEXT NOT NULL,
          context TEXT NOT NULL,
          result INTEGER NOT NULL,
          reason TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          FOREIGN KEY (flag_id) REFERENCES flags(id)
        )
      `).run();
		},
	};
}
