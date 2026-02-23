/**
 * Ludo: Legends — Board Theme Engine
 *
 * Runtime-swappable Skia board themes.
 * Each theme defines colors for board background, cells, home yards,
 * home columns, safe zones, and ambient particle style.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface BoardTheme {
    id: string;
    name: string;
    background: string;
    boardSurface: string;
    trackCell: string;
    trackBorder: string;
    homeYard: { red: string; green: string; yellow: string; blue: string };
    homeColumn: { red: string; green: string; yellow: string; blue: string };
    safeZone: string;
    safeZoneGlow: string;
    center: string;
    centerAccent: string;
    ambientParticle: AmbientParticleStyle;
}

export interface AmbientParticleStyle {
    type: 'none' | 'stars' | 'petals' | 'snow' | 'embers' | 'bubbles' | 'sparks' | 'dust';
    color: string;
    count: number;
    speed: number;       // pixels per frame
    sizeRange: [number, number];
}

// ─── Theme Definitions ──────────────────────────────────────────

export const BOARD_THEMES: Record<string, BoardTheme> = {
    classic: {
        id: 'classic',
        name: 'Classic',
        background: '#1A1A2E',
        boardSurface: '#FAFAFA',
        trackCell: '#F8F9FA',
        trackBorder: '#DEE2E6',
        homeYard: { red: '#FDE8E9', green: '#D4F1ED', yellow: '#FDF3DC', blue: '#D6E8F0' },
        homeColumn: { red: '#E63946', green: '#2A9D8F', yellow: '#E9C46A', blue: '#457B9D' },
        safeZone: '#FFD700',
        safeZoneGlow: '#FFD70040',
        center: '#2C2C54',
        centerAccent: '#58A6FF',
        ambientParticle: { type: 'none', color: '', count: 0, speed: 0, sizeRange: [0, 0] },
    },

    midnight_galaxy: {
        id: 'midnight_galaxy',
        name: 'Midnight Galaxy',
        background: '#0B0B1E',
        boardSurface: '#131333',
        trackCell: '#1C1C3D',
        trackBorder: '#2A2A5A',
        homeYard: { red: '#3D1520', green: '#152D28', yellow: '#3D3015', blue: '#152040' },
        homeColumn: { red: '#FF4D6D', green: '#48BFE3', yellow: '#FFD166', blue: '#7B68EE' },
        safeZone: '#BC8CFF',
        safeZoneGlow: '#BC8CFF40',
        center: '#0D0D2B',
        centerAccent: '#BC8CFF',
        ambientParticle: { type: 'stars', color: '#FFFFFF', count: 30, speed: 0.3, sizeRange: [1, 3] },
    },

    ocean: {
        id: 'ocean',
        name: 'Deep Ocean',
        background: '#032541',
        boardSurface: '#064273',
        trackCell: '#0A5C99',
        trackBorder: '#087AC0',
        homeYard: { red: '#4D2020', green: '#1D4D3E', yellow: '#4D4320', blue: '#1D3A4D' },
        homeColumn: { red: '#FF6B6B', green: '#2DD4BF', yellow: '#FBBF24', blue: '#38BDF8' },
        safeZone: '#22D3EE',
        safeZoneGlow: '#22D3EE40',
        center: '#021B35',
        centerAccent: '#22D3EE',
        ambientParticle: { type: 'bubbles', color: '#38BDF880', count: 15, speed: 0.5, sizeRange: [2, 6] },
    },

    sakura: {
        id: 'sakura',
        name: 'Sakura Garden',
        background: '#1A0D12',
        boardSurface: '#FFF5F7',
        trackCell: '#FFF0F3',
        trackBorder: '#FFB3C6',
        homeYard: { red: '#FFD6DE', green: '#D4F0E0', yellow: '#FFF0D4', blue: '#D4E4F0' },
        homeColumn: { red: '#FB6F92', green: '#57CC99', yellow: '#FFCA3A', blue: '#48CAE4' },
        safeZone: '#FB6F92',
        safeZoneGlow: '#FB6F9240',
        center: '#FFE0E6',
        centerAccent: '#FB6F92',
        ambientParticle: { type: 'petals', color: '#FFB3C680', count: 20, speed: 0.8, sizeRange: [3, 7] },
    },

    neon_city: {
        id: 'neon_city',
        name: 'Neon City',
        background: '#0A0A0A',
        boardSurface: '#141414',
        trackCell: '#1A1A1A',
        trackBorder: '#333333',
        homeYard: { red: '#2D0A0A', green: '#0A2D1A', yellow: '#2D2A0A', blue: '#0A1A2D' },
        homeColumn: { red: '#FF0055', green: '#00FF88', yellow: '#FFEE00', blue: '#00AAFF' },
        safeZone: '#FF00FF',
        safeZoneGlow: '#FF00FF40',
        center: '#0D0D0D',
        centerAccent: '#FF00FF',
        ambientParticle: { type: 'sparks', color: '#FF00FF60', count: 12, speed: 1.2, sizeRange: [1, 2] },
    },

    volcanic: {
        id: 'volcanic',
        name: 'Volcanic',
        background: '#1A0800',
        boardSurface: '#2D1508',
        trackCell: '#3D1C0A',
        trackBorder: '#5A2A10',
        homeYard: { red: '#4D1A0A', green: '#1A3D20', yellow: '#4D3A0A', blue: '#1A2A4D' },
        homeColumn: { red: '#FF4500', green: '#32CD32', yellow: '#FFD700', blue: '#1E90FF' },
        safeZone: '#FF6347',
        safeZoneGlow: '#FF634740',
        center: '#1A0500',
        centerAccent: '#FF4500',
        ambientParticle: { type: 'embers', color: '#FF4500A0', count: 25, speed: 0.6, sizeRange: [2, 4] },
    },

    arctic: {
        id: 'arctic',
        name: 'Arctic',
        background: '#0A1628',
        boardSurface: '#E8F4F8',
        trackCell: '#F0F8FF',
        trackBorder: '#B0D4E8',
        homeYard: { red: '#FFD6D6', green: '#D6FFE8', yellow: '#FFF5D6', blue: '#D6E8FF' },
        homeColumn: { red: '#FF6B8A', green: '#4ECDC4', yellow: '#FFE066', blue: '#74B9FF' },
        safeZone: '#B9F2FF',
        safeZoneGlow: '#B9F2FF60',
        center: '#C0E0F0',
        centerAccent: '#74B9FF',
        ambientParticle: { type: 'snow', color: '#FFFFFFA0', count: 35, speed: 0.4, sizeRange: [2, 5] },
    },

    royal_palace: {
        id: 'royal_palace',
        name: 'Royal Palace',
        background: '#1A0F2E',
        boardSurface: '#2A1F3E',
        trackCell: '#352A50',
        trackBorder: '#4A3F6A',
        homeYard: { red: '#4D2030', green: '#204D3A', yellow: '#4D4520', blue: '#203A4D' },
        homeColumn: { red: '#DC143C', green: '#228B22', yellow: '#FFD700', blue: '#4169E1' },
        safeZone: '#FFD700',
        safeZoneGlow: '#FFD70050',
        center: '#1A0F2E',
        centerAccent: '#FFD700',
        ambientParticle: { type: 'dust', color: '#FFD70030', count: 10, speed: 0.2, sizeRange: [1, 3] },
    },

    desert: {
        id: 'desert',
        name: 'Desert Sands',
        background: '#2B1810',
        boardSurface: '#F5DEB3',
        trackCell: '#FAEBD7',
        trackBorder: '#D2B48C',
        homeYard: { red: '#FFDDD2', green: '#D2FFE0', yellow: '#FFFDD2', blue: '#D2E8FF' },
        homeColumn: { red: '#CD5C5C', green: '#2E8B57', yellow: '#DAA520', blue: '#4682B4' },
        safeZone: '#DAA520',
        safeZoneGlow: '#DAA52050',
        center: '#D2B48C',
        centerAccent: '#DAA520',
        ambientParticle: { type: 'dust', color: '#DAA52040', count: 15, speed: 0.3, sizeRange: [1, 3] },
    },

    forest: {
        id: 'forest',
        name: 'Enchanted Forest',
        background: '#0A1A0A',
        boardSurface: '#1A2E1A',
        trackCell: '#1E3B1E',
        trackBorder: '#2D5A2D',
        homeYard: { red: '#3D1A1A', green: '#1A3D1A', yellow: '#3D3A1A', blue: '#1A2A3D' },
        homeColumn: { red: '#FF6B6B', green: '#6BCB77', yellow: '#FFD93D', blue: '#6CC4FF' },
        safeZone: '#6BCB77',
        safeZoneGlow: '#6BCB7740',
        center: '#0D1A0D',
        centerAccent: '#6BCB77',
        ambientParticle: { type: 'dust', color: '#6BCB7720', count: 18, speed: 0.2, sizeRange: [1, 4] },
    },

    cyberpunk: {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        background: '#0D0221',
        boardSurface: '#150536',
        trackCell: '#1A0742',
        trackBorder: '#2A1060',
        homeYard: { red: '#3D0A20', green: '#0A3D2A', yellow: '#3D3A0A', blue: '#0A203D' },
        homeColumn: { red: '#FF2E63', green: '#00FF9F', yellow: '#FFED00', blue: '#00D2FF' },
        safeZone: '#FF2E63',
        safeZoneGlow: '#FF2E6340',
        center: '#0D0221',
        centerAccent: '#00FF9F',
        ambientParticle: { type: 'sparks', color: '#00FF9F40', count: 20, speed: 1.0, sizeRange: [1, 2] },
    },

    steampunk: {
        id: 'steampunk',
        name: 'Steampunk',
        background: '#1A1510',
        boardSurface: '#2A2218',
        trackCell: '#3A3025',
        trackBorder: '#5A4A35',
        homeYard: { red: '#4D2A1A', green: '#1A4D30', yellow: '#4D4520', blue: '#1A354D' },
        homeColumn: { red: '#B8562E', green: '#6B8E23', yellow: '#CD853F', blue: '#4682B4' },
        safeZone: '#CD853F',
        safeZoneGlow: '#CD853F40',
        center: '#1A1510',
        centerAccent: '#CD853F',
        ambientParticle: { type: 'dust', color: '#CD853F30', count: 12, speed: 0.2, sizeRange: [1, 3] },
    },
};

// ─── Helpers ────────────────────────────────────────────────────

export function getTheme(themeId: string): BoardTheme {
    return BOARD_THEMES[themeId] ?? BOARD_THEMES.classic;
}

export function getThemeIds(): string[] {
    return Object.keys(BOARD_THEMES);
}

export function getThemeCount(): number {
    return Object.keys(BOARD_THEMES).length;
}
