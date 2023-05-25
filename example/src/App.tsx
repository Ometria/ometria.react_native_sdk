/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
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
import Ometria, {
  OmetriaBasketItem,
  OmetriaNotificationData,
} from 'react-native-ometria';

import { version } from '../../package.json';

const Events = {
  ENABLE_LOGGING: 'ENABLE_LOGGING',
  SCREEN_VIEWED: 'SCREEN_VIEWED',
  DEEPLINK_OPENED_EVENT: 'DEEPLINK_OPENED_EVENT',
  PROFILE_IDENTIFIED_BY_EMAIL: 'PROFILE_IDENTIFIED_BY_EMAIL',
  PROFILE_IDENTIFIED_BY_CUSTOMER_ID: 'PROFILE_IDENTIFIED_BY_CUSTOMER_ID',
  PROFILE_DEIDENTIFIED: 'PROFILE_DEIDENTIFIED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED',
  PRODUCT_LISTING_VIEWED: 'PRODUCT_LISTING_VIEWED',
  BASKET_VIEWED: 'BASKET_VIEWED',
  BASKET_UPDATED: 'BASKET_UPDATED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  HOME_SCREEN_VIEWED: 'HOME_SCREEN_VIEWED',
  CUSTOM: 'CUSTOM',
  FLUSH: 'FLUSH EVENTS',
  CLEAR: 'CLEAR EVENTS',
};

const demoBasketItems: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
    variantId: 'variant-1',
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
    variantId: 'variant-2',
  },
  {
    productId: 'product-3',
    sku: 'sku-product-3',
    quantity: 3,
    price: 20.0,
    variantId: 'variant-3',
  },
];

const App = () => {
  const ometriaToken = ''; // OMETRIA_API_TOKEN

  const [initPN, setInitPN] = useState(false); // isReady to initialize Push Notification
  const [notificationContent, setNotificationContent] = useState(
    'Interract with a notification to see its content here.'
  );

  const [authModal, setAuthModal] = useState(false);
  const [evtsModal, setEvtsModal] = useState(false);

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
      Ometria.initializeWithApiToken(token, {
        notificationChannelName: 'Example Channel Name',
      }).then(
        async () => {
          console.log('🎉 Ometria has been initialized!');
          Ometria.isLoggingEnabled(true);
          setAuthModal(false);

          // Ready to initialize Push Notifications handler
          await requestPNPermission();
          setInitPN(true);
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
   * Request Push Notifications permission
   */
  const requestPNPermission = async () => {
    const status = await messaging().requestPermission({
      sound: true,
      badge: true,
      alert: true,
    });

    if (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      console.log('🔔 Push Notification permissions granted!');
    }
  };

  /**
   * Handle Push Notifications
   *
   * #### iOS & Android:
   * - Provides Ometria SDK with the FCM token
   * - Listen for new FCM tokens and provide them to the Ometria SDK
   * - Set up a listener for user interaction with push notifications
   *
   * #### Android only
   * - Subscribe to foreground PN messages
   * - Subscribe to background PN messages
   *
   * (On iOS the SDK handles Firebase PN background messages.)
   *
   * @returns unsubscribeFromMessages function
   */
  const handlePushNotifications = () => {
    if (!initPN) {
      return;
    }

    // Provides Ometria SDK with the FCM token
    messaging()
      .getToken()
      .then((pushToken: string) => {
        Ometria.onNewToken(pushToken);
        console.log('🔑 Firebase token:', pushToken);
      });

    // Listen for new FCM tokens and provide them to the Ometria SDK
    messaging().onTokenRefresh((pushToken: string) =>
      Ometria.onNewToken(pushToken)
    );

    // Set up a listener for user interaction with push notifications
    Ometria.onNotificationInteracted((response: OmetriaNotificationData) => {
      console.log('🔔 Notification Interacted', response);
      setNotificationContent(JSON.stringify(response));

      if (response.deepLinkActionUrl) {
        // Handle deep linking open URL action
        Ometria.trackDeepLinkOpenedEvent(response.deepLinkActionUrl, 'Browser');
        Linking.openURL(response.deepLinkActionUrl);
      }
    });

    /*
     * Android only
     *
     * - Subscribe to foreground PN messages
     * - Subscribe to background PN messages
     *
     * On iOS the SDK handles Firebase PN background messages.
     * */

    if (Platform.OS !== 'android') {
      return;
    }

    const unsubscribeFromMessages = messaging().onMessage(
      async (remoteMessage: any) => {
        console.log('📭 Foreground message received:', remoteMessage);
        Ometria.onMessageReceived(remoteMessage);
      }
    );

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('📫 Background message received:', remoteMessage);
      Ometria.onMessageReceived(remoteMessage);
    });

    return unsubscribeFromMessages;
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
   * Initialize with useEffect:
   *
   * 1. Ometria handler ONLY once
   * 2. Push Notifications handler ONLY after Ometria initialization (initPN === true)
   * 3. Deeplink handler
   *
   */

  useEffect(() => {
    handleOmetriaInit(ometriaToken);
  }, []);

  useEffect(handlePushNotifications, [initPN]);

  useEffect(() => {
    const subscribe = Linking.addEventListener('url', handleDeepLinking);
    return () => subscribe.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ometria React Native Demo {version}</Text>
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

      <AuthModal
        isVisible={authModal}
        onClose={() => setAuthModal(false)}
        onLogin={handleLogin}
      />

      <EventsModal isVisible={evtsModal} onClose={() => setEvtsModal(false)} />
    </View>
  );
};

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

const AuthModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onLogin: (method: { userEmail?: string; userId?: string }) => void;
}> = ({ isVisible, onClose, onLogin }) => {
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
