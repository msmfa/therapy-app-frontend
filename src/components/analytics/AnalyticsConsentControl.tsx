import React, { useRef, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import AppText from '../ui/AppText';
import { analyticsConsentSync } from '../../features/analytics/consentSync';
import { useAnalyticsConsent } from '../../features/analytics/useAnalyticsConsent';
import { isPreconsentedTestflight } from '../../features/analytics/config';
import { COLOR_VARIANTS } from 'designs/designs-colors';

/** Explicit opt-in for public releases; beta testers already consented. */
export function AnalyticsConsentControl() {
    const { hydrated, consent } = useAnalyticsConsent();
    const request = useRef(0);
    const [failed, setFailed] = useState(false);
    const [pendingSync, setPendingSync] = useState(false);

    if (isPreconsentedTestflight()) return null;

    const changeConsent = async (value: boolean) => {
        const current = ++request.current;
        setFailed(false);
        setPendingSync(false);
        try {
            const { synced } = await analyticsConsentSync.setConsent(value);
            if (request.current === current) setPendingSync(!synced);
        } catch {
            if (request.current === current) setFailed(true);
        }
    };

    return (
        <View style={ styles.container }>
            <View style={ styles.row }>
                <AppText variant="body" style={ styles.label }>Share app usage</AppText>
                <Switch
                    accessibilityLabel="Share app usage"
                    accessibilityHint="Optional analytics with PostHog. Your note contents are never shared."
                    value={ consent }
                    disabled={ !hydrated }
                    onValueChange={ (value) => void changeConsent(value) }
                />
            </View>
            <AppText variant="caption" style={ styles.description }>
                Help improve Plastic Brains with optional PostHog analytics. Your note contents and appointment details are never shared. Change this in Settings at any time.
            </AppText>
            { failed && (
                <AppText variant="caption" accessibilityLiveRegion="polite">
                    Could not save this preference. Please try again.
                </AppText>
            ) }
            { pendingSync && (
                <AppText variant="caption" accessibilityLiveRegion="polite">
                    Saved on this device. Your account preference will sync when you reconnect.
                </AppText>
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 6, paddingVertical: 12, paddingHorizontal: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    label: { flex: 1, color: COLOR_VARIANTS.black.primary },
    description: { color: COLOR_VARIANTS.black.secondary },
});
