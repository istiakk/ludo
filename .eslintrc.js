/**
 * Ludo: Legends — ESLint Configuration
 *
 * 3-layer enforcement:
 *  1. Standard TypeScript + React + React Native rules
 *  2. Custom plugin (eslint-plugin-ludo) for design system compliance
 *  3. Import restrictions for theme consistency
 */

module.exports = {
    root: true,

    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },

    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'react-native',
        'ludo',
    ],

    settings: {
        react: { version: 'detect' },
    },

    env: {
        es2022: true,
        'react-native/react-native': true,
    },

    // ─── Layer 1: Standard Rules ────────────────────────────────
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],

    rules: {
        // ── TypeScript ──────────────────────────────────────────
        '@typescript-eslint/no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
        }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/consistent-type-imports': ['warn', {
            prefer: 'type-imports',
            disallowTypeAnnotations: false,
        }],

        // ── React ───────────────────────────────────────────────
        'react/react-in-jsx-scope': 'off',           // Not needed with React 17+
        'react/prop-types': 'off',                    // TypeScript handles this
        'react/display-name': 'off',                  // Not needed for React.memo
        'react/no-unescaped-entities': 'warn',

        // ── React Hooks ─────────────────────────────────────────
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // ── React Native ────────────────────────────────────────
        'react-native/no-unused-styles': 'warn',
        'react-native/no-inline-styles': 'off',       // Custom rule handles this better
        'react-native/no-color-literals': 'off',       // Custom rule handles this better
        'react-native/no-raw-text': ['warn', {
            skip: ['TouchableOpacity', 'Pressable'],
        }],

        // ── General Quality ─────────────────────────────────────
        'no-console': ['warn', {
            allow: ['warn', 'error'],
        }],
        'no-debugger': 'error',
        'no-duplicate-imports': 'error',
        'prefer-const': 'warn',
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'no-var': 'error',

        // ─── Layer 2: Custom Design System Rules ────────────────
        'ludo/no-hardcoded-colors': 'error',
        'ludo/no-hardcoded-spacing': 'warn',
        'ludo/no-hardcoded-font-sizes': 'warn',
        'ludo/no-hardcoded-radii': 'warn',
        'ludo/no-inline-styles-in-render': 'warn',

        // ─── Layer 3: Import Restrictions ───────────────────────
        'no-restricted-imports': ['error', {
            patterns: [
                {
                    group: ['../theme/design-system'],
                    importNames: ['default'],
                    message: 'Import named exports (colors, typography, spacing, radii, shadows) from design-system.',
                },
            ],
            paths: [
                {
                    name: 'react-native',
                    importNames: ['PixelRatio'],
                    message: 'Use layout tokens from design-system.ts instead of PixelRatio for sizing.',
                },
            ],
        }],
    },

    // ─── Overrides ──────────────────────────────────────────────
    overrides: [
        // Theme/config files are exempt from design system rules
        {
            files: [
                'src/theme/**/*.ts',
                'src/rendering/BoardThemeEngine.ts',
                'src/rendering/GameEffectsEngine.ts',
                'src/rendering/SignatureMoments.ts',
                'src/engine/MatchCommentary.ts',
                'src/services/ProgressionService.ts',
                'src/services/CosmeticsCatalog.ts',
            ],
            rules: {
                'ludo/no-hardcoded-colors': 'off',
                'ludo/no-hardcoded-spacing': 'off',
                'ludo/no-hardcoded-font-sizes': 'off',
                'ludo/no-hardcoded-radii': 'off',
            },
        },
        // Test files
        {
            files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
            rules: {
                'no-console': 'off',
                'ludo/no-hardcoded-colors': 'off',
            },
        },
        // JS config files (this file, plugin, etc.)
        {
            files: ['*.js', 'eslint-plugin-ludo/**/*.js'],
            rules: {
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],

    // ─── Ignored Paths ──────────────────────────────────────────
    ignorePatterns: [
        'node_modules/',
        '.expo/',
        'dist/',
        'build/',
        'android/',
        'ios/',
        'eslint-plugin-ludo/',
    ],
};
