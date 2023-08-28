import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * [Test mode] Saving Ometria API Token to Local Storage
 *
 * - Save token to Local Storage
 * - Initialize Ometria SDK
 *
 * Not for production use.
 */
export const _saveNewToken = async (
  valueToSave: string,
  onSuccess: (token: string) => Promise<void>
) => {
  if (valueToSave === '') {
    return;
  }
  AsyncStorage.setItem('token', valueToSave);
  console.log('🔐 New Token. Ometria will reinitialize');
  onSuccess(valueToSave);
};

/**
 * [Test mode] Ometria SDK initialization
 *
 * - Initialize Ometria SDK with a token from Local Storage
 * - Trigger Auth Modal if no token is found in Local Storage
 *
 *  Not for production use.
 */
export const handleOmetriaTestingInit = async (
  closeModal: React.Dispatch<React.SetStateAction<boolean>>,
  setToken: React.Dispatch<React.SetStateAction<string>>,
  onSuccess: (token: string) => Promise<void>
) => {
  const savedToken = await AsyncStorage.getItem('token');
  if (savedToken === null) {
    closeModal(true);
    return;
  }
  setToken(savedToken);
  onSuccess(savedToken);
  console.log('💾 Token from LocalStorage:', savedToken);
};
