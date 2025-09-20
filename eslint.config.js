module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaFeatures: { jsx: true } },
	plugins: ['react', '@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	settings: { react: { version: 'detect' } },
	rules: {
		// add spaces inside JSX curlies: { error } instead of {error}
		'react/jsx-curly-spacing': [
			'error',
			{ when: 'always', children: true, allowMultiline: true },
		],
		// (optional) keep spaces in object literals too: { a: 1 }
		'object-curly-spacing': ['error', 'always'],
	},
};
