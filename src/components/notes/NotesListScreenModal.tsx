import { Modal, ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Note } from "../../hooks/useNotes";
import { GradientUpwards } from "../GradientUpwards";
import { Button } from "../ui/button";

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
                <View style={ styles.modalClose }>
                    <Button label="Close" onPress={ onClose } />
                </View>
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
        borderRadius: 25,
        backgroundColor: '#111',
        paddingVertical: 12,
        alignItems: 'center',
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
