import { ColorValue } from 'react-native';

export enum ReminderType {
    EarlyConsolidation = 'early-consolidation',
    SleepDependentConsolidation = 'sleep-dependent-consolidation',
    SpacedReactivation = 'spaced-reactivation',
    StateReinstatement = 'state-reinstatement',
}
export type SelectedSessions = Record<string, Date>;

export type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];