import * as React from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useOnFocus(effect: () => void | (() => void), deps: React.DependencyList = []) {
	const memo = React.useCallback(effect, deps);
	useFocusEffect(memo);
}
