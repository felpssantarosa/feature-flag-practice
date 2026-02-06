export class RuleEntity {
	id: string;
	flagId: string;
	type: string;
	name: string;
	config: string;
	position: number;

	constructor(props: {
		id?: string;
		flagId: string;
		type: string;
		name: string;
		config: string;
		position: number;
	}) {
		this.id = props.id ?? crypto.randomUUID();
		this.flagId = props.flagId;
		this.type = props.type;
		this.name = props.name;
		this.config = props.config;
		this.position = props.position;
	}

	toJSON() {
		return {
			id: this.id,
			flagId: this.flagId,
			type: this.type,
			name: this.name,
			config: this.config,
			position: this.position,
		};
	}
}
