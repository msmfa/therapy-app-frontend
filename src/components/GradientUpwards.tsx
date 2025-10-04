import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export function GradientUpwards() {
    return (
        <LinearGradient
            colors={ ['#FF777C', '#F6B7B9FF', '#F0C7CAFF', '#E1E6EA', '#E1E6EA', '#DBE0E4'] }
            start={ { x: 0.5, y: 0 } }
            end={ { x: 0.5, y: 1 } }
            style={ styles.backgroundGradient }
        />


    );
}

const styles = StyleSheet.create({
    backgroundGradient: StyleSheet.absoluteFillObject,
});
