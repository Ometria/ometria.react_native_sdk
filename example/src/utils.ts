import { Linking } from 'react-native';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;

const STORAGE_TOKEN_KEY = 'token_Ometria';
const STORAGE_LAST_BACKGROUND_KEY = 'last_background_time';

export const getOmetriaTokenFromStorage = async () =>
  (await AsyncStorage.getItem(STORAGE_TOKEN_KEY)) || '';

export const setOmetriaTokenToStorage = async (token: string) =>
  await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);

export const stringifyMe = (arr: any[]) =>
  arr.map((obj) => JSON.stringify(obj, null, 2)).join('');

export const openUrl = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('An error occurred', err));
};

export const setThrottledBackgroundCallback = (
  callback: () => Promise<void>
) => {
  const listener = async (nextAppState: string) => {
    if (nextAppState === 'background') {
      const lastBackgroundTime = await AsyncStorage.getItem(
        STORAGE_LAST_BACKGROUND_KEY
      );
      const now = new Date().getTime();

      if (
        !lastBackgroundTime ||
        now - parseInt(lastBackgroundTime, 10) > oneWeekInMillis
      ) {
        await callback();
        await AsyncStorage.setItem(STORAGE_LAST_BACKGROUND_KEY, now.toString());
        return;
      }
    }
  };

  const subscribtion = AppState.addEventListener('change', listener);

  return () => {
    subscribtion.remove();
  };
};
