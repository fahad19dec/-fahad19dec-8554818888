import * as SecureStore from "expo-secure-store";

import { brand } from "@/brand";

// The admin's sign-in token. iOS and Android keep it in the keychain/keystore;
// web uses admin-token.web.ts.
const KEY = `${brand.slug}.adminToken`;

export const readToken = () => SecureStore.getItemAsync(KEY).catch(() => null);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token).catch(() => {});
export const clearToken = () => SecureStore.deleteItemAsync(KEY).catch(() => {});
