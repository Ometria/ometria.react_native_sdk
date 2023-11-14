import {
  Text,
  View,
  Alert,
  Modal,
  Linking,
  Platform,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import Ometria, { OmetriaNotificationData } from 'react-native-ometria';
import { RESULTS, requestNotifications } from 'react-native-permissions';

import { AuthModalProps } from './models';
import { version, ometria_sdk_version } from '../../package.json';
import { Events, customOmetriaOptions, demoBasketItems } from './data';
import {
  getOmetriaTokenFromStorage,
  setOmetriaTokenToStorage,
  stringifyMe,
} from './utils';

const App = () => {
  // Set this as a state if you want to use the reinitialization feature, otherwise you can use a static token
  const [ometriaToken, setOmetriaToken] = useState('');
  const [authModal, setAuthModal] = useState(false);
  const [evtsModal, setEvtsModal] = useState(false);

  const [notificationContent, setNotificationContent] = useState(
    'Interract with a notification to see its content here.'
  );

  /*  METHODS */

  /**
   * Initialize Ometria with the API Token
   *
   * Additionally you can pass an options object to customize the SDK behavior,
   * for example you can set the notification channel name for Android.
   *
   * @param token String
   */
  const handleOmetriaInit = async (token: string) => {
    try {
      Ometria.initializeWithApiToken(token, customOmetriaOptions).then(
        async () => {
          setAuthModal(false);
          Ometria.isLoggingEnabled(true);
          console.log('🎉 Ometria has been initialized!');

          // Request Push Notifications permission after Ometria SDK initialization
          await requestNotifications(['alert', 'sound', 'badge']).then(
            ({ status }) => {
              console.log('🔔 Push Notification permissions status:', status);
              if (status === RESULTS.GRANTED) {
                handlePushNotifications();
                console.log('🔔 Push Notification permissions granted!');
              }
            }
          );
        },
        (error) => {
          throw error;
        }
      );
    } catch (error) {
      console.error('😕 Error: ', error);
    }
  };

  /**
   * Handle Push Notifications 🍏 & 🤖
   * - A. Provides Ometria SDK with the FCM token
   * - B. Listen for new FCM tokens and provide them to the Ometria SDK
   *
   * #### iOS only 🍏 (SDK handles PN)
   * - C. Captures user interaction with push notifications event emmited by the iOS SDK
   *
   * #### Android only 🤖 (SDK does not handle PN)
   * - D. Captures user interaction with push notifications event emmited by the developer
   * - E. Handles background notification that opened the app
   * - F. Handles foreground notification that opened the app
   * - G. Subscribe to foreground PN messages
   * @returns unsubscribeFromMessages function
   */

  const handlePushNotifications = () => {
    // A. Provides Ometria SDK with the FCM token 🍏 & 🤖
    messaging()
      .getToken()
      .then((pushToken: string) => {
        Ometria.onNewToken(pushToken);
        console.log('🔑 Firebase token:', pushToken);
      });

    // B. Listen for new FCM tokens and provide them to the Ometria SDK 🍏 & 🤖
    messaging().onTokenRefresh((pushToken: string) =>
      Ometria.onNewToken(pushToken)
    );

    // C. Handles user interaction with push notifications event emmited by the iOS SDK 🍏

    Platform.OS === 'ios' &&
      Ometria.onNotificationInteracted((response: OmetriaNotificationData) =>
        notificationInteractionHandler(response)
      );

    /* Android only */
    if (Platform.OS !== 'android') {
      return;
    }

    /**
     * D. Function that handles user interaction with push notifications event emmited by the developer for Android 🤖
     * It is the Android implementation of iOS Ometria.onNotificationInteracted listener
     */
    const androidOnNotificationInterracted = async (remoteMessage: any) => {
      Ometria.onNotificationOpenedApp({ remoteMessage });
      const parsedNotification = await Ometria.parseNotification(remoteMessage);
      parsedNotification && notificationInteractionHandler(parsedNotification);
    };

    // E. Check for background notification that opened the app 🤖
    messaging()
      .getInitialNotification()
      .then(
        (remoteMessage) =>
          remoteMessage && androidOnNotificationInterracted(remoteMessage)
      );

    // F. Check for foreground notification that opened the app 🤖
    messaging().onNotificationOpenedApp((remoteMessage) =>
      androidOnNotificationInterracted(remoteMessage)
    );

    // G. Subscribe to foreground PN messages 🤖
    const unsubscribeFromMessages = messaging().onMessage(
      async (remoteMessage) => {
        console.log('📭 Background message received:', remoteMessage);
        Ometria.onNotificationReceived(remoteMessage);
        try {
          Ometria.parseNotification(remoteMessage).then(
            (parsedNotification) => {
              setNotificationContent(
                stringifyMe([remoteMessage, parsedNotification])
              );
              /* Foreground notifications are NOT shown to the user.
             Instead, you could trigger a local notification or update the in-app UI to signal a new notification.
             Read more at: https://rnfirebase.io/messaging/usage#foreground-state-messages
             Don't forget to call androidOnNotificationInterracted() if you want to handle the notification interaction event
            */
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
    );
    return unsubscribeFromMessages;
  };

  // Other methods for both iOS and Android

  /**
   * Handle notification interaction event (regardles who emitted it)
   * - Log the notification content
   * - Open the notification deep link if available
   * @param response {OmetriaNotificationData}
   */
  const notificationInteractionHandler = (
    response: OmetriaNotificationData
  ) => {
    console.log('🔔 Notification interacted with: ', response);
    setNotificationContent(stringifyMe([response]));

    if (response.deepLinkActionUrl) {
      Ometria.trackDeepLinkOpenedEvent(response.deepLinkActionUrl, 'Browser');
      try {
        Linking.openURL(response.deepLinkActionUrl);
      } catch (e) {
        console.log('🔔 Error opening notification URL: ', e);
      }
    }
  };

  /**
   * Handle Deeplinking
   * @param payload {url: String}
   */
  const handleDeepLinking = ({ url }: any) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Ometria.processUniversalLink(url).then(
          (response) => {
            Alert.alert('🔗 URL processed:', response);
          },
          (error) => {
            console.log(error);
            Alert.alert('🔗 Unable to process URL: ' + url);
          }
        );
      }
    });
  };

  /**
   * Handle Login by Email or UserId
   * @param method {userEmail?: String, customerId?: String}
   */
  const handleLogin = (method: { userEmail?: string; userId?: string }) => {
    method.userEmail &&
      Ometria.trackProfileIdentifiedByEmailEvent(method.userEmail!);
    method.userId &&
      Ometria.trackProfileIdentifiedByCustomerIdEvent(method.userId!);
    setAuthModal(false);
  };

  /**
   * Saving Ometria API Token to Local Storage
   *
   * - Save token to Local Storage
   * - Initialize Ometria SDK
   *
   * (Optional: You could use a static token instead of Local Storage)
   */
  const saveNewOmetriaToken = async (
    newToken: string,
    initializeWithNewToken: (token: string) => Promise<void>
  ) => {
    if (newToken === '') {
      return;
    }
    await setOmetriaTokenToStorage(newToken);
    console.log('🔐 New Token. Ometria will reinitialize');
    initializeWithNewToken(newToken);
  };

  const handleOmetriaTokenInit = async () => {
    const savedToken = await getOmetriaTokenFromStorage();
    if (savedToken === '') {
      // Do not initialize Ometria SDK if there is no token
      setAuthModal(true);
      return;
    }
    setOmetriaToken(savedToken);
    handleOmetriaInit(savedToken);
    console.log('💾 Token from LocalStorage:', savedToken);
  };

  // EFFECTS
  /**
   * Initialize with useEffect:
   * 1. Ometria init handler with or without reinitialization
   * 2. Deeplink handler
   */

  useEffect(() => {
    // This is optional if you want to use the reinitialization feature
    // If not, you can call handleOmetriaInit here directly with the static token as a parameter
    handleOmetriaTokenInit();
  }, []);

  useEffect(() => {
    const subscribe = Linking.addEventListener('url', handleDeepLinking);
    return () => subscribe.remove();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ometria React Native Demo {version}</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'android' ? 'Android' : 'iOS'} SDK version{' '}
        {ometria_sdk_version[Platform.OS === 'android' ? 'android' : 'ios']}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => setAuthModal(true)}>
        <Text style={styles.text}>Change Login Info 🔐 </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => setEvtsModal(true)}>
        <Text style={styles.text}>Go to Events 📝</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.textBold}>🔔 Notification Content: </Text>
        <Text>{notificationContent}</Text>
      </View>

      <EventsModal isVisible={evtsModal} onClose={() => setEvtsModal(false)} />
      <AuthModal
        isVisible={authModal}
        onClose={() => setAuthModal(false)}
        onLogin={handleLogin}
        /* Only for  reinitialization feature */
        reinitialization={{
          ometriaToken,
          setOmetriaToken,
          saveNewOmetriaToken,
          handleOmetriaInit,
        }}
      />
    </ScrollView>
  );
};

