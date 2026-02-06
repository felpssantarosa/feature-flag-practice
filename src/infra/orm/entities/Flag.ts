export class FlagEntity {
	id: string;
	name: string;

	constructor(props: { id?: string; name: string }) {
		this.id = props.id ?? crypto.randomUUID();
		this.name = props.name;
	}

	toJSON() {
		return { id: this.id, name: this.name };
	}
}
