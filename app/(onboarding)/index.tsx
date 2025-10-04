import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { Button } from '../../src/components/ui/button';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import brainIllustration from '../../assets/illustrations/brain-red.svg';
import AppText from '../../src/components/ui/typography';

const ILLUSTRATION_SIZE = 740;
const brainIllustrationSource = Image.resolveAssetSource(brainIllustration);
const brainIllustrationUri = brainIllustrationSource?.uri ?? null;

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.container } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            { brainIllustrationUri && (
                <View style={ styles.illustrationContainer }>
                    <SvgUri uri={ brainIllustrationUri } width={ ILLUSTRATION_SIZE } height={ ILLUSTRATION_SIZE } />
                </View>
            ) }
            <View style={ styles.content }>
                <AppText variant='h1' >
                    Welcome
                </AppText>
                <AppText variant='body'>
                    Let's get you set up with a few quick clicks
                </AppText>
                <AppText variant='body'>
                    On the next screen you can add your weekly therapy sessions
                </AppText>
                <AppText variant='body'>
                    This will let us calculate when the best time to notify you
                </AppText>
            </View>
            <Button
                addedStyles={ styles.button }
                label={ 'Get Started' }
                onPress={ () => router.push('/(onboarding)/sessions') }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
        paddingBottom: 290,
    },
    content: {
        position: 'absolute',
        bottom: 170,
        left: 20,
        right: 20,
        flex: 1,
    },
    button: {
        position: 'absolute',
        bottom: 50,
        width: '90%',
    },
});
