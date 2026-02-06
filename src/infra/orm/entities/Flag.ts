export class FlagEntity {
	id: string;
	name: string;
	environment: string;

	constructor(props: { id?: string; name: string; environment: string }) {
		this.id = props.id ?? crypto.randomUUID();
		this.name = props.name;
		this.environment = props.environment;
	}

	toJSON() {
		return { id: this.id, name: this.name, environment: this.environment };
	}
}
