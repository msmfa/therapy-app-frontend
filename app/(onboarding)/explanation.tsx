import React, { JSX } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';
import AppText from '../../src/components/ui/typography';
import brainIllustration from '../../assets/illustrations/brain-string.svg';
import { Image } from 'expo-image';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';

export default function ExplanationScreen(): JSX.Element {
    const router = useRouter();

    const handleNext = () => {
        router.push('/(onboarding)/reminders');
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <View style={ styles.imageContainer }>
                    <Image
                        source={ brainIllustration }
                        style={ styles.brainImage }
                        contentFit='contain'
                    />
                </View>
                <View style={ styles.footer }>
                    <AppText variant='h1' >
                        How we calculate your reminders
                    </AppText>
                    <Spacer />

                    <AppText variant='body'>
                        We use principles from psychotherapy and neurocognitive science to calculate the most effective times to nudge you to reflect on your last therapy session
                    </AppText>
                    <Spacer />

                    <AppText variant='body'>
                        Each reminder has a different purpose. Click next to see what dates we've picked for you and the science behind how each reminder works and how they help change your brain over time
                    </AppText>
                    <Spacer variant={ SpacerVariant.large } />
                    <Spacer variant={ SpacerVariant.large } />
                    <View>
                        <Button label='Next' onPress={ handleNext } />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: -200,
        left: 0,
        right: 0,
    },
    brainImage: {
        width: 650,
        height: 650,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
});
