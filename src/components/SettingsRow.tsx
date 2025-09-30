import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';

type Props = {
    text: string;
    onPress: () => void;
}

export function SettingsRow({ text, onPress }: Props) {
    return (
        <TouchableOpacity onPress={ onPress } style={ styles.wrapper }>
            <Text style={ styles.text }>{ text }</Text>
            <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color="#5c5252ff" />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: 'transparent',
        borderColor: '#c3b3b2ff',
        width: '100%',
        minHeight: 54,
    },
    text: {
        width: '90%',
        fontSize: 16,
        color: '#333',
    },
})
