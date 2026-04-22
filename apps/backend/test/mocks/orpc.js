class ORPCError extends Error {
	constructor(code, options) {
		super(options?.message ?? code);
		this.code = code;
		this.name = 'ORPCError';
	}
}

module.exports = { ORPCError };
