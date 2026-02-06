import type { FastifyInstance } from "fastify";
import { FeatureFlagsRepository } from "../../infra/sqlite/feature-flags-repository.ts";
import { FlagService } from "../../services/flag.ts";
import { RuleService } from "../../services/rule.ts";

const featureFlagRepository = new FeatureFlagsRepository();
const ruleService = new RuleService();
const flagService = new FlagService(featureFlagRepository, ruleService);

export const featureFlagRoutes = (fastify: FastifyInstance) => {
	fastify.get("/flags/:name", async (request, reply) => {
		const { name } = request.params as { name: string };

		const flag = await flagService.findFlagByName(name);

		if (!flag) {
			return reply.status(404).send({ message: "Feature flag not found" });
		}

		return reply.send(flag);
	});
};
