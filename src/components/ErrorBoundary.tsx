/**
 * Ludo: Legends — Error Boundary
 * 
 * Catches React rendering errors and shows a recovery UI
 * instead of white-screening the entire app.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors, typography, spacing, radii, shadows } from '../theme/design-system';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        // In production, log to crash reporting service
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.icon}>⚠️</Text>
                        <Text style={styles.title}>
                            {this.props.fallbackTitle ?? 'Something went wrong'}
                        </Text>
                        <Text style={styles.message}>
                            {this.state.error?.message ?? 'An unexpected error occurred.'}
                        </Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={this.handleReset}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing['2xl'],
    },
    card: {
        backgroundColor: colors.ui.surface,
        borderRadius: radii.xl,
        padding: spacing['2xl'],
        alignItems: 'center',
        maxWidth: 320,
        ...shadows.lg,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: colors.ui.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    message: {
        fontSize: typography.size.sm,
        color: colors.ui.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: spacing.xl,
    },
    retryBtn: {
        backgroundColor: colors.ui.accent,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.md,
        borderRadius: radii.full,
    },
    retryText: {
        fontSize: typography.size.base,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
});
