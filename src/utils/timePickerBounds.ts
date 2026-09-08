/**
 * Keep time-only pickers explicitly unbounded across the app's supported dates.
 *
 * datetimepicker 8.4.4's iOS Fabric view keeps its native picker when recycled.
 * Clearing an earlier minimum/maximumDate converts the omitted prop to epoch
 * zero, rather than nil. After using the bounded session-date picker, that can
 * make a time wheel clamp every choice to 1am in the UK. Real, wide bounds reset
 * both native constraints while leaving every hour available.
 */
export const TIME_PICKER_BOUNDS = {
    minimumDate: new Date(1900, 0, 1, 0, 0, 0),
    maximumDate: new Date(2100, 11, 31, 23, 59, 59),
};
