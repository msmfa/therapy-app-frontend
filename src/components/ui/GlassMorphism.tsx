import { BlurView, BlurViewProps } from "expo-blur";
import { StyleProp, View, StyleSheet, ViewStyle } from "react-native";
import { COMPONENT_COLORS, PALETTE } from 'designs/designs-colors';

interface GlassProps extends BlurViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export default function GlassMorphism({ children, style, ...blurViewProps }: GlassProps) {
    return (
        <View style={[styles.glassContainer, style]}>
            <BlurView tint={ blurViewProps.tint } { ...blurViewProps } style={styles.glassPanel}>
                    { children }
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    glassContainer: {
        flex: 1,
        backgroundColor: COMPONENT_COLORS.glassBackground,
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 5,
    },
    glassPanel: {
        flex: 1,
        borderRadius: 48,
        overflow: 'hidden',
    },
});
