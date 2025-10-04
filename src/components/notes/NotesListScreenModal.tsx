import { Modal, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Note } from "../../hooks/useNotes";
import { GradientUpwards } from "../GradientUpwards";
import { Button } from "../ui/button";
import AppText from "../ui/typography";

type NotePreviewModalProps = {
    visible: boolean;
    note: Note | null;
    onClose: () => void;
};

export function NotePreviewModal({ visible, note, onClose }: NotePreviewModalProps) {
    return (
        <Modal
            visible={ visible }
            animationType="slide"
            // presentationStyle="fullScreen"
            onRequestClose={ onClose }
        >
            <SafeAreaView style={ styles.modalRoot }>
                <GradientUpwards />
                <ScrollView contentContainerStyle={ styles.modalContent }>
                    <View>
                        <AppText style={ styles.modalDate } color="#000000" weight="semibold">
                            { note &&
                            new Date(note.createdAt).toLocaleString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            }) }
                        </AppText>
                        <AppText style={ styles.modalText } color="#000000">
                            { note?.text }
                        </AppText>
                    </View>
                </ScrollView>
                <View style={ styles.modalClose }>
                    <Button label="Close" onPress={ onClose } />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: '#FFFFFF' },
    modalContent: { padding: 24, paddingBottom: 120, paddingTop: 60 },
    modalClose: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        borderRadius: 25,
        backgroundColor: '#111111',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalDate: {
        fontSize: 14,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    modalText: {
        fontSize: 18,
        lineHeight: 28,
        marginHorizontal: 5,
    },
});
