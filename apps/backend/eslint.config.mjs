import tseslint from 'typescript-eslint';

export default tseslint.config(
	// ─── Global ignores ───────────────────────────────────────────────────────
	{
		ignores: ['dist/**', 'webpack.config.js', 'src/**/*.js', 'src/**/*.d.ts'],
	},

	// ─── Production source files ──────────────────────────────────────────────
	{
		files: ['src/**/*.ts'],
		ignores: ['src/**/*.spec.ts', 'src/test-utils/**/*.ts'],
		extends: tseslint.configs.recommended,
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-useless-constructor': 'off',
		},
	},

	// ─── Test files (use tsconfig.test.json which includes spec files) ────────
	{
		files: ['src/**/*.spec.ts', 'src/test-utils/**/*.ts'],
		extends: tseslint.configs.recommended,
		languageOptions: {
			parserOptions: {
				project: './tsconfig.test.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
		},
	}
);
