import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';

export default function TabsLayout() {
    const { hydrated, isAuthenticated } = useAuth();

    if (!hydrated) return null;
    if (!isAuthenticated) return <Redirect href="/login" />;

    return (
        <Tabs
            initialRouteName="note"
            screenOptions={ {
                headerTitleAlign: 'center',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    paddingVertical: 6,
                    height: 56,
                },
                tabBarActiveTintColor: '#111',
                tabBarInactiveTintColor: '#888',
                tabBarShowLabel: false,
            } }
        >
            { /* 1) New Note (your 3-step flow in /(tabs)/note) */ }
            <Tabs.Screen
                name="note"
                options={ {
                    headerShown: false, // 👈 hide tab header to prevent overlap
                    title: 'New Note',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add" color={ color } size={ size ?? 24 } />
                    ),
                } }
            />

            { /* 2) Calendar */ }
            <Tabs.Screen
                name="calendar"
                options={ {
                    headerShown: false,
                    title: 'Calendar',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={ focused ? 'calendar' : 'calendar-outline' }
                            color={ color }
                            size={ size ?? 24 }
                        />
                    ),
                } }
            />

            { /* 3) Notes list */ }
            <Tabs.Screen
                name="notes"
                options={ {
                    title: 'Notes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book-outline" color={ color } size={ size ?? 24 } />
                    ),
                } }
            />

            { /* 4) Settings */ }
            <Tabs.Screen
                name="settings"
                options={ {
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" color={ color } size={ size ?? 24 } />
                    ),
                } }
            />
        </Tabs>
    );
}
