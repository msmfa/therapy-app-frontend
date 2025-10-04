import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { Palette } from '../../design';

export default function TabsLayout() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
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
                headerStyle: { backgroundColor: '#00000000' },
                headerShadowVisible: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    paddingVertical: 16,
                    height: 76,
                    // make the tab completely transparent
                    backgroundColor: '#DBE0E4',
                },
                tabBarActiveTintColor: Palette.maroon,
                // tabBarInactiveTintColor: '#888888',
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
                        <Ionicons name="settings-outline" color={ color } size={ 24 } />
                    ),
                } }
            />
        </Tabs>
    );
}
