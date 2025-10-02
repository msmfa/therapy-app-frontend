import { View, StyleSheet } from "react-native";

enum SpacerVariant {
    small = 8,
    medium = 16,
    large = 24,
}

type SpacerProps = {
    variant?: SpacerVariant.small | SpacerVariant.medium | SpacerVariant.large;
}

export default function Spacer({ variant = SpacerVariant.medium }: SpacerProps) {
    return <View style={ [styles.spacer, { height: variant }] } />
}

const styles = StyleSheet.create({
    spacer: { height: 16 },
})
