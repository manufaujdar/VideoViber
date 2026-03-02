/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ['next/core-web-vitals'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
    },
    ignorePatterns: ['node_modules/', '.next/', 'dist/'],
};
