/** @type {import("prettier").Config} */
module.exports = {
	semi: true,
	tabWidth: 4,
	useTabs: true,
	printWidth: 120,
	endOfLine: 'lf',
	singleQuote: true,
	trailingComma: 'es5',
	overrides: [
		{
			files: ['*.json'],
			options: { printWidth: 120 },
		},
	],
};
