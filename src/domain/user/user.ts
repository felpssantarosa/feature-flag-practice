export enum Roles {
	ADMIN = "admin",
	TESTER = "tester",
	USER = "user",
}

export class User {
	private id: string = crypto.randomUUID();

	constructor(
		private roles: Roles[],
		private country: string,
	) {}

	public getId() {
		return this.id;
	}

	public getRoles() {
		return this.roles;
	}

	public getCountry() {
		return this.country;
	}
}
