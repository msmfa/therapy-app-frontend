import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
	topColor?: string; // color above the curve
	bottomColor?: string; // color below the curve
	centerPercent?: number; // vertical position of split (0..100)
	ampPercent?: number; // wave amplitude in % of height
	widthEasePercent?: number; // how wide/soft the hump is (bigger = softer)
};

export default function MiddleSplitBackground({
	topColor = '#F7E4EA', // blue
	bottomColor = '#E6EFF7', // red
	centerPercent = 66.6,
	ampPercent = 3, // smaller = flatter
	widthEasePercent = 18, // larger = softer, fewer “tips”
}: Props) {
	const y = Math.max(0, Math.min(100, centerPercent));
	const A = ampPercent; // vertical amplitude
	const dx = widthEasePercent; // horizontal control spacing

	// Smooth single ripple: start at left, one gentle up/down to the right
	// Use C for first curve, then S (smooth) to auto-mirror control point.
	// This removes sharp joins.
	const wave = `
    M 0 ${y}
    C ${dx} ${y - A}, ${50 - dx} ${y - A}, 50 ${y}
    S ${100 - dx} ${y + A}, 100 ${y}
  `;

	return (
		<Svg
			pointerEvents="none"
			style={StyleSheet.absoluteFill}
			width="100%"
			height="100%"
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
		>
			{/* Top fill */}
			<Path d={`${wave} L 100 0 L 0 0 Z`} fill={topColor} />

			{/* Bottom fill */}
			<Path d={`${wave} L 100 100 L 0 100 Z`} fill={bottomColor} />
		</Svg>
	);
}
