import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';

export default function OnboardingLayout() {
    const { colors } = useTheme();

    return (
        <Stack screenOptions={ {
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
        } } >
            <Stack.Screen name="index" />
            <Stack.Screen name="sessions" />
            <Stack.Screen name="explanation" />
            <Stack.Screen name="reminders" />
            <Stack.Screen name="success" />
        </Stack>
    );
}
