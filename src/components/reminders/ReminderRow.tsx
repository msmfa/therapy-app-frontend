import { View, StyleSheet, TouchableOpacity } from "react-native";
import { GradientRow } from "../ui/GradientRow";
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { AppModal } from "../Modal";
import { ReminderType } from "../../utils/types";
import { ScienceTextModal } from "../ScienceTextModal";
import AppText from "../ui/AppText";
import Spacer, { SpacerVariant } from "../ui/Spacer";
import { colors, palette } from '../../../new-design';

type Props = {
    date: string;
    description: string;
    link: ReminderType;
}

export function ReminderRow ({ date, description, link }: Props) {
    const [openModal, setOpenModal] = useState<ReminderType | null>(null);

    return (
        <GradientRow>
            <View style={ styles.container }>
                <Spacer />
                <AppText variant="h2" >
                    { date }
                </AppText>
                <Spacer variant={ SpacerVariant.small } />

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
                <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color={ colors.textMuted } />
            </TouchableOpacity>
            { /* Placeholder: add science content pages and hook up modal copy (see TODO.md). */ }
            { openModal && (
                <AppModal isVisible={ true } onClose={ () => setOpenModal(null) }>
                    <ScienceTextModal type={ openModal } />
                </AppModal>
            ) }
            <Spacer variant={ SpacerVariant.large } />

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
        backgroundColor: palette.overlay.whiteMediumTransparent,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 10,
        paddingVertical: 8,
    }
});
