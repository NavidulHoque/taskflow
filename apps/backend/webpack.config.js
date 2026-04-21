/**
 * Custom webpack configuration for NestJS.
 *
 * Two overrides are applied:
 *  1. Bundle @taskflow/* workspace packages instead of treating them as externals.
 *     By default NestJS marks all node_modules as externals (resolved at runtime).
 *     @taskflow/* packages are ESM-only source in the monorepo — bundling them avoids
 *     Node.js ESM/CJS interop issues at runtime.
 *
 *  2. Enable transpileOnly on ts-loader to skip type-checking during webpack builds
 *     (type-checking is handled separately via `tsc --noEmit`).
 */

module.exports = (options) => {
	bundleWorkspacePackages(options);
	enableTranspileOnly(options);
	return options;
};

function bundleWorkspacePackages(options) {
	const original = options.externals;

	options.externals = [
		(ctx, callback) => {
			const request = ctx.request ?? ctx;

			// Include @taskflow/* in the bundle instead of marking as external
			if (typeof request === 'string' && request.startsWith('@taskflow/')) {
				return callback();
			}

			// Delegate everything else to the original externals config
			if (Array.isArray(original)) {
				for (const ext of original) {
					if (typeof ext === 'function') return ext(ctx, callback);
				}
			} else if (typeof original === 'function') {
				return original(ctx, callback);
			}

			return callback();
		},
	];
}

function enableTranspileOnly(options) {
	const tsRule = options.module?.rules?.find((r) => r.loader === 'ts-loader');
	if (tsRule) tsRule.options = { ...tsRule.options, transpileOnly: true };
}
