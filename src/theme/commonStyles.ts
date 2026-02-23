/**
 * Ludo: Legends — Common Styles
 * 
 * Shared StyleSheet presets to eliminate duplicated layout patterns.
 * Import these instead of re-defining the same styles in every screen.
 */

import { StyleSheet } from 'react-native';
import { colors, typography, spacing, radii, shadows } from './design-system';

export const commonStyles = StyleSheet.create({
    /** Full-screen container with dark background */
    screen: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },

    /** Standard scroll content with bottom padding */
    scrollContent: {
        paddingBottom: spacing['3xl'],
    },

    /** Centered loading indicator container */
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },

    /** Section title — uppercase, tracked, tertiary color */
    sectionTitle: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: colors.ui.textTertiary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: spacing.md,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.base,
    },

    /** Standard card surface */
    card: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        ...shadows.sm,
    },

    /** Elevated card surface */
    cardElevated: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing.lg,
        ...shadows.md,
    },

    /** Row container with horizontal layout */
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    /** Centered container */
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    /** Content area with horizontal padding */
    contentPadding: {
        paddingHorizontal: spacing.base,
    },

    /** Divider line */
    divider: {
        height: 1,
        backgroundColor: colors.ui.border,
        marginVertical: spacing.xl,
    },

    /** Standard loading text */
    loadingText: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
    },
});

/** Semantic color for text on accent-colored backgrounds */
export const ON_ACCENT_COLOR = '#FFFFFF';
