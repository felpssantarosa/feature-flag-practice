import murmurhash from "npm:murmurhash@2.0.1";
import { v4 as uuid } from "npm:uuid@13.0.0";

const TOTAL_BUCKETS = 10;

export class Flag {
	private id: string = uuid();

	constructor(
		private name: string,
		private rolloutPercentage: number,
		private restrictedRoles: string[],
	) {
		this.name = name;
		this.restrictedRoles = restrictedRoles;
	}

	private getBucket(seed: string, totalBuckets: number): number {
		const hash = murmurhash.v3(seed);
		return (Math.abs(hash) % totalBuckets) + 1;
	}

	private isUserRoleEligible(userRoles: string[]): boolean {
		if (this.restrictedRoles.length === 0) return true;

		return this.restrictedRoles.some((role) => userRoles.includes(role));
	}

	public checkIsActive(userId: string, userRoles: string[]): boolean {
		if (!this.isUserRoleEligible(userRoles)) return false;

		const userBucket = this.getBucket(`${this.id}-${userId}`, TOTAL_BUCKETS);

		const activeBuckets = Math.floor(
			(this.rolloutPercentage / 100) * TOTAL_BUCKETS,
		);

		return userBucket < activeBuckets;
	}
}
