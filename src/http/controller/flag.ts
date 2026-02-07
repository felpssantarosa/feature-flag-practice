import type { FastifyInstance } from "fastify";
import { FeatureFlagsRepository } from "../../infra/sqlite/feature-flags-repository.ts";
import { FlagService } from "../../services/flag.ts";
import { RuleService } from "../../services/rule.ts";
import { SimpleCache } from "../../services/cache.ts";
import type { RuleDefinition, RuleContext } from "../../domain/rule/rule.ts";

const featureFlagsRepository = new FeatureFlagsRepository();
const ruleService = new RuleService();
const evaluationCache = new SimpleCache<{ enabled: boolean; reason: string }>(
	5000,
);
const flagService = new FlagService(
	featureFlagsRepository,
	ruleService,
	evaluationCache,
);

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
				body: {
					type: "object",
					properties: {
						name: { type: "string" },
						ruleDefinitions: { type: "array" },
						enabled: { type: "boolean" },
						description: { type: ["string", "null"] },
					},
				},
			},
		},
		async (request, reply) => {
			const { key, env } = request.params as { key: string; env: string };
			const body = request.body as unknown as {
				name?: string;
				ruleDefinitions?: Array<Record<string, unknown>>;
				enabled?: boolean;
				description?: string | null;
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
				flag.enabled = body.enabled ?? flag.enabled;
				flag.description = body.description ?? flag.description;
				await flagService.updateFlag(flag);
				return reply.send({ message: "updated", flag });
			}

			const created = await flagService.createFlag({
				name,
				ruleDefinitions: definitions as unknown as RuleDefinition[],
				environment: env,
				enabled: body.enabled,
				description: body.description,
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

			const { response, error } = await flagService.evaluate(
				flagName,
				env,
				context as Record<string, unknown>,
			);

			if (error) {
				return reply
					.status(error.httpErrorCode ?? 500)
					.send({ message: error.message });
			}

			return reply.send(response);
		},
	);

	fastify.post(
		"/environments/:env/evaluate/bulk",
		{
			schema: {
				params: {
					type: "object",
					properties: { env: { type: "string" } },
					required: ["env"],
				},
				body: {
					type: "object",
					properties: {
						flags: { type: "array", items: { type: "string" } },
						context: { type: "object" },
					},
					required: ["flags"],
				},
			},
		},
		async (request, reply) => {
			const { env } = request.params as { env: string };
			const body = request.body as {
				flagNames: string[];
				context?: RuleContext;
			};

			const { flagNames, context = {} } = body;

			const results = await flagService.bulkEvaluate(
				flagNames,
				env,
				context as Record<string, unknown>,
			);

			return reply.send(results);
		},
	);
};
