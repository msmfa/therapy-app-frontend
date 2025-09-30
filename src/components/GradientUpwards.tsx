import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export function GradientUpwards() {
    return (
        <LinearGradient
            colors={ ['#ff777c', '#f6b7b9ff', '#f0c7caff', '#e1e6ea', '#e1e6ea', 'rgba(219, 224, 228, 1)'] }
            start={ { x: 0.5, y: 0 } }
            end={ { x: 0.5, y: 1 } }
            style={ styles.backgroundGradient }
        />


    );
}

const styles = StyleSheet.create({
    backgroundGradient: StyleSheet.absoluteFillObject,
});
