import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';

const widgetImages = {
    en: {
        small_light: require('../../../assets/widgets/widget-en-small-light.png'),
        small_dark: require('../../../assets/widgets/widget-en-small-dark.png'),
        medium_light: require('../../../assets/widgets/widget-en-medium-light.png'),
        medium_dark: require('../../../assets/widgets/widget-en-medium-dark.png'),
    },
    de: {
        small_light: require('../../../assets/widgets/widget-de-small-light.png'),
        small_dark: require('../../../assets/widgets/widget-de-small-dark.png'),
        medium_light: require('../../../assets/widgets/widget-de-medium-light.png'),
        medium_dark: require('../../../assets/widgets/widget-de-medium-dark.png'),
    },
    fr: {
        small_light: require('../../../assets/widgets/widget-fr-small-light.png'),
        small_dark: require('../../../assets/widgets/widget-fr-small-dark.png'),
        medium_light: require('../../../assets/widgets/widget-fr-medium-light.png'),
        medium_dark: require('../../../assets/widgets/widget-fr-medium-dark.png'),
    },
    es: {
        small_light: require('../../../assets/widgets/widget-es-small-light.png'),
        small_dark: require('../../../assets/widgets/widget-es-small-dark.png'),
        medium_light: require('../../../assets/widgets/widget-es-medium-light.png'),
        medium_dark: require('../../../assets/widgets/widget-es-medium-dark.png'),
    },
};

export function WidgetExample({ small = false, style }: { small?: boolean; style?: StyleProp<ViewStyle> }) {
    const { t, i18n } = useTranslation('settings');
    const { scheme } = useTheme();
    const language = (i18n.resolvedLanguage ?? 'en').split('-')[0];
    const images = widgetImages[language as keyof typeof widgetImages] ?? widgetImages.en;
    const imageKey = `${small ? 'small' : 'medium'}_${scheme === 'dark' ? 'dark' : 'light'}` as keyof typeof images;
    return (
        <View style={[styles.example, { width: small ? 170 : 340, shadowColor: scheme === 'dark' ? '#000000' : '#667788', shadowOpacity: scheme === 'dark' ? 0.45 : 0.24 }, style]}>
            <Image
                source={images[imageKey]}
                accessibilityLabel={t(small ? 'widget.smallDescription' : 'widget.mediumDescription')}
                accessible
                accessibilityRole="image"
                resizeMode="contain"
                style={{ width: '100%', height: small ? 170 : 340 * 170 / 364 }}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    example: {
        gap: 10,
        maxWidth: '100%',
        borderRadius: 25,
        shadowOffset: { width: 0, height: 9 },
        shadowRadius: 14,
        elevation: 8,
    },
});
