import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AppText from "./ui/AppText";
import { COLOR_VARIANTS, COMPONENT_COLORS, PALETTE } from 'designs/designs-colors';

// Label and chevron share one ink. At the lighter weight they were both set to,
// the solid glyph read darker than the type beside it.
const ROW_INK = COLOR_VARIANTS.black.primary;

type Props = {
    text: string;
    onPress: () => void;
}

export function SettingsRow({ text, onPress }: Props) {
    return (
        <TouchableOpacity onPress={ onPress } style={ styles.wrapper }>
            <AppText numberOfLines={ 3 }  variant={ "body" } style={ styles.text }>
                { text }
            </AppText>
            <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color={ ROW_INK } />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 18,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: COMPONENT_COLORS.settingsRowBackground,
        borderColor: PALETTE.overlay.whiteSurfaceTransparent,
        width: '100%',
        minHeight: 64,
    },
    text: {
        color: ROW_INK,
        width: '90%',
    },
})
