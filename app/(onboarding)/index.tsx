import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import brainIllustration from '../../assets/illustrations/brain-red.svg';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { palette } from '../../new-design';

const ILLUSTRATION_SIZE = 740;

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.container } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View style={ styles.illustrationContainer }>
                <Image
                    source={ brainIllustration }
                    style={ styles.illustration }
                    contentFit='contain'
                />
            </View>
            <View style={ styles.content }>
                <AppText variant='h1' >
                    Welcome
                </AppText>
                <Spacer />
                <AppText variant='body'>
                    Let's get you set up with a few quick clicks
                </AppText>
                <Spacer variant={ SpacerVariant.small } />

                <AppText variant='body'>
                    On the next screen you can add your weekly therapy sessions
                </AppText>
                <Spacer variant={ SpacerVariant.small } />

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
        backgroundColor: palette.neutral.white,
        alignItems: 'center',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
        paddingBottom: 290,
    },
    illustration: {
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
    },
    content: {
        position: 'absolute',
        bottom: 150,
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
