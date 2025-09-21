import React from 'react';
import { StyleSheet, View } from 'react-native';
import RippedPaperBackground from '../components/ripped-paper-background'; // adjust path if needed

export default function FullAppBackground() {
	return (
		<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
			<RippedPaperBackground />
		</View>
	);
}
