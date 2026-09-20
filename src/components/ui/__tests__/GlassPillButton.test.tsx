/**
 * The pill's width can be fixed by its caller, and then the label and the two
 * shoulders share whatever that width is. The calendar footer pins both of its
 * pills to 132, which leaves 56pt between 38pt shoulders: enough for "Clear",
 * not for "Zurücksetzen" or "Enregistrer".
 *
 * These are style-contract cases, not layout ones. Jest's renderer does not run
 * Yoga, so nothing here can measure a real shoulder; what they hold is the
 * arrangement that makes the shrink well-behaved, which is the part that was
 * wrong. A shoulder that shrinks with no floor goes to zero, and at zero the
 * label meets the tip of the rounded cap, because the widest point of that
 * curve is level with the label's own centre.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { GlassPillButton } from '../GlassPillButton';

jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

const renderPill = (label = 'Zurücksetzen') =>
    render(<GlassPillButton label={ label } height={ 72 } labelSize={ 16 } onPress={ jest.fn() } />);

/**
 * The two zero-flex spacers either side of the label, found by shape rather
 * than by testID: they are presentational, and adding an id to each would put
 * test scaffolding into every pill in the app.
 */
const shoulders = () => screen.UNSAFE_getAllByType(View)
    .map((node) => StyleSheet.flatten(node.props.style as object) as Record<string, number>)
    .filter((style) => style?.flexShrink === 1 && style?.width === 38);

describe('a pill whose width its caller has fixed', () => {
    it('keeps clearance either side of the label however long the label is', () => {
        renderPill();

        const found = shoulders();
        expect(found).toHaveLength(2);
        for (const shoulder of found) {
            expect(shoulder.minWidth).toBeGreaterThan(0);
        }
    });

    it('still lets the shoulders give way, so the label is not cut off instead', () => {
        renderPill();

        for (const shoulder of shoulders()) {
            // 38 is the resting width. A floor equal to it would be padding by
            // another name, and padding is what this replaced: it cannot give
            // way, so the label wrapped mid-word rather than the gap closing.
            expect(shoulder.minWidth).toBeLessThan(shoulder.width);
        }
    });

    it('shrinks the type before it truncates, and never wraps', () => {
        renderPill();

        const label = screen.UNSAFE_getAllByType(Text)
            .find((node) => node.props.children === 'Zurücksetzen');

        expect(label?.props.numberOfLines).toBe(1);
        expect(label?.props.adjustsFontSizeToFit).toBe(true);
        expect(label?.props.minimumFontScale).toBeLessThan(1);

        const style = StyleSheet.flatten(label?.props.style as object) as Record<string, number>;
        // The label is the flexible one: without `minWidth: 0` a flex child
        // refuses to go below its content width and the shoulders never get
        // the chance to give way at all.
        expect(style.flexShrink).toBe(1);
        expect(style.minWidth).toBe(0);
    });
});
