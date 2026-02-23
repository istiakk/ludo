/**
 * Ludo: Legends — Design System
 * 
 * Premium "quiet luxury" aesthetic tokens.
 * Inspired by polished materials, subtle depth, and confident elegance.
 * 
 * SME Agent: ui-ux-pro-max, frontend-design, mobile-design
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Colors ─────────────────────────────────────────────────────

export const colors = {
    // Player colors — rich, premium tones
    player: {
        red: '#E63946',
        redLight: '#FFA4AB',
        redDark: '#9B1B23',
        green: '#2A9D8F',
        greenLight: '#76D7C4',
        greenDark: '#1A6E63',
        yellow: '#E9C46A',
        yellowLight: '#F5DEB3',
        yellowDark: '#C29E2E',
        blue: '#457B9D',
        blueLight: '#89C2D9',
        blueDark: '#1D3557',
    },

    // Board palette
    board: {
        background: '#1A1A2E',
        surface: '#16213E',
        trackCell: '#F8F9FA',
        trackBorder: '#DEE2E6',
        homeYard: {
            red: '#FDE8E9',
            green: '#D4F1ED',
            yellow: '#FDF3DC',
            blue: '#D6E8F0',
        },
        homeColumn: {
            red: '#E63946',
            green: '#2A9D8F',
            yellow: '#E9C46A',
            blue: '#457B9D',
        },
        safeZone: '#FFD700',
        center: '#2C2C54',
    },

    // UI palette
    ui: {
        background: '#0D1117',
        surface: '#161B22',
        surfaceElevated: '#21262D',
        border: '#30363D',
        borderFocus: '#58A6FF',
        text: '#F0F6FC',
        textSecondary: '#8B949E',
        textTertiary: '#6E7681',
        accent: '#58A6FF',
        accentWarm: '#F78166',
        success: '#3FB950',
        warning: '#D29922',
        error: '#F85149',
        gold: '#FFD700',
        platinum: '#E5E4E2',
        diamond: '#B9F2FF',
    },

    // Glassmorphism
    glass: {
        light: 'rgba(255, 255, 255, 0.08)',
        medium: 'rgba(255, 255, 255, 0.12)',
        heavy: 'rgba(255, 255, 255, 0.18)',
        border: 'rgba(255, 255, 255, 0.15)',
    },
} as const;

// ─── Typography ─────────────────────────────────────────────────

export const typography = {
    fontFamily: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semiBold: 'Inter_600SemiBold',
        bold: 'Inter_700Bold',
        mono: 'Courier',
    },

    size: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
        display: 64,
    },

    lineHeight: {
        tight: 1.1,
        normal: 1.4,
        relaxed: 1.6,
    },

    weight: {
        regular: '400' as const,
        medium: '500' as const,
        semiBold: '600' as const,
        bold: '700' as const,
        extraBold: '800' as const,
    },
} as const;

// ─── Spacing ────────────────────────────────────────────────────

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
} as const;

// ─── Border Radius ──────────────────────────────────────────────

export const radii = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    }),
} as const;

// ─── Layout ─────────────────────────────────────────────────────

export const layout = {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    boardSize: Math.min(SCREEN_WIDTH - 32, SCREEN_HEIGHT * 0.55),
    cellSize: Math.min(SCREEN_WIDTH - 32, SCREEN_HEIGHT * 0.55) / 15,
    tokenSize: Math.min(SCREEN_WIDTH - 32, SCREEN_HEIGHT * 0.55) / 15 * 0.7,
    safeAreaTop: 44,
    safeAreaBottom: 34,
    tabBarHeight: 80,
} as const;

// ─── Animation ──────────────────────────────────────────────────

export const animation = {
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        dramatic: 800,
        dice: 600,
        tokenMove: 400,
        capture: 500,
        celebration: 1200,
    },
    easing: {
        // These map to Reanimated easing curves
        standard: 'easeInOut',
        enter: 'easeOut',
        exit: 'easeIn',
        spring: { damping: 15, stiffness: 150 },
        bounce: { damping: 8, stiffness: 200 },
    },
} as const;

// ─── Player Color Mapping ───────────────────────────────────────

export function getPlayerColor(color: 'red' | 'green' | 'yellow' | 'blue') {
    return {
        primary: colors.player[color],
        light: colors.player[`${color}Light`],
        dark: colors.player[`${color}Dark`],
        homeYard: colors.board.homeYard[color],
        homeColumn: colors.board.homeColumn[color],
    };
}
