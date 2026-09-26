import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const canOfferProgressWidget = () => Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 17;
const keyFor = (owner: string) => `widgetDiscovery:v1:${encodeURIComponent(owner)}`;

export function useWidgetDiscovery(owner: string | undefined) {
    const ownerRef = useRef(owner);
    ownerRef.current = owner;
    const [offer, setOffer] = useState<{ owner: string; visible: boolean } | null>(null);
    const generation = useRef(0);
    useEffect(() => {
        const request = ++generation.current;
        if (!owner || !canOfferProgressWidget()) return;
        void AsyncStorage.getItem(keyFor(owner)).then(value => {
            if (request === generation.current && ownerRef.current === owner) setOffer({ owner, visible: value === 'eligible' });
        }).catch(() => {});
        return () => { generation.current++; };
    }, [owner]);

    const afterFirstCheckIn = useCallback(() => {
        if (!owner || ownerRef.current !== owner || !canOfferProgressWidget()) return;
        const request = ++generation.current;
        void AsyncStorage.getItem(keyFor(owner)).then(value => {
            if (request !== generation.current || ownerRef.current !== owner || value === 'dismissed') return;
            setOffer({ owner, visible: true });
            // Discovery must never turn a successful review into a failed save.
            void AsyncStorage.setItem(keyFor(owner), 'eligible').catch(() => {});
        }).catch(() => {});
    }, [owner]);
    const dismiss = useCallback(() => {
        if (!owner) return;
        generation.current++;
        setOffer({ owner, visible: false });
        void AsyncStorage.setItem(keyFor(owner), 'dismissed').catch(() => {});
    }, [owner]);
    return { visible: Boolean(offer && offer.owner === owner && offer.visible), afterFirstCheckIn, dismiss };
}
