/**
 * eslint-plugin-ludo — Custom ESLint Rules for Ludo: Legends
 *
 * Enforces design system compliance: no hardcoded colors, spacing,
 * font sizes, or border radii in StyleSheet.create() or inline styles.
 *
 * 5 rules:
 *  1. no-hardcoded-colors       — Ban hex/rgb/rgba/hsl literals in style objects
 *  2. no-hardcoded-spacing      — Ban raw numbers for padding/margin/gap
 *  3. no-hardcoded-font-sizes   — Ban raw fontSize numbers
 *  4. no-hardcoded-radii        — Ban raw borderRadius numbers
 *  5. no-inline-styles-in-render — Warn on style={{ ... }} in JSX
 */

'use strict';

// ─── Allowed design-system spacing values ───────────────────────
const ALLOWED_SPACING = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const ALLOWED_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 64];
const ALLOWED_RADII = [0, 4, 8, 12, 16, 20, 24, 9999];

// ─── Known safe hex patterns (opacity suffixes, shadow color) ───
const SAFE_HEX_PATTERNS = [
    /^#000$/i,        // black (shadow color — universal)
    /^#FFFFFF$/i,     // white text on accent
    /^#[0-9a-f]{6}[0-9a-f]{2}$/i, // any hex with alpha suffix (e.g. '#FF000040')
];

// ─── Style properties that are spacing-related ─────────────────
const SPACING_PROPS = [
    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'paddingHorizontal', 'paddingVertical',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'marginHorizontal', 'marginVertical',
    'gap', 'rowGap', 'columnGap',
    'top', 'bottom', 'left', 'right',
];

// ─── Style properties that use colors ──────────────────────────
const COLOR_PROPS = [
    'color', 'backgroundColor', 'borderColor', 'borderTopColor',
    'borderBottomColor', 'borderLeftColor', 'borderRightColor',
    'tintColor', 'shadowColor', 'overlayColor', 'textShadowColor',
    'textDecorationColor', 'borderLeftColor',
];

// ─── Helper: Check if a node is inside StyleSheet.create() ─────
function isInsideStyleSheet(node) {
    let parent = node.parent;
    while (parent) {
        if (
            parent.type === 'CallExpression' &&
            parent.callee &&
            parent.callee.type === 'MemberExpression' &&
            parent.callee.object &&
            parent.callee.object.name === 'StyleSheet' &&
            parent.callee.property &&
            parent.callee.property.name === 'create'
        ) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

// ─── Helper: Check if node is inside a style-related context ───
function isInStyleContext(node) {
    if (isInsideStyleSheet(node)) return true;

    // Also catch inline style objects: style={{ ... }}
    let parent = node.parent;
    while (parent) {
        if (
            parent.type === 'JSXAttribute' &&
            parent.name &&
            parent.name.name === 'style'
        ) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

// ─── Helper: Get property name from a Property AST node ────────
function getPropertyName(node) {
    if (!node || !node.key) return null;
    if (node.key.type === 'Identifier') return node.key.name;
    if (node.key.type === 'Literal') return String(node.key.value);
    return null;
}

// ─── Helper: Check if file is a theme/config file (exempt) ─────
function isExemptFile(filename) {
    if (!filename) return false;
    const exemptPaths = [
        'design-system.ts',
        'commonStyles.ts',
        'BoardThemeEngine.ts',
        'GameEffectsEngine.ts',
        'MatchCommentary.ts',
        'SignatureMoments.ts',
        'eslint-plugin-ludo',
    ];
    return exemptPaths.some(p => filename.includes(p));
}

// ─── Helper: Is this hex color safe? ────────────────────────────
function isSafeHex(value) {
    return SAFE_HEX_PATTERNS.some(pattern => pattern.test(value));
}


// ═══════════════════════════════════════════════════════════════
// Rule 1: no-hardcoded-colors
// ═══════════════════════════════════════════════════════════════
const noHardcodedColors = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow hardcoded color values in styles. Use design-system tokens instead.',
            category: 'Stylistic Issues',
        },
        messages: {
            noHardcodedColor:
                'Hardcoded color "{{value}}" found in style property "{{prop}}". ' +
                'Use a token from design-system.ts (e.g. colors.ui.accent, colors.player.red).',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        if (isExemptFile(filename)) return {};

        return {
            Property(node) {
                if (!isInStyleContext(node)) return;
                const propName = getPropertyName(node);
                if (!propName || !COLOR_PROPS.includes(propName)) return;

                // Check for string literal hex/rgb/rgba/hsl colors
                if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
                    const val = node.value.value;
                    const isColor = /^#[0-9a-f]{3,8}$/i.test(val) ||
                        /^rgba?\(/i.test(val) ||
                        /^hsla?\(/i.test(val);

                    if (isColor && !isSafeHex(val)) {
                        context.report({
                            node: node.value,
                            messageId: 'noHardcodedColor',
                            data: { value: val, prop: propName },
                        });
                    }
                }

                // Check for template literals that look like colors
                if (node.value && node.value.type === 'TemplateLiteral') {
                    // Skip template literals — they're often computed (e.g. `${color}40`)
                    // which is usually a color + opacity suffix, which is acceptable
                }
            },
        };
    },
};

// ═══════════════════════════════════════════════════════════════
// Rule 2: no-hardcoded-spacing
// ═══════════════════════════════════════════════════════════════
const noHardcodedSpacing = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow hardcoded spacing values in styles. Use spacing tokens instead.',
            category: 'Stylistic Issues',
        },
        messages: {
            noHardcodedSpacing:
                'Hardcoded spacing value {{value}} in "{{prop}}". ' +
                'Use a spacing token (e.g. spacing.sm = 8, spacing.base = 16).',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        if (isExemptFile(filename)) return {};

        return {
            Property(node) {
                if (!isInStyleContext(node)) return;
                const propName = getPropertyName(node);
                if (!propName || !SPACING_PROPS.includes(propName)) return;

                if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'number') {
                    const val = node.value.value;
                    if (!ALLOWED_SPACING.includes(val) && val > 0) {
                        context.report({
                            node: node.value,
                            messageId: 'noHardcodedSpacing',
                            data: { value: String(val), prop: propName },
                        });
                    }
                }

                // Negative margins/offsets are acceptable for layout tricks
                if (node.value && node.value.type === 'UnaryExpression' &&
                    node.value.operator === '-') {
                    // Allow negative values (e.g. margin: -4)
                }
            },
        };
    },
};

