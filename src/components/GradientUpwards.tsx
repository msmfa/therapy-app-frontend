import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { gradients } from '../../new-design';

export function GradientUpwards() {
    return (
        <LinearGradient
            colors={ [...gradients.appBackground] }
            start={ { x: 0.5, y: 0 } }
            end={ { x: 0.5, y: 1 } }
            style={ styles.backgroundGradient }
        />


    );
}

const styles = StyleSheet.create({
    backgroundGradient: StyleSheet.absoluteFillObject,
});
