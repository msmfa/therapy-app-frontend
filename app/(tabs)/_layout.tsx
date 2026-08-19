import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/auth/AuthContext';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GRADIENTS } from 'designs/designs-gradients';
import { TEST_IDS } from '../../src/constants/testIDs';

export default function TabsLayout() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <View style={ styles.root }>
            <Tabs
                initialRouteName="index"
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
                    tabBarActiveTintColor: COLOR_VARIANTS.black.quaternary,
                    tabBarInactiveTintColor: COLOR_VARIANTS.black.secondary,
                    tabBarShowLabel: false,
                } }
            >
                <Tabs.Screen
                    name="index"
                    options={ {
                        headerShown: false,
                        title: 'New Note',
                        tabBarButtonTestID: TEST_IDS.tabs.newNote,
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
                        tabBarButtonTestID: TEST_IDS.tabs.calendar,
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
                        tabBarButtonTestID: TEST_IDS.tabs.notes,
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
                        tabBarButtonTestID: TEST_IDS.tabs.settings,
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="person-outline" color={ color } size={ 24 } />
                        ),
                    } }
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: GRADIENTS.background.bottom,
    },
});
