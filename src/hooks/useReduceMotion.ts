import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the user has iOS's Reduce Motion setting on.
 *
 * Starts `false` so the first frame renders the normal, animated state;
 * `AccessibilityInfo.isReduceMotionEnabled` resolves asynchronously, so a
 * caller that only needs to skip a *decorative* animation can render once
 * and pick this up a moment later without anything flashing.
 */
export function useReduceMotion(): boolean {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let cancelled = false;

        AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            if (!cancelled) setReduceMotion(enabled);
        });

        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setReduceMotion,
        );

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, []);

    return reduceMotion;
}
