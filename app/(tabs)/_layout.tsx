import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/auth/AuthContext';
import { COLOR_VARIANTS } from 'designs/designs-colors';

export default function TabsLayout() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={ {
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
                tabBarActiveTintColor: COLOR_VARIANTS.black.quaternary,
                tabBarInactiveTintColor: COLOR_VARIANTS.black.secondary,
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