// ═══════════════════════════════════════════════════════════════
// Rule 3: no-hardcoded-font-sizes
// ═══════════════════════════════════════════════════════════════
const noHardcodedFontSizes = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow hardcoded fontSize values. Use typography.size tokens.',
            category: 'Stylistic Issues',
        },
        messages: {
            noHardcodedFontSize:
                'Hardcoded fontSize {{value}}. ' +
                'Use typography.size token (e.g. typography.size.base = 14).',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        if (isExemptFile(filename)) return {};

        return {
            Property(node) {
                if (!isInStyleContext(node)) return;
                const propName = getPropertyName(node);
                if (propName !== 'fontSize') return;

                if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'number') {
                    const val = node.value.value;
                    if (!ALLOWED_FONT_SIZES.includes(val)) {
                        context.report({
                            node: node.value,
                            messageId: 'noHardcodedFontSize',
                            data: { value: String(val) },
                        });
                    }
                }
            },
        };
    },
};

// ═══════════════════════════════════════════════════════════════
// Rule 4: no-hardcoded-radii
// ═══════════════════════════════════════════════════════════════
const noHardcodedRadii = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow hardcoded borderRadius values. Use radii tokens.',
            category: 'Stylistic Issues',
        },
        messages: {
            noHardcodedRadius:
                'Hardcoded borderRadius {{value}}. ' +
                'Use radii token (e.g. radii.md = 12, radii.lg = 16).',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        if (isExemptFile(filename)) return {};

        return {
            Property(node) {
                if (!isInStyleContext(node)) return;
                const propName = getPropertyName(node);
                if (!propName || !propName.toLowerCase().includes('radius')) return;

                if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'number') {
                    const val = node.value.value;
                    if (!ALLOWED_RADII.includes(val)) {
                        context.report({
                            node: node.value,
                            messageId: 'noHardcodedRadius',
                            data: { value: String(val) },
                        });
                    }
                }
            },
        };
    },
};

// ═══════════════════════════════════════════════════════════════
// Rule 5: no-inline-styles-in-render
// ═══════════════════════════════════════════════════════════════
const noInlineStylesInRender = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Disallow inline style objects in JSX. Use StyleSheet.create instead for performance.',
            category: 'Best Practices',
        },
        messages: {
            noInlineStyle:
                'Inline style object detected. Move to StyleSheet.create() for better performance, ' +
                'or use an array with existing styles.',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        if (isExemptFile(filename)) return {};

        return {
            JSXAttribute(node) {
                if (
                    node.name &&
                    node.name.name === 'style' &&
                    node.value &&
                    node.value.type === 'JSXExpressionContainer'
                ) {
                    const expr = node.value.expression;

                    // style={{ ... }} — direct object expression
                    if (expr.type === 'ObjectExpression') {
                        // Allow if it's only 1-2 dynamic properties (common pattern)
                        const hasOnlyDynamic = expr.properties.every(p => {
                            if (p.type !== 'Property') return true;
                            // Dynamic: value references a variable, member expression, or call
                            return (
                                p.value.type === 'MemberExpression' ||
                                p.value.type === 'Identifier' ||
                                p.value.type === 'CallExpression' ||
                                p.value.type === 'ConditionalExpression'
                            );
                        });

                        // Only warn on fully static inline styles (not dynamic ones)
                        if (!hasOnlyDynamic && expr.properties.length > 2) {
                            context.report({
                                node: expr,
                                messageId: 'noInlineStyle',
                            });
                        }
                    }
                }
            },
        };
    },
};

// ═══════════════════════════════════════════════════════════════
// Plugin Export
// ═══════════════════════════════════════════════════════════════
module.exports = {
    rules: {
        'no-hardcoded-colors': noHardcodedColors,
        'no-hardcoded-spacing': noHardcodedSpacing,
        'no-hardcoded-font-sizes': noHardcodedFontSizes,
        'no-hardcoded-radii': noHardcodedRadii,
        'no-inline-styles-in-render': noInlineStylesInRender,
    },
    configs: {
        recommended: {
            plugins: ['ludo'],
            rules: {
                'ludo/no-hardcoded-colors': 'error',
                'ludo/no-hardcoded-spacing': 'warn',
                'ludo/no-hardcoded-font-sizes': 'warn',
                'ludo/no-hardcoded-radii': 'warn',
                'ludo/no-inline-styles-in-render': 'warn',
            },
        },
    },
};
