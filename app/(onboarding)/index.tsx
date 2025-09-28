import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/button';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.container }>
            <View style={ styles.content }>
                <Text style={ styles.title }>Welcome!</Text>
                <Text style={ styles.subtitle }>Let's get you set up in just a few steps</Text>
            </View>
            <Button label={ 'Get Started' } onPress={ () => router.push('/(onboarding)/sessions') }  />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
});
