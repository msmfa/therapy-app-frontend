import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export function Index() {
	const { hydrated, user } = useAuth();
	if (!hydrated) return null; // or a splash
	return <Redirect href={user ? '/(tabs)/note' : '/(auth)/login'} />;
}
