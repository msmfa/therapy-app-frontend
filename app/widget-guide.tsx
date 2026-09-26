import React from 'react';
import { useRouter } from 'expo-router';
import { WidgetGuide } from '../src/components/widgets/WidgetGuide';

export default function WidgetGuideScreen() {
    const router = useRouter();
    return <WidgetGuide onBack={() => router.back()} />;
}
