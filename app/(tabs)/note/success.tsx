import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SuccessScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.root }>
            <View style={ styles.container }>
                <Text style={ styles.subtitle }>Your reminder has been saved.</Text>
                <View style={ styles.row }>
                    <Pressable
                        onPress={ () => router.replace('/(tabs)/note') }
                        style={ styles.secondaryBtn }
                    >
                        <Text style={ styles.secondaryBtnText }>Thanks</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1, padding: 16, gap: 12, alignItems: 'center', justifyContent: 'center' },
    subtitle: { color: '#666', marginTop: 4 },
    row: { flexDirection: 'row', gap: 12, marginTop: 12 },
    secondaryBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9BFCB',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    secondaryBtnText: { color: '#111' },
});
