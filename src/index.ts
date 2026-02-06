import { Database } from "@db/sqlite";
import fastify from "fastify";
import { runMigrations } from "./infra/sqlite/migrations.ts";

const db = new Database("production.db");
runMigrations(db);

const app = fastify();

const dbResponse = db.prepare("select sqlite_version()").value<[string]>();

if (!dbResponse) throw new Error("Unexpected DB response");

const [version] = dbResponse;

console.log(version);

app.listen({ port: 3000 }, (err, address) => {
	if (err) {
		console.error(err);
		Deno.exit(1);
	}

	console.log(`Server listening at ${address}`);
});
