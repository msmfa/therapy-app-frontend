import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { QuoteCard } from '../QuoteCard';
import { QuoteMark } from '../QuoteMark';
import { onboardingStyles } from '../onboardingStyles';
import { BRAND_ORANGE } from 'designs/designs-colors';

const TESTIMONIAL = {
    quote: 'It really helps me feel ready for my own therapy sessions.',
    name: 'Catherine',
    role: 'CBT therapist',
};

describe('QuoteCard', () => {
    it('opens on the website\'s quote mark instead of typed curly quotes', () => {
        const { UNSAFE_root, getByText } = render(<QuoteCard { ...TESTIMONIAL } />);

        expect(UNSAFE_root.findAllByType(QuoteMark)).toHaveLength(1);
        // The mark carries the job the punctuation used to. Both together
        // marked the same sentence as a quotation twice.
        expect(getByText(TESTIMONIAL.quote)).toBeTruthy();
    });

    it('takes the accent block, so a stranger\'s words are not another of our cards', () => {
        const { getByTestId } = render(<QuoteCard { ...TESTIMONIAL } />);

        const flat = StyleSheet.flatten(getByTestId('quote-card').props.style) as {
            backgroundColor?: string;
            borderColor?: string;
            borderRadius?: number;
        };

        // The same block the notes screen is: brand orange, white on it.
        expect(flat.backgroundColor).toBe(BRAND_ORANGE);
        expect(flat.borderColor).toBe(BRAND_ORANGE);
        // Different colour, same shape: it is still one of the flow's cards.
        expect(flat.borderRadius).toBe(
            (StyleSheet.flatten(onboardingStyles.card) as { borderRadius: number }).borderRadius,
        );
    });

    it('sets the mark inside the sentence, so the quote wraps back under it', () => {
        const { getByTestId, UNSAFE_root } = render(<QuoteCard { ...TESTIMONIAL } />);

        // The mark is nested in the quote's own text node rather than sitting
        // in a row beside it; beside it, the sentence ran in a narrow column
        // to its right instead of wrapping under the mark.
        const quote = getByTestId('quote-row');
        expect(quote.findAllByType(QuoteMark)).toHaveLength(1);
        expect(UNSAFE_root.findAllByType(QuoteMark)).toHaveLength(1);
    });

    it('sets the role and the name together at the right-hand end', () => {
        const { getByLabelText, queryByText } = render(<QuoteCard { ...TESTIMONIAL } />);

        const line = getByLabelText(`${TESTIMONIAL.name}, ${TESTIMONIAL.role}`);
        const flat = StyleSheet.flatten(line.props.style) as {
            flexDirection?: string;
            justifyContent?: string;
        };

        expect(flat.flexDirection).toBe('row');
        // Next to each other rather than pushed to opposite edges.
        expect(flat.justifyContent).toBe('flex-end');
        expect(queryByText(/·/)).toBeNull();
    });

    it('reads the attribution as a name and a role, not right to left', () => {
        const { getByLabelText } = render(<QuoteCard { ...TESTIMONIAL } />);

        // The name is last in layout order, so without a label of its own the
        // line would be announced as the role followed by the name.
        expect(getByLabelText(`${TESTIMONIAL.name}, ${TESTIMONIAL.role}`)).toBeTruthy();
    });

    it('keeps the mark out of the reading order', () => {
        const { UNSAFE_root } = render(<QuoteCard { ...TESTIMONIAL } />);

        const markHost = UNSAFE_root.findByType(QuoteMark).parent!;
        expect(markHost.props.accessibilityElementsHidden).toBe(true);
        expect(markHost.props.importantForAccessibility).toBe('no-hide-descendants');
    });
});
