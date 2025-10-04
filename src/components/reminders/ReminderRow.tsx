import { View, StyleSheet, TouchableOpacity } from "react-native";
import { GradientRow } from "../ui/GradientRow";
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { AppModal } from "../Modal";
import { ReminderType } from "../../utils/types";
import { ScienceTextModal } from "../ScienceTextModal";
import AppText from "../ui/typography";
import Spacer, { SpacerVariant } from "../ui/Spacer";

type Props = {
    date: string;
    description: string;
    link: ReminderType;
}

export function ReminderRow ({ date, description, link }: Props) {
    const [openModal, setOpenModal] = useState<ReminderType | null>(null);
    console.log("props", { date, description, link });
    return (
        <GradientRow>
            <View style={ styles.container }>
                <AppText variant="h2" >
                    { date }
                </AppText>
                <AppText variant="bodySecondary" align="left" >
                    { description }
                </AppText>
                <Spacer variant={ SpacerVariant.large } />
                <Spacer variant={ SpacerVariant.small } />
            </View>
            <TouchableOpacity style={ styles.bottomContainer } onPress={ () => { setOpenModal(link) } }>
                <AppText variant="caption">
                    Learn More
                </AppText>
                <Ionicons name={  'arrow-forward-outline' } size={ 20 } color="#666666" />
            </TouchableOpacity>
            { /* // todo: add the science behind this pages */ }
            { openModal && (
                <AppModal isVisible={ true } onClose={ () => setOpenModal(null) }>
                    <ScienceTextModal type={ openModal } />
                </AppModal>
            ) }
        </GradientRow>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF99',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 8,

    }
});
