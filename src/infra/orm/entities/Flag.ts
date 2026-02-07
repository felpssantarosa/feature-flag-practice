export class FlagEntity {
	id: string;
	name: string;
	environment: string;
	enabled: boolean;
	description?: string | null;

	constructor(props: {
		id?: string;
		name: string;
		environment: string;
		enabled?: boolean;
		description?: string | null;
	}) {
		this.id = props.id ?? crypto.randomUUID();
		this.name = props.name;
		this.environment = props.environment;
		this.enabled = props.enabled ?? false;
		this.description = props.description ?? null;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			environment: this.environment,
			enabled: this.enabled,
			description: this.description,
		};
	}
}
