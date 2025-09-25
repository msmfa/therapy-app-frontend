import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';
import { PINK_SOLID, PINK_CLEAR } from '../const';

interface GradientScreenBackgroundProps {
	children: React.ReactNode;
	showTopGradient?: boolean;
}

const TOP_OVERLAY_DEFAULT = 48;

export function GradientScreenBackground({
	children,
	showTopGradient = true,
}: GradientScreenBackgroundProps) {
	const headerHeight = useHeaderHeight();

	return (
		<View style={styles.container}>
			{children}

			{showTopGradient && (
				<LinearGradient
					pointerEvents="none"
					colors={[PINK_SOLID, PINK_CLEAR]}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={[styles.topOverlay, { height: headerHeight + TOP_OVERLAY_DEFAULT }]}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	topOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
	},
});
