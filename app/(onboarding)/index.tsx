import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/button';
import { GradientUpwards } from '../../src/components/GradientUpwards';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.container } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View style={ styles.content }>
                <Text style={ styles.title }>Welcome</Text>
                <Text style={ styles.subtitle }>Let's get you set up. On the next screen you can add your weekly therapy sessions so we can calcuate when the best time to notify you is.</Text>
                <Button label={ 'Get Started' } onPress={ () => router.push('/(onboarding)/sessions') }  />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        gap: 20,
    },
    content: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 15,
        color : '#282525ff',
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
    },
});
