import { Text, ScrollView } from "react-native";
import { ReminderType } from "../utils/types";
import { SafeAreaView } from 'react-native-safe-area-context';


type Props = {
     type: ReminderType;
}

export function ScienceTextModal({ type }: Props) {
    const { title } = scienceTypeToText[type];
    return (
        <SafeAreaView>
            <ScrollView>
                <Text>{ title }</Text>
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

