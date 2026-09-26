import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SettingsPageShell } from '../settings/SettingsPageShell';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { useTheme } from '../../context/theme';

export function WidgetGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('settings');
    const { theme } = useTheme();
    const { fontScale } = useWindowDimensions();
    const badgeInk = theme.scheme === 'dark' ? '#A7BED2' : '#4E687E';
    const badgeFill = theme.scheme === 'dark' ? '#283746' : '#E3EBF2';
    const badgeSize = Math.max(32, Math.ceil(24 * fontScale + 8));
    const [smallPreview, setSmallPreview] = useState(false);
    return (
            <View style={[styles.root, { backgroundColor: theme.ground.base }]}>
                <SettingsPageShell key={`widget-text-scale-${fontScale}`} title={t('widget.title')} onBack={onBack} background="grid">
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                        <AppText variant="h1" accessibilityRole="header">{t('widget.intro')}</AppText>
                        <View style={[styles.sizePicker, fontScale > 1.4 && styles.sizePickerStacked]}>
                            {[true, false].map(small => (
                                <GlassPillButton
                                    key={String(small)}
                                    label={`${small === smallPreview ? '✓ ' : ''}${t(small ? 'widget.small' : 'widget.medium').toLocaleUpperCase()}`}
                                    labelSize={13}
                                    accessibilityLabel={t(small ? 'widget.small' : 'widget.medium')}
                                    selected={small === smallPreview}
                                    onPress={() => setSmallPreview(small)}
                                    labelColor={small === smallPreview ? theme.ink.primary : theme.scheme === 'dark' ? '#9A9DA0' : '#555B60'}
                                    fillColor={small === smallPreview ? undefined : theme.scheme === 'dark' ? '#292D31' : '#D1D5D8'}
                                    rim={small === smallPreview ? undefined : null}
                                    height={Math.max(48, 32 * fontScale + 16)}
                                    style={[fontScale <= 1.4 && styles.sizeOption, small !== smallPreview && { shadowOpacity: 0, elevation: 0 }]}
                                />
                            ))}
                        </View>
                        <View style={styles.previews}>
                            <WidgetExample small={smallPreview} />
                        </View>
                        <AppText variant="h3" accessibilityRole="header">{t('widget.how')}</AppText>
                        <View style={styles.instructions}>
                            {(['step1', 'step2', 'step3'] as const).map((key, index) => (
                                <View key={key} accessible accessibilityRole="text" accessibilityLabel={`${index + 1}. ${t(`widget.${key}`)}`} style={[styles.instructionCard, {
                                    backgroundColor: theme.surface.medium,
                                    borderColor: theme.surface.rowBorder,
                                    borderTopColor: theme.surface.cardEdge,
                                    shadowColor: theme.surface.cardShadow,
                                    shadowOffset: theme.scheme === 'dark' ? theme.surface.shadowOffset : { width: 0, height: 22 },
                                    shadowOpacity: theme.scheme === 'dark' ? theme.surface.cardShadowOpacity : 0.1,
                                    shadowRadius: theme.scheme === 'dark' ? theme.surface.shadowRadius : 40,
                                }]}>
                                    <View style={[styles.instructionNumberBadge, {
                                        width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2,
                                        backgroundColor: badgeFill,
                                        borderColor: badgeInk,
                                        shadowColor: theme.surface.cardShadow,
                                    }]}>
                                        <AppText variant="h3" style={{ color: badgeInk }}>{index + 1}</AppText>
                                    </View>
                                    <AppText variant="bodySecondary" style={styles.stepText}>{t(`widget.${key}`)}</AppText>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </SettingsPageShell>
            </View>
    );
}

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

function WidgetExample({ small = false }: { small?: boolean }) {
    const { t, i18n } = useTranslation('settings');
    const { scheme } = useTheme();
    const language = (i18n.resolvedLanguage ?? 'en').split('-')[0];
    const images = widgetImages[language as keyof typeof widgetImages] ?? widgetImages.en;
    const imageKey = `${small ? 'small' : 'medium'}_${scheme === 'dark' ? 'dark' : 'light'}` as keyof typeof images;
    return (
        <View style={[styles.example, { width: small ? 170 : 340, shadowColor: scheme === 'dark' ? '#000000' : '#667788', shadowOpacity: scheme === 'dark' ? 0.45 : 0.24 }]}>
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

export function WidgetDiscoveryCard({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
    const { t } = useTranslation('settings');
    const { theme } = useTheme();
    return (
        <View style={[styles.offer, { backgroundColor: theme.surface.soft }]}>
            <View style={styles.offerHeading}>
                <AppText variant="h3" style={styles.stepText}>{t('widget.headline')}</AppText>
                <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel={t('widget.dismiss')} style={styles.close}>
                    <Feather name="x" size={20} color={theme.ink.primary} />
                </Pressable>
            </View>
            <AppText variant="body">{t('widget.offer')}</AppText>
            <Pressable onPress={onOpen} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.ink.primary }]}>
                <AppText variant="body" style={{ color: theme.ground.base }}>{t('widget.how')}</AppText>
            </Pressable>
        </View>
    );
}
const styles = StyleSheet.create({
    root: { flex: 1 }, scroll: { flex: 1, minHeight: 0 }, content: { paddingHorizontal: 12, paddingBottom: 36, gap: 18 },
    sizePicker: { flexDirection: 'row', gap: 12 }, sizePickerStacked: { flexDirection: 'column' }, sizeOption: { flexGrow: 1, flexBasis: 0 },
    previews: { minHeight: 192, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }, example: { gap: 10, maxWidth: '100%', borderRadius: 25, shadowOffset: { width: 0, height: 9 }, shadowRadius: 14, elevation: 8 },
    instructions: { gap: 10 },
    instructionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, elevation: 24 },
    instructionNumberBadge: { flexShrink: 0, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 4 },
    stepText: { flex: 1 },
    offer: { borderRadius: 22, padding: 18, gap: 12, marginBottom: 16 }, offerHeading: { flexDirection: 'row', alignItems: 'center' },
    close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, button: { borderRadius: 22, padding: 14, alignItems: 'center' },
});
