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
		},
	};
}
