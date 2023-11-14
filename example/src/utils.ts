import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY_STORAGE = 'token';

export const getOmetriaTokenFromStorage = async () =>
  (await AsyncStorage.getItem(TOKEN_KEY_STORAGE)) || '';

export const setOmetriaTokenToStorage = async (token: string) =>
  await AsyncStorage.setItem(TOKEN_KEY_STORAGE, token);

export const stringifyMe = (arr: any[]) =>
  arr.map((obj) => JSON.stringify(obj, null, 2)).join('');
