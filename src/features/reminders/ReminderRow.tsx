import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { AppModal } from 'src/components/Modal';
import { ReminderType } from "../../utils/types";
import { ScienceTextModal } from 'src/components/ScienceTextModal';
import { REMINDER_SCIENCE_COPY } from 'src/constants/neuroReminders';
import AppText from 'src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import FrostedCard from "src/components/ui/FrostedCard";

type Props = {
    date: string;
    description: string;
    link: ReminderType;
}

export function ReminderRow ({ date, description, link }: Props) {
    const [openModal, setOpenModal] = useState<ReminderType | null>(null);

    return (
        <>
            <TouchableOpacity
                activeOpacity={ 0.85 }
                onPress={ () => setOpenModal(link) }
            >
                <FrostedCard>
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
                    <View style={ styles.bottomContainer }>
                        <AppText variant="caption">
                            Learn More
                        </AppText>
                        <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color={ COLOR_VARIANTS.black.quaternary } />
                    </View>
                    <Spacer variant={ SpacerVariant.large } />
                </FrostedCard>
            </TouchableOpacity>
            { openModal && (
                <AppModal
                    isVisible={ true }
                    title={ REMINDER_SCIENCE_COPY[openModal].title }
                    onClose={ () => setOpenModal(null) }
                >
                    <ScienceTextModal type={ openModal } />
                </AppModal>
            ) }
        </>
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
        backgroundColor: PALETTE.overlay.whiteMediumTransparent,
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
