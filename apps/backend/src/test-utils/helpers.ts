/**
 * Creates a Drizzle-like chainable query mock that resolves with `result` when awaited
 * at any point in the chain (e.g. `.where()`, `.limit()`, `.returning()`).
 *
 * Each chain method is a real mock so you can assert `.toHaveBeenCalledWith()` on it.
 */
export function chain<T>(result: T): any {
	const c: Record<string, unknown> = {};

	['from', 'where', 'limit', 'offset', 'orderBy', 'groupBy', 'set', 'values', 'returning'].forEach(
		(m) => {
			c[m] = jest.fn(() => c);
		}
	);

	// Make the chain thenable — `await chain.where(...)` resolves with result
	const p = Promise.resolve(result);
	c.then = p.then.bind(p);
	c.catch = p.catch.bind(p);
	c.finally = p.finally.bind(p);

	return c;
}
