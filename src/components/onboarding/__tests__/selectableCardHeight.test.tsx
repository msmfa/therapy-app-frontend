import { act, renderHook } from '@testing-library/react-native';
import { LayoutChangeEvent, PixelRatio, useWindowDimensions } from 'react-native';
import { useEqualSelectableCardHeights } from '../SelectableCard';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
}));

const dimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;
const layout = (height: number) => ({ nativeEvent: { layout: { height } } } as LayoutChangeEvent);

beforeEach(() => {
    dimensions.mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
});

afterEach(() => jest.restoreAllMocks());

it('does not grow when native layout echoes the applied height with floating-point noise', () => {
    const { result } = renderHook(() => useEqualSelectableCardHeights());
    act(() => result.current.onCardLayout(layout(84)));

    // The height is applied to every card and reported back on later layouts.
    // Ceil used to turn each tiny discrepancy into another full point.
    for (let pass = 0; pass < 5; pass += 1) {
        const appliedHeight = result.current.height!;
        act(() => result.current.onCardLayout(layout(appliedHeight + 0.000007)));
        expect(result.current.height).toBe(84);
    }

    // Real content growth must still get the room it needs.
    act(() => result.current.onCardLayout(layout(108)));
    expect(result.current.height).toBe(108);
});

it('remeasures when a wider screen lets labels use fewer lines', () => {
    const { result, rerender } = renderHook(() => useEqualSelectableCardHeights());
    act(() => result.current.onCardLayout(layout(108)));

    dimensions.mockReturnValue({ width: 844, height: 390, scale: 3, fontScale: 1 });
    rerender({});
    expect(result.current.height).toBeUndefined();

    act(() => result.current.onCardLayout(layout(72)));
    expect(result.current.height).toBe(72);
});
