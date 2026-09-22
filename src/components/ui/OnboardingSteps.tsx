import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from './AppText';
import Spacer, { SpacerVariant } from './Spacer';
import Circle from './Circle';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

type Props = {
    steps: string[];
    title?: string;
    containerStyle?: StyleProp<ViewStyle>;
    activeStep?: number;
};

const STEP_VERTICAL_SPACING = 10;

export default function OnboardingSteps({ title, steps, activeStep }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const lineColor = theme.red.light;

    return (
        <View >
            { title && (
                <>
                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant='body'>
                        { title }
                    </AppText>
                    <Spacer variant={ SpacerVariant.medium } />
                    <View style={ styles.line } />
                </>
            ) }
            <Spacer variant={ SpacerVariant.large } />
            { steps.map((text, index) => {
                const isLast = index === steps.length - 1;
                const isActive = activeStep === index;

                return (
                    <View
                        key={ `${index}-${text}` }
                        style={ [
                            styles.stepRow,
                            isLast && styles.stepRowLast,
                        ] }
                    >
                        <View style={ styles.indicatorColumn }>
                            <View style={ styles.circleWrapper }>
                                <Circle text={ String(index + 1) } isActive={ isActive } />
                            </View>
                            <View
                                style={ [
                                    styles.indicatorTail,
                                    isLast && styles.indicatorTailLast,
                                ] }
                            />
                            { isLast && (
                                <View style={ styles.indicatorArrowWrapper }>
                                    <Feather name='arrow-down' size={ 24 } color={ lineColor } />
                                </View>
                            ) }
                        </View>
                        <AppText
                            variant={ 'caption' }
                            style={ [styles.stepText, isActive && styles.stepTextActive] }
                        >
                            { text }
                        </AppText>
                    </View>
                );
            }) }
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    line: {
        height: 1,
        backgroundColor: theme.red.mid,
        alignSelf: 'stretch',
        marginHorizontal: -20,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: STEP_VERTICAL_SPACING,
        alignItems: 'flex-start',
    },
    stepRowLast: {
        paddingBottom: 0,
    },
    indicatorColumn: {
        alignItems: 'center',
    },
    indicatorTail: {
        width: 2,
        flexGrow: 1,
        backgroundColor: theme.red.light,
        marginBottom: -STEP_VERTICAL_SPACING,
    },
    indicatorTailLast: {
        flexGrow: 0,
        height: 30,
        marginBottom: 6,
    },
    indicatorArrowWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
    },
    circleWrapper: {
        borderRadius: 999,
    },
    // disabled
    stepText: {
        flex: 1,
        color: theme.ink.tertiary,
    },
    stepTextActive: {
        color: theme.ink.primary,
    },
});
