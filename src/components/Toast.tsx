/**
 * Ludo: Legends — Toast Notification System
 * 
 * Lightweight, non-blocking toast notifications for in-game events.
 * Auto-dismiss, stacks multiple toasts, haptic feedback.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { create } from 'zustand';
import { colors, typography, spacing, radii } from '../theme/design-system';

// ─── Types ──────────────────────────────────────────────────────

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'reward';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    icon?: string;
    durationMs: number;
}

// ─── Toast Store ────────────────────────────────────────────────

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, icon?: string, durationMs?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    addToast: (message, type = 'info', icon, durationMs = 3000) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`;
        set(s => ({
            toasts: [...s.toasts.slice(-2), { id, message, type, icon, durationMs }], // Max 3
        }));

        // Auto-remove
        setTimeout(() => {
            set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        }, durationMs);
    },

    removeToast: (id) => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    },
}));

// ─── Convenience Functions ──────────────────────────────────────

export const showToast = (message: string, type?: ToastType, icon?: string) => {
    useToastStore.getState().addToast(message, type, icon);
};

export const showRewardToast = (message: string) => {
    useToastStore.getState().addToast(message, 'reward', '🎁', 4000);
};

// ─── Toast Component ────────────────────────────────────────────

const TOAST_COLORS: Record<ToastType, { bg: string; text: string }> = {
    info: { bg: colors.ui.surfaceElevated, text: colors.ui.text },
    success: { bg: colors.ui.success + '20', text: colors.ui.success },
    warning: { bg: colors.ui.warning + '20', text: colors.ui.warning },
    error: { bg: colors.ui.error + '20', text: colors.ui.error },
    reward: { bg: colors.ui.gold + '20', text: colors.ui.gold },
};

function ToastItem({ toast }: { toast: Toast }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();

        // Fade out before removal
        const fadeTimer = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }, toast.durationMs - 400);

        return () => clearTimeout(fadeTimer);
    }, []);

    const toastColors = TOAST_COLORS[toast.type];

    return (
        <Animated.View
            style={[
                styles.toast,
                { backgroundColor: toastColors.bg, opacity, transform: [{ translateY }] },
            ]}
        >
            {toast.icon && <Text style={styles.toastIcon}>{toast.icon}</Text>}
            <Text style={[styles.toastText, { color: toastColors.text }]}>
                {toast.message}
            </Text>
        </Animated.View>
    );
}

/**
 * Toast container — add to root layout.
 */
export function ToastContainer() {
    const toasts = useToastStore(s => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.full,
        marginBottom: spacing.sm,
        maxWidth: width * 0.85,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    toastIcon: {
        fontSize: 16,
    },
    toastText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semiBold,
    },
});
