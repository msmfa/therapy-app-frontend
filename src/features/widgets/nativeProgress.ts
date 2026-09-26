import { NativeModules, Platform } from 'react-native';
import type { ProgressTimeline } from './progressModel';

type Bridge = {
    setOwner: (owner: string | null) => void;
    write: (owner: string, json: string) => Promise<void>;
};
const bridge = (): Bridge | undefined => Platform.OS === 'ios' ? NativeModules.ProgressWidgetBridge : undefined;
export const hasProgressWidget = () => Boolean(bridge());
export const setProgressOwner = (owner: string | null) => bridge()?.setOwner(owner);
export const writeProgressWidget = (owner: string, data: ProgressTimeline) =>
    bridge()?.write(owner, JSON.stringify(data)) ?? Promise.resolve();
