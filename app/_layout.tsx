/**
 * Ludo: Legends — Root Layout (Expo Router)
 * 
 * Handles:
 * - Font loading (Inter family)
 * - Error boundary wrapping
 * - Splash screen management
 * - First-launch tutorial redirect
 */

import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors } from '../src/theme/design-system';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { getProfile } from '../src/services/StorageService';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);
    const [isFirstLaunch, setIsFirstLaunch] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    useEffect(() => {
        async function prepare() {
            try {
                // Check if this is a first launch (no profile yet)
                const profile = await getProfile();
                if (!profile) {
                    setIsFirstLaunch(true);
                }
            } catch {
                // Default to non-first-launch on error
            } finally {
                setAppReady(true);
            }
        }
        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded && appReady) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, appReady]);

    // Show loading while fonts load
    if (!fontsLoaded && !fontError) {
        return <LoadingScreen message="Loading fonts..." />;
    }

    if (!appReady) {
        return <LoadingScreen message="Preparing game..." showDice />;
    }

    return (
        <ErrorBoundary fallbackTitle="Ludo: Legends crashed" onReset={() => { }}>
            <View style={styles.container} onLayout={onLayoutRootView}>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.ui.background },
                        animation: 'fade',
                    }}
                    initialRouteName={isFirstLaunch ? 'tutorial' : 'index'}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="tutorial" />
                    <Stack.Screen name="mode-select" />
                    <Stack.Screen name="game" />
                    <Stack.Screen name="profile" />
                    <Stack.Screen name="rankings" />
                    <Stack.Screen name="shop" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="season-pass" />
                    <Stack.Screen name="share" />
                </Stack>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
});
