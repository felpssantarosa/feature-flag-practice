import type { FastifyInstance } from "fastify";
import { FeatureFlagsRepository } from "../../infra/sqlite/feature-flags-repository.ts";
import { FlagService } from "../../services/flag.ts";
import { RuleService } from "../../services/rule.ts";
import type { RuleDefinition, RuleContext } from "../../domain/rule/rule.ts";

const featureFlagRepository = new FeatureFlagsRepository();
const ruleService = new RuleService();
const flagService = new FlagService(featureFlagRepository, ruleService);

export const featureFlagRoutes = (fastify: FastifyInstance) => {
	fastify.get("/flags/:name", async (request, reply) => {
		const { name } = request.params as { name: string };
		const { env } = request.query as { env?: string };

		const flag = await flagService.findFlagByName(name, env ?? "production");

		if (!flag) {
			return reply.status(404).send({ message: "Feature flag not found" });
		}

		return reply.send(flag);
	});

	fastify.put(
		"/environments/:env/flags/:key",
		{
			schema: {
				params: {
					type: "object",
					properties: { env: { type: "string" }, key: { type: "string" } },
					required: ["env", "key"],
				},
				body: { type: "object" },
			},
		},
		async (request, reply) => {
			const { key, env } = request.params as { key: string; env: string };
			const body = request.body as unknown as {
				name?: string;
				ruleDefinitions?: Array<Record<string, unknown>>;
			};

			const name = body.name ?? key;
			const definitions = body.ruleDefinitions ?? [];

			const flag = await flagService.findFlagByName(name, env);

			if (flag) {
				flag
					.getRules()
					.splice(
						0,
						flag.getRules().length,
						...ruleService.createMany(
							definitions as unknown as RuleDefinition[],
						),
					);
				await flagService.updateFlag(flag);
				return reply.send({ message: "updated", flag });
			}

			const created = await flagService.createFlag({
				name,
				ruleDefinitions: definitions as unknown as RuleDefinition[],
				environment: env,
			});
			return reply.status(201).send({ message: "created", flag: created });
		},
	);

	fastify.post(
		"/environments/:env/evaluate",
		{
			schema: {
				params: {
					type: "object",
					properties: { env: { type: "string" } },
					required: ["env"],
				},
				body: {
					type: "object",
					properties: { flag: { type: "string" }, context: { type: "object" } },
					required: ["flag"],
				},
			},
		},
		async (request, reply) => {
			const { env } = request.params as { env: string };
			const body = request.body as {
				flag: string;
				context?: Record<string, unknown>;
			};

			const { flag: flagName, context = {} } = body;

			if (!flagName)
				return reply.status(400).send({ message: "flag name is required" });

			const flag = await flagService.findFlagByName(flagName, env);

			if (!flag)
				return reply.status(404).send({ message: "feature flag not found" });

			const result = flag.evaluate(context as unknown as RuleContext);

			return reply.send(result);
		},
	);
};
