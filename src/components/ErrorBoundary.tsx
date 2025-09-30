import { ErrorBoundaryProps } from "expo-router";
import { View, StyleSheet, Text } from "react-native";

// TODO: update the styles to match app theme
export function ErrorBoundaryUI({ error, retry }: ErrorBoundaryProps) {
    return (
        <View style={ styles.container }>
            <Text>{ error.message }</Text>
            <Text onPress={ retry }>Try Again?</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
