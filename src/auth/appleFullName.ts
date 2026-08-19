/**
 * Structural subset of expo-apple-authentication's
 * AppleAuthenticationFullName, kept dependency-free so this module (and its
 * tests) never resolve native Apple modules.
 */
export type AppleFullNameLike = {
    givenName?: string | null;
    familyName?: string | null;
} | null;

/**
 * Formats the name Apple hands over on the FIRST authorization only. It never
 * appears again (and is absent from the identity token), so failing to send
 * it then means the account is permanently named after its email local part,
 * which for private-relay addresses is a random string.
 */
export const formatAppleFullName = (fullName: AppleFullNameLike): string | undefined => {
    if (!fullName) {
        return undefined;
    }

    const parts = [fullName.givenName, fullName.familyName]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(' ') : undefined;
};
