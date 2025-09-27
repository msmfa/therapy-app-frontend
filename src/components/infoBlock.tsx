import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../const';

interface Props {
	text: string;
	icon: string;
}
export function InfoBlock({ text, icon }: Props) {
	return (
		<View style={styles.wrapper}>
			<Text style={styles.icon}>{icon}</Text>
			<Text style={styles.text}>{text}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flexDirection: 'row',
		backgroundColor: Colors.LightBlue,
		padding: 12,
		borderRadius: 10,
		marginBottom: 16,
		alignItems: 'center',
		gap: 10,
		borderColor: Colors.DarkBlue,
		borderWidth: 2,
	},
	icon: {
		fontSize: 20,
	},
	text: {
		flex: 1,
		fontSize: 13,
		color: '#0066cc',
		lineHeight: 18,
	},
});
