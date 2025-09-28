import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';

type Ctx = {
	hydrated: boolean;
	hasOnboarded: boolean;
	finishOnboarding: () => Promise<void>;
	resetOnboarding: () => Promise<void>;
};

const ONBOARDING_PREFIX = 'onboarding:v1:';
const OnboardingContext = createContext<Ctx | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
	const [hydrated, setHydrated] = useState(false);
	const [hasOnboarded, setHasOnboarded] = useState(false);
	const { user } = useAuth();

	// Reset onboarding state when user changes
	useEffect(() => {
		if (!user) {
			// No user, reset to not onboarded
			setHasOnboarded(false);
			setHydrated(true);
			return;
		}

		// Load onboarding state for this specific user
		(async () => {
			try {
				const key = `${ONBOARDING_PREFIX}${user.id}`;
				const v = await AsyncStorage.getItem(key);
				setHasOnboarded(v === '1');
			} catch (error) {
				console.error('Failed to load onboarding state:', error);
			} finally {
				setHydrated(true);
			}
		})();
	}, [user]); // Re-run when user changes

	const finishOnboarding = async () => {
		if (!user) return;
		const key = `${ONBOARDING_PREFIX}${user.id}`;
		await AsyncStorage.setItem(key, '1');
		setHasOnboarded(true);
	};

	const resetOnboarding = async () => {
		if (!user) return;
		const key = `${ONBOARDING_PREFIX}${user.id}`;
		await AsyncStorage.removeItem(key);
		setHasOnboarded(false);
	};

	return (
  <OnboardingContext.Provider
    value={ { hydrated, hasOnboarded, finishOnboarding, resetOnboarding } }
		>
    { children }
  </OnboardingContext.Provider>
	);
}

export const useOnboarding = () => {
	const ctx = useContext(OnboardingContext);
	if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
	return ctx;
};