// MODALS

/* <EventsModal />
 * A component that lists events and allows you to send them
 * */

const EventsModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const sendEvent = (eventType: string) => {
    switch (eventType) {
      case Events.ENABLE_LOGGING:
        Ometria.isLoggingEnabled(true);
        break;
      case Events.DEEPLINK_OPENED_EVENT:
        Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
        break;
      case Events.SCREEN_VIEWED:
        Ometria.trackScreenViewedEvent('OnboardingScreen', { a: '1', b: '2' });
        break;
      case Events.HOME_SCREEN_VIEWED:
        Ometria.trackHomeScreenViewedEvent();
        break;
      case Events.PROFILE_IDENTIFIED_BY_EMAIL:
        Ometria.trackProfileIdentifiedByEmailEvent('test@gmail.com');
        break;
      case Events.PROFILE_IDENTIFIED_BY_CUSTOMER_ID:
        Ometria.trackProfileIdentifiedByCustomerIdEvent('test_customer_id');
        break;
      case Events.PROFILE_DEIDENTIFIED:
        Ometria.trackProfileDeidentifiedEvent();
        break;
      case Events.PRODUCT_VIEWED:
        Ometria.trackProductViewedEvent('productId-1');
        break;
      case Events.PRODUCT_LISTING_VIEWED:
        Ometria.trackProductListingViewedEvent('product_list', {});
        break;
      case Events.BASKET_VIEWED:
        Ometria.trackBasketViewedEvent();
        break;
      case Events.BASKET_UPDATED:
        Ometria.trackBasketUpdatedEvent({
          totalPrice: 12.0,
          id: 'basket_id_eg',
          currency: 'USD',
          items: demoBasketItems,
          link: 'link_eg',
        });
        break;
      case Events.CHECKOUT_STARTED:
        Ometria.trackCheckoutStartedEvent('orderId-1');
        break;
      case Events.ORDER_COMPLETED:
        Ometria.trackOrderCompletedEvent('orderId-1', {
          totalPrice: 12.0,
          currency: 'USD',
          items: demoBasketItems,
          link: 'link_eg',
          id: 'basket_id_eg',
        });
        break;
      case Events.CUSTOM:
        Ometria.trackCustomEvent('my_custom_type', {});
        break;
      case Events.FLUSH:
        Ometria.flush();
        break;
      case Events.CLEAR:
        Ometria.clear();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Events 📝</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.text}>CLOSE EVENTS</Text>
        </TouchableOpacity>
        <ScrollView>
          {Object.values(Events).map((eventValue) => (
            <TouchableOpacity
              key={eventValue}
              style={styles.btn}
              onPress={() => sendEvent(eventValue)}
            >
              <Text style={styles.text}>{eventValue}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

/*
 * <AuthModal />
 * A component to allow the user to change the login info
 * It is used to change the customerId or the userEmail
 * It is also used to save a new Ometria API Token if you want to use the reinitialization feature
 * */

const AuthModal: React.FC<AuthModalProps> = ({
  isVisible,
  onClose,
  onLogin,
  reinitialization,
}) => {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Change Login Info 🔐</Text>
        <TextInput
          style={styles.input}
          placeholder="Ometria API TOKEN"
          placeholderTextColor="#000"
          value={reinitialization.ometriaToken}
          onChangeText={reinitialization.setOmetriaToken}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            reinitialization.saveNewOmetriaToken(
              reinitialization.ometriaToken,
              reinitialization.handleOmetriaInit
            )
          }
        >
          <Text style={styles.text}>Save Ometria pushToken</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={userId}
          placeholder="Customer Id"
          placeholderTextColor="#000"
          onChangeText={setUserId}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            onLogin({ userId });
          }}
        >
          <Text style={styles.text}>Login with customer ID</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={userEmail}
          placeholderTextColor="#000"
          onChangeText={setUserEmail}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onLogin({ userEmail })}
        >
          <Text style={styles.text}>Login with customer Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.text}>Close settings</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default App;

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
  },
  title: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    color: '#FFF',
  },
  textBold: {
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  input: {
    padding: 12,
    color: '#000',
    borderColor: '#33323A',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1e1f4d',
  },
  closeBtn: {
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: 'grey',
  },
});
