import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/auth/AuthContext';
import { EntitlementGate } from '../../src/features/subscription/EntitlementGate';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/theme';

export default function TabsLayout() {
    const { t } = useTranslation('common');
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        // The paid area. Being signed in and onboarded says nothing about
        // whether the subscription is still active, so the store is asked here
        // rather than trusting either flag.
        <EntitlementGate>
            <View style={ [styles.root, { backgroundColor: theme.ground.base }] }>
                <Tabs
                    initialRouteName="notes"
                    screenOptions={ {
                        lazy: false,
                        headerShown: false,
                        headerTitleAlign: 'center',
                        headerTransparent: true,
                        headerStyle: { backgroundColor: COLOR_VARIANTS.transparent },
                        headerShadowVisible: false,
                        tabBarStyle: {
                            borderTopWidth: 0,
                            elevation: 0,
                            shadowOpacity: 0,
                            paddingVertical: 16,
                            height: 76,
                            backgroundColor: 'transparent',
                            position: 'absolute',
                            left: 50,
                            right: 50,
                            bottom: 0,
                        },
                        tabBarActiveTintColor: theme.ink.quaternary,
                        tabBarInactiveTintColor: theme.ink.secondary,
                        tabBarShowLabel: false,
                    } }
                >
                    <Tabs.Screen
                        name="index"
                        options={ {
                            headerShown: false,
                            title: t('tab.newNote'),
                            tabBarIcon: ({ color }) => (
                                <Ionicons name="add" color={ color } size={ 24 } />
                            ),
                        } }
                    />
                    <Tabs.Screen
                        name="calendar"
                        options={ {
                            headerShown: false,
                            title: t('tab.calendar'),
                            tabBarIcon: ({ color }) => (
                                <Ionicons
                                    name={ 'calendar-clear-outline' }
                                    color={ color }
                                    size={ 24 }
                                />
                            ),
                        } }
                    />
                    <Tabs.Screen
                        name="notes"
                        options={ {
                            headerShown: false,
                            title: t('tab.notes'),
                            tabBarIcon: ({ color }) => (
                                <Ionicons name="book-outline" color={ color } size={ 24 } />
                            ),
                        } }
                    />
                    <Tabs.Screen
                        name="settings"
                        options={ {
                            headerShown: false,
                            title: t('tab.settings'),
                            tabBarIcon: ({ color }) => (
                                <Ionicons name="person-outline" color={ color } size={ 24 } />
                            ),
                        } }
                    />
                </Tabs>
            </View>
        </EntitlementGate>
    );
}

const styles = StyleSheet.create({
    // The ground is set where it is used: it comes from the theme and this
    // sheet is frozen at import.
    root: {
        flex: 1,
    },
});
