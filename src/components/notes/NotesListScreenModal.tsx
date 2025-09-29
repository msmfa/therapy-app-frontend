import { Modal, ScrollView, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Note } from "../../hooks/useNotes";

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
                <ScrollView contentContainerStyle={ styles.modalContent }>
                    <View>
                        <Text style={ styles.modalDate }>
                            { note &&
                            new Date(note.createdAt).toLocaleString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            }) }
                        </Text>
                        <Text style={ styles.modalText }>{ note?.text }</Text>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={ styles.modalClose }
                    onPress={ onClose }
                    hitSlop={ { top: 12, right: 12, bottom: 12, left: 12 } }
                >
                    <Text style={ styles.modalCloseText }>Close</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: '#fff' },
    modalContent: { padding: 24, paddingBottom: 120, paddingTop: 60 },
    modalClose: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        borderRadius: 16,
        backgroundColor: '#111',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalDate: {
        fontSize: 14,
        color: 'black',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    modalText: {
        fontSize: 18,
        lineHeight: 28,
        color: 'black',
        marginHorizontal: 5,
    },
});
