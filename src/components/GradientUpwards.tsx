import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { colors } from '../../new-design';

export function GradientUpwards() {
    return (
        <LinearGradient
            colors={ ['#FF777C', '#F6B7B9FF', '#F0C7CAFF', '#E1E6EA', '#E1E6EA', colors.bgGradientBottom] }
            start={ { x: 0.5, y: 0 } }
            end={ { x: 0.5, y: 1 } }
            style={ styles.backgroundGradient }
        />


    );
}

const styles = StyleSheet.create({
    backgroundGradient: StyleSheet.absoluteFillObject,
});
