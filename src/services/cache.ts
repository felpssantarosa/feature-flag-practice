type CacheEntry<T> = { value: T; expiresAt: number };

export class SimpleCache<T> {
	private map = new Map<string, CacheEntry<T>>();

	constructor(private ttlInMilliseconds = 5000) {}

	get(key: string): T | undefined {
		const cacheEntry = this.map.get(key);

		if (!cacheEntry) return undefined;

		if (Date.now() > cacheEntry.expiresAt) {
			this.map.delete(key);
			return undefined;
		}

		return cacheEntry.value;
	}

	set(key: string, value: T): void {
		this.map.set(key, {
			value,
			expiresAt: Date.now() + this.ttlInMilliseconds,
		});
	}

	clear(): void {
		this.map.clear();
	}
}
