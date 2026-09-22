import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AppText from "./ui/AppText";
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../context/theme';

type Props = {
    text: string;
    onPress: () => void;
}

export function SettingsRow({ text, onPress }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <TouchableOpacity onPress={ onPress } style={ styles.wrapper } accessibilityRole="button">
            <AppText numberOfLines={ 3 }  variant={ "body" } style={ styles.text }>
                { text }
            </AppText>
            { /* Label and chevron share one ink. At the lighter weight they
                 were both set to, the solid glyph read darker than the type
                 beside it. */ }
            <Ionicons name={ 'arrow-forward-outline' } size={ 20 } color={ theme.ink.primary } />
        </TouchableOpacity>
    )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 18,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: theme.surface.row,
        borderColor: theme.surface.rowBorder,
        width: '100%',
        minHeight: 64,
    },
    text: {
        color: theme.ink.primary,
        width: '90%',
    },
})
