import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import brainIllustration from '../../assets/illustrations/brain-elastic.svg';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassMorphismWithSquare } from 'src/components/ui/GlassMorphismWithSquare';
import { SquarePosition } from 'src/components/ui/LinearGradientSquare';

const ILLUSTRATION_SIZE = 600;

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.container } edges={ ['left', 'right', 'bottom', 'top'] }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithSquare
                    squarePosition={ SquarePosition.BOTTOM_LEFT }
                />
                <GlassMorphismWithSquare
                    squarePosition={ SquarePosition.TOP_RIGHT }
                    squareRotation='-35deg'
                />
            </View>
            <View style={ styles.content }>
                <AppText variant='h1' style={ { fontSize: 26, fontWeight: 'bold' } }>
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
            <View style={ styles.illustrationContainer }>
                <Image
                    source={ brainIllustration }
                    style={ styles.illustration }
                    contentFit='contain'
                />
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
        // backgroundColor: COLOR_VARIANTS.white.primary,
        alignItems: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
        paddingTop: 140,
    },
    illustration: {
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        top: 120,
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
