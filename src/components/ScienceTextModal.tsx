import { ScrollView } from "react-native";
import { ReminderType } from "../utils/types";
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from "./ui/AppText";


type Props = {
     type: ReminderType;
}

export function ScienceTextModal({ type }: Props) {
    const { title } = scienceTypeToText[type];
    return (
        <SafeAreaView>
            <ScrollView>
                <AppText color="#111111" weight="semibold">
                    { title }
                </AppText>
            </ScrollView>
        </SafeAreaView>
    )
}

// fill this in later with actual science desriptions and links
const scienceTypeToText: Record<ReminderType, { title: string }> = {
    [ReminderType.EarlyConsolidation]: { title: 'Early Consolidation' },
    [ReminderType.SleepDependentConsolidation]: { title: 'Sleep Dependent Consolidation' },
    [ReminderType.SpacedReactivation]: { title: 'Spaced Reactivation' },
    [ReminderType.StateReinstatement]: { title: 'State Reinstatement' },
};
