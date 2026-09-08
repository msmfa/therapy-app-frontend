import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    title: string;
    body: string;
    /** The relative time iOS prints at the top right, such as "now". */
    time: string;
    width: number;
    style?: StyleProp<ViewStyle>;
    onLayout?: (event: LayoutChangeEvent) => void;
};

/**
 * A picture of an iPhone notification from the app, drawn rather than
 * photographed so its words can be changed like any other copy.
 *
 * It is a likeness of system UI, not a piece of the app's own, so it is set
 * in the system font rather than the brand's: the point is that it looks like
 * the banner that will actually arrive. Read out as one thing, the way the
 * real one would be.
 */
export function NotificationBanner({ title, body, time, width, style, onLayout }: Props) {
    return (
        <View
            style={ [styles.panel, { width }, style] }
            onLayout={ onLayout }
            accessible
            accessibilityLabel={ `An iPhone notification from ${title}: ${body}` }
        >
            <Image
                source={ require('../../../assets/brain-logo.png') as ImageSourcePropType }
                style={ styles.icon }
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            />
            <View style={ styles.text }>
                <View style={ styles.titleRow }>
                    <Text style={ styles.title } numberOfLines={ 1 }>{ title }</Text>
                    <Text style={ styles.time }>{ time }</Text>
                </View>
                <Text style={ styles.body } numberOfLines={ 2 }>{ body }</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 18,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: COLOR_VARIANTS.white.primary,
        shadowColor: COLOR_VARIANTS.black.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 6,
    },
    // The app icon as iOS shows it: a rounded square, a little over a fifth
    // of its side rounded off.
    icon: {
        width: 38,
        height: 38,
        borderRadius: 9,
    },
    text: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        flexShrink: 1,
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
        color: TEXT_COLORS.primary,
    },
    time: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_COLORS.quaternary,
    },
    // Lighter than the title, so the name is what is read first and the
    // message sits under it.
    body: {
        fontSize: 15,
        lineHeight: 20,
        color: TEXT_COLORS.tertiary,
    },
});
