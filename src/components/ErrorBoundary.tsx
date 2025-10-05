import { ErrorBoundaryProps } from "expo-router";
import { View, StyleSheet } from "react-native";
import AppText from './ui/AppText';

// TODO: update the styles to match app theme
export function ErrorBoundaryUI({ error, retry }: ErrorBoundaryProps) {
    return (
        <View style={ styles.container }>
            <AppText>{ error.message }</AppText>
            <AppText onPress={ retry } color="#0066CC" weight="semibold">
                Try Again?
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});
