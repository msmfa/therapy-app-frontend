import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { colors, gradients, palette } from '../../new-design';

export default function TabsLayout() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={ {
                animation: 'shift', // or 'shift'
                transitionSpec: {
                    animation: 'timing',
                    config: {
                        duration: 250,
                    },
                },
                headerShown: false,
                headerTitleAlign: 'center',
                headerTransparent: true,
                headerStyle: { backgroundColor: palette.neutral.transparentTransparent },
                headerShadowVisible: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    paddingVertical: 16,
                    height: 76,
                    backgroundColor: gradients.background.bottom,
                },
                tabBarActiveTintColor: colors.text,
                tabBarInactiveTintColor: colors.textDisabled,
                tabBarShowLabel: false,
            } }
        >
            <Tabs.Screen
                name="index"
                options={ {
                    headerShown: false, // 👈 hide tab header to prevent overlap
                    title: 'New Note',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="add" color={ color } size={ 24 } />
                    ),
                } }
            />
            <Tabs.Screen
                name="calendar"
                options={ {
                    headerShown: false,
                    title: 'Calendar',
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
                    title: 'Notes',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="book-outline" color={ color } size={ 24 } />
                    ),
                } }
            />
            <Tabs.Screen
                name="settings"
                options={ {
                    headerShown: false,
                    title: 'Settings',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="person-outline" color={ color } size={ 24 } />
                    ),
                } }
            />
        </Tabs>
    );
}
