import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWidgetDiscovery } from '../useWidgetDiscovery';
const originalOS = Platform.OS;
const versionDescriptor = Object.getOwnPropertyDescriptor(Platform, 'Version');
beforeEach(async () => {
    Platform.OS = 'ios';
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => '26.3' });
    await AsyncStorage.clear();
});
afterAll(() => {
    Platform.OS = originalOS;
    if (versionDescriptor) Object.defineProperty(Platform, 'Version', versionDescriptor);
});
it('starts hidden, then persists eligibility after the first successful check-in', async () => {
    const { result, unmount } = renderHook(() => useWidgetDiscovery('a'));
    await act(async () => {});
    expect(result.current.visible).toBe(false);
    act(() => result.current.afterFirstCheckIn());
    await waitFor(() => expect(result.current.visible).toBe(true));
    unmount();
    const next = renderHook(() => useWidgetDiscovery('a'));
    await waitFor(() => expect(next.result.current.visible).toBe(true));
    next.unmount();
});
it('remembers dismissal even if all reviews are undone and another first review is saved', async () => {
    const { result, unmount } = renderHook(() => useWidgetDiscovery('a'));
    await act(async () => {});
    act(() => result.current.afterFirstCheckIn());
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.dismiss());
    await act(async () => {});
    act(() => result.current.afterFirstCheckIn());
    await act(async () => {});
    expect(result.current.visible).toBe(false);
    unmount();
});
it('never carries an eligible offer into another account', async () => {
    const { result, rerender, unmount } = renderHook(({ owner }) => useWidgetDiscovery(owner), { initialProps: { owner: 'a' } });
    await act(async () => {});
    act(() => result.current.afterFirstCheckIn());
    await waitFor(() => expect(result.current.visible).toBe(true));
    rerender({ owner: 'b' });
    expect(result.current.visible).toBe(false);
    await act(async () => {});
    expect(result.current.visible).toBe(false);
    unmount();
});
it('does not offer an iPhone widget on Android', async () => {
    Platform.OS = 'android';
    const { result, unmount } = renderHook(() => useWidgetDiscovery('a'));
    act(() => result.current.afterFirstCheckIn());
    await act(async () => {});
    expect(result.current.visible).toBe(false);
    unmount();
});
