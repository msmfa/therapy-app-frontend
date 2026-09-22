import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import RadioButton from '../RadioButton';

describe('RadioButton', () => {
    it('tells VoiceOver it is a radio and reports the selected state', () => {
        render(
            <RadioButton selectedValue onPress={ jest.fn() }>
                <Text>Every week</Text>
            </RadioButton>,
        );

        const radio = screen.getByRole('radio', { name: 'Every week' });
        expect(radio.props.accessibilityState).toMatchObject({ selected: true, checked: true });
    });

    it('reports the unselected state for an option that is not chosen', () => {
        render(
            <RadioButton selectedValue={ false } onPress={ jest.fn() }>
                <Text>This day only</Text>
            </RadioButton>,
        );

        const radio = screen.getByRole('radio', { name: 'This day only' });
        expect(radio.props.accessibilityState).toMatchObject({ selected: false, checked: false });
    });
});
