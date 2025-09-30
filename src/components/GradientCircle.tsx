// create a gradient circle component. it should be half of a circle in the mottom right corner
// of the app
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export function GradientCircle() {
    return (
        <View style={ styles.circleContainer }>
            <LinearGradient
                colors={ [
                    'rgba(255,119,124,1)',
                    'rgba(255,119,124,0.7)',
                    'rgba(246,170,177,0.38)',
                    'rgba(225,230,234,0)'
                ] }
                locations={ [0, 0.32, 0.2, 1] }
                start={ { x: 0, y: 0.5 } }
                end={ { x: 1, y: 0.5 } }
                style={ styles.circle }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    circleContainer: {
        position: 'absolute',
        bottom: -150,
        right: -150,
        width: 300,
        height: 300,
        overflow: 'hidden',
        borderRadius: 150,
    },
    circle: {
        width: 360,
        height: 360,
        borderRadius: 180,
        marginLeft: -60,
    },


});

