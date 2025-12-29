import { Platform } from 'react-native';
import Ometria from 'react-native-ometria';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './src/App';
import { getOmetriaTokenFromStorage } from './src/utils';
import { customOmetriaOptions } from './src/data';

// Android background message handler (must be at top level)
// TODO: Update RNFB RemoteMessage type that changed in 18.5.0
Platform.OS === 'android' &&
  setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    Ometria.onAndroidBackgroundMessage({
      ometriaToken: await getOmetriaTokenFromStorage(),
      ometriaOptions: customOmetriaOptions,
      remoteMessage: remoteMessage as any,
    });
  });

export default App;
