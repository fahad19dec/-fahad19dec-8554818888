import * as SecureStore from "expo-secure-store";

import { brand } from "@/brand";

// The dev sign-in (EXPO_PUBLIC_AUTH_MODE=dev): the email the tester signed in as.
// iOS and Android keep it in the keychain/keystore; web uses session-token.web.ts.
const KEY = `${brand.slug}.devSession`;

export const readToken = () => SecureStore.getItemAsync(KEY).catch(() => null);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token).catch(() => {});
export const clearToken = () => SecureStore.deleteItemAsync(KEY).catch(() => {});
