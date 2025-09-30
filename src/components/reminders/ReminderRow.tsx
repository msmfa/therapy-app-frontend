import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GradientRow } from "../ui/GradientRow";
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { AppModal } from "../Modal";
import { ReminderType } from "../../utils/types";
import { ScienceTextModal } from "../ScienceTextModal";

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
                <Text style={ styles.date }>{ date }</Text>
                <Text style={ styles.description }>{ description }</Text>
            </View>
            <TouchableOpacity style={ styles.bottomContainer } onPress={ () => { setOpenModal(link) } }>
                <Text style={ styles.bottomContainerText }>{ 'Learn More' }</Text>
                <Ionicons name={  'arrow-forward-outline' } size={ 20 } color="#666" />
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
    date: {
        marginBottom: 6,
        fontSize: 18,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        color: '#494848ff',
        // same height as bottomContainer
        marginBottom: 40,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        flex:1,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    }
    ,
    bottomContainerText: {
        color: '#666',
    }
});
