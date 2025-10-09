import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AppText from "./ui/AppText";
import { COLOR_VARIANTS, COMPONENT_COLORS, PALETTE } from 'designs/designs-colors';

type Props = {
    text: string;
    onPress: () => void;
}

export function SettingsRow({ text, onPress }: Props) {
    return (
        <TouchableOpacity onPress={ onPress } style={ styles.wrapper }>
            <AppText numberOfLines={ 3 }  variant={ "caption" } style={ styles.text }>
                { text }
            </AppText>
            <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color={ COLOR_VARIANTS.black.secondary } />
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
        backgroundColor: COMPONENT_COLORS.settingsRowBackground,
        borderColor: PALETTE.overlay.whiteSurfaceTransparent,
        width: '100%',
        minHeight: 54,
    },
    text: {
        width: '90%',
    },
})
