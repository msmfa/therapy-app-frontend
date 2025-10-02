import type { Component } from 'react';

declare module 'expo-apple-authentication' {
    export interface AppleAuthenticationFullName {
        familyName?: string | null;
        givenName?: string | null;
        middleName?: string | null;
        namePrefix?: string | null;
        nameSuffix?: string | null;
        nickname?: string | null;
    }

    export interface AppleAuthenticationCredential {
        user: string;
        email: string | null;
        identityToken: string | null;
        authorizationCode: string | null;
        fullName: AppleAuthenticationFullName | null;
    }

    export enum AppleAuthenticationScope {
        FULL_NAME = 0,
        EMAIL = 1,
    }

    export enum AppleAuthenticationButtonType {
        SIGN_IN = 0,
        CONTINUE = 1,
        SIGN_UP = 2,
    }

    export enum AppleAuthenticationButtonStyle {
        WHITE = 0,
        WHITE_OUTLINE = 1,
        BLACK = 2,
    }

    export interface AppleAuthenticationSignInOptions {
        requestedScopes?: AppleAuthenticationScope[];
        state?: string;
        nonce?: string;
        clientId?: string;
        redirectUri?: string;
    }

    export interface AppleAuthenticationButtonProps {
        buttonType: AppleAuthenticationButtonType;
        buttonStyle: AppleAuthenticationButtonStyle;
        cornerRadius?: number;
        style?: any;
        disabled?: boolean;
        onPress?: () => void;
    }

    export class AppleAuthenticationButton extends Component<AppleAuthenticationButtonProps> {}

    export function isAvailableAsync(): Promise<boolean>;
    export function signInAsync(
        options: AppleAuthenticationSignInOptions,
    ): Promise<AppleAuthenticationCredential>;
}
