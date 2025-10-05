import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { GradientUpwards } from '../GradientUpwards';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import AppText from '../ui/AppText';
import brainElastic from '../../../assets/illustrations/brain-elastic.svg';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import { COLOR_VARIANTS, colors } from 'new-design';

const ILLUSTRATION_SIZE = 670;

export default function EmptyNotesScreen() {
    const router = useRouter();
    const { nextSession, loading } = useTherapySessions();

    if (!nextSession && !loading) {
        return null;
    }

    const nextSessionDate = nextSession
        ? dayjs(nextSession.startsAtUtc).format('dddd, MMM D [at] h:mm A')
        : null;

    const handleOpenNoteTakingArticle = () => {
        router.push('/how-to-take-notes');
    };

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View pointerEvents='none' style={ styles.brainIllustration }>
                <View style={ styles.illustrationContainer }>
                    <Image
                        source={ brainElastic }
                        style={ styles.illustration }
                        contentFit='contain'
                    />
                </View>
            </View>
            <View style={ styles.emptyContainer }>
                <AppText variant='body'>
                    Your next session is { nextSessionDate }
                </AppText>
                <Spacer variant={ SpacerVariant.small } />
                <AppText variant='h2'>
                    We'll send you a notification just after your session so you can take down your first note
                </AppText>
                <Spacer variant={ SpacerVariant.small } />


                <View style={ styles.bottomText }>
                    <View style={ styles.bottomTextLine } />
                    <View style={ styles.bottomTextContent }>
                        <AppText variant='bodySecondary'>
                            If you want to get started now, you can create your first note by tapping the plus icon in the bottom left
                        </AppText>
                        <AppText variant='bodySecondary'>
                            However we recommend you read a little about what kind of{ ' ' }
                            <AppText
                                variant='bodySecondary'
                                onPress={ handleOpenNoteTakingArticle }
                                accessibilityRole='link'
                                style={ styles.bottomTextLink }
                            >
                                note taking is best for therapy sessions
                            </AppText>
                        </AppText>
                    </View>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
        paddingBottom: 260,
    },
    illustration: {
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
    },
    bottomText: {
        marginTop: 'auto',
        marginBottom: 24,
        gap: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bottomTextLine: {
        width: 1,
        borderRadius: 999,
        backgroundColor: colors.textMuted,
        alignSelf: 'stretch',
    },
    bottomTextContent: {
        flex: 1,
        gap: 8,
    },
    root: {
        flex: 1,
    },
    brainIllustration: {
        position: 'absolute',
        top: 180,
        bottom: 0,
        left: -150,
        right:  90,
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    bottomTextLink: {
        color: COLOR_VARIANTS.blue.dark,
    },
});
