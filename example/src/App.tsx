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
import {
  FirebaseMessagingTypes,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  getInitialNotification,
  onNotificationOpenedApp as onNotificationOpenedAppListener,
} from '@react-native-firebase/messaging';
import Ometria from 'react-native-ometria';
import { RESULTS, requestNotifications } from 'react-native-permissions';

import { AuthModalProps } from './models';
import { version, ometria_sdk_version } from '../../package.json';
import { Events, customOmetriaOptions, demoBasketItems } from './data';
import {
  getOmetriaTokenFromStorage,
  openUrl,
  setOmetriaTokenToStorage,
  setThrottledBackgroundCallback,
} from './utils';

const App = () => {
  // Set this as a state if you want to use the reinitialization feature, otherwise you can use a static token
  const [ometriaToken, setOmetriaToken] = useState('');
  const [authModal, setAuthModal] = useState(false);
  const [evtsModal, setEvtsModal] = useState(false);

  // In RN 0.76+, the new architecture uses Bridgeless mode (RCTHost)
  // Check for TurboModule support using multiple methods
  const isBridgeless = (global as any).RN$Bridgeless === true;
  const hasTurboModuleProxy = (global as any).__turboModuleProxy != null;
  const isTurboModuleEnabled = isBridgeless || hasTurboModuleProxy;

  // A flag to prevent the user from sending events before the SDK is initialized in the sample app - not needed in production
  const [ometriaIsInitalized, setOmetriaIsInitalized] = useState(false);

  const [notificationContent, setNotificationContent] = useState(
    'Receive or interract with a notification to see its content here.',
  );

  /*  METHODS */

  /**
   * Initialize Ometria with the API Token
   *
   * Additionally you can pass an options object to customize the SDK behavior,
   * for example you can set the notification channel name for Android or set the appGroupIdentifier for iOS
   *
   * @param token String
   */
  const handleOmetriaInit = async (token: string) => {
    try {
      console.log('About to initialize Ometria SDK...');
      Ometria.initializeWithApiToken(token, customOmetriaOptions).then(
        async () => {
          setOmetriaIsInitalized(true);
          setAuthModal(false);
          Ometria.isLoggingEnabled(true);
          console.log('🎉 Ometria has been initialized!');

          // Request Push Notifications permission after Ometria SDK initialization
          await requestNotifications(['alert', 'sound', 'badge'])
            .then(({ status }) => {
              console.log('🔔 Push Notification permissions status:', status);
              if (status === RESULTS.GRANTED) {
                handlePushNotifications();
                console.log('🔔 Push Notification permissions granted!');
              }
            })
            .catch(error => {
              console.error('😕 Error requesting PN permissions: ', error);
            });
        },
        error => {
          throw error;
        },
      );
    } catch (error) {
      setAuthModal(false);
      setOmetriaIsInitalized(false);
      console.error('😕 Error: ', error);
    }
  };

  /**
   * Handle Push Notifications 🍏 & 🤖
   * - A. Provides Ometria SDK with the FCM token
   * - B. Listen for new FCM tokens and provide them to the Ometria SDK
   * - C. Captures user interaction with push notifications event emmited by the developer
   * - D. Handles notification that opened the app from a quit state
   * - E. Handles notification that opened the app from a background state
   * - F. Subscribe to foreground PN messages
   *
   * @returns unsubscribeFromMessages function
   */

  const handlePushNotifications = () => {
    const messagingInstance = getMessaging();

    // A. Provides Ometria SDK with the FCM token 🍏 & 🤖
    getToken(messagingInstance)
      .then((pushToken: string) => {
        Ometria.onNewToken(pushToken);
        console.log('🔑 Firebase token:', pushToken);
      })
      .catch(error => {
        console.error('😕 Error getting FCM token: ', error);
      });

    // B. Listen for new FCM tokens and provide them to the Ometria SDK 🍏 & 🤖
    onTokenRefresh(messagingInstance, (pushToken: string) =>
      Ometria.onNewToken(pushToken),
    );

    // C. Get the new token and send it when moving to the background, with a frequency of once a week (optional)
    setThrottledBackgroundCallback(async () => {
      getToken(messagingInstance).then((pushToken: string) => {
        Ometria.onNewToken(pushToken);
        console.log('🔑 Firebase token in the background:', pushToken);
      });
    });

    // D. Function that handles user interaction with push notifications event 🍏 & 🤖
    const onNotificationOpenedApp = async (
      remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    ) => {
      console.log('🔔 Notification has been interacted with and opened app.');
      setNotificationContent(JSON.stringify(remoteMessage, null, 2));

      // TODO: Update RNFB RemoteMessage type that changed in 18.5.0
      Ometria.onNotificationOpenedApp(remoteMessage as any); // 🏹 Ometria Event Logged: onNotificationInteracted

      // TODO: Update RNFB RemoteMessage type that changed in 18.5.0
      const notif = await Ometria.parseNotification(remoteMessage as any);
      if (notif?.deepLinkActionUrl) {
        Ometria.trackDeepLinkOpenedEvent(notif.deepLinkActionUrl, 'Browser'); // 🏹 Ometria Event Logged: deepLinkOpened
        openUrl(notif.deepLinkActionUrl);
      }
      Ometria.flush();
    };

    // E. Check for notification that opened the app from a quit state 🍏 & 🤖
    getInitialNotification(messagingInstance).then(remoteMessage => {
      if (remoteMessage) {
        console.log('🔔 Notification opened the app from quit state');
        onNotificationOpenedApp(remoteMessage);
      }
    });

    // F. Subscribe to notification that opens the app from a background state 🍏 & 🤖
    onNotificationOpenedAppListener(messagingInstance, remoteMessage => {
      if (remoteMessage) {
        console.log('🔔 Notification opened the app from background');
        onNotificationOpenedApp(remoteMessage);
      }
    });

    // G. Subscribe to foreground PN messages 🍏 & 🤖
    const unsubscribeFromMessages = onMessage(
      messagingInstance,
      async remoteMessage => {
        console.log('📭 Foreground message received:', remoteMessage);
        setNotificationContent(JSON.stringify(remoteMessage, null, 2));
        // TODO: Update RNFB RemoteMessage type that changed in 18.5.0
        Ometria.onNotificationReceived(remoteMessage as any); // 🏹 Ometria Event Logged: onNotificationReceived
        /* Keep in mind that foreground notifications are NOT shown to the user.
           Instead, you could trigger a local notification or update the in-app UI to signal a new notification.
           Read more at: https://rnfirebase.io/messaging/usage#foreground-state-messages
           Don't forget to call onNotificationOpenedApp() if you want to handle the notification interaction event
        */
      },
    );
    return unsubscribeFromMessages;
  };

  /**
   * Handle Deeplinking
   * @param payload {url: String}
   */
  const handleDeepLinking = ({ url }: any) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Ometria.processUniversalLink(url).then(
          response => {
            Alert.alert('🔗 URL processed:', response);
          },
          error => {
            console.log(error);
            Alert.alert('🔗 Unable to process URL: ' + url);
          },
        );
      }
    });
  };

  /**
   * Handle Identification by Email or UserId and maybe storeId
   * @param method {email?: String, customerId?: String, storeId?: String}
   */
  const handleProfileIdentified = (method: {
    email?: string;
    customerId?: string;
    storeId?: string;
  }) => {
    // I want it to be null, not empty string
    const updatedStoreId = method.storeId ? method.storeId : null;
    if (!!method.email && !!method.customerId) {
      Ometria.trackProfileIdentifiedEvent(
        method.customerId,
        method.email,
        updatedStoreId,
      );
      setAuthModal(false);
      return;
    }
    method.email &&
      Ometria.trackProfileIdentifiedByEmailEvent(method.email, updatedStoreId);
    method.customerId &&
      Ometria.trackProfileIdentifiedByCustomerIdEvent(
        method.customerId,
        updatedStoreId,
      );
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
    initializeWithNewToken: (token: string) => Promise<void>,
  ) => {
    if (newToken === '') {
      Alert.alert('🔐 Token cannot be empty');
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

  const handleUpdateStoreId = (storeId: string | null) => {
    Ometria.updateStoreId(storeId);
    setAuthModal(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {
          (ometria_sdk_version || {})[
            Platform.OS === 'android' ? 'android' : 'ios'
          ]
        }
      </Text>
      <View style={styles.archBadge}>
        <Text style={styles.archText}>
          {isTurboModuleEnabled ? '⚡ New Architecture' : '🌉 Old Architecture'}
        </Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => setAuthModal(true)}>
        <Text style={styles.text}>Change Login Info 🔐 </Text>
      </TouchableOpacity>

      {ometriaIsInitalized && (
        <TouchableOpacity style={styles.btn} onPress={() => setEvtsModal(true)}>
          <Text style={styles.text}>Go to Events 📝</Text>
        </TouchableOpacity>
      )}

      <View>
        <Text style={styles.textBold}>🔔 Notification Content: </Text>
        <Text>{notificationContent}</Text>
      </View>

      <EventsModal isVisible={evtsModal} onClose={() => setEvtsModal(false)} />
      <AuthModal
        onUpdateStoreId={handleUpdateStoreId}
        isVisible={authModal}
        onClose={() => setAuthModal(false)}
        onProfileIdentified={handleProfileIdentified}
        /* Only for  reinitialization feature */
        reinitialization={{
          ometriaToken,
          setOmetriaToken,
          saveNewOmetriaToken,
          handleOmetriaInit,
        }}
        ometriaIsInitialized={ometriaIsInitalized}
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
  const simulatePushTokenRefresh = () => {
    getToken(getMessaging()).then((pushToken: string) => {
      Ometria.onNewToken(pushToken);
      console.log('🔑 Firebase token:', pushToken);
    });
  };

  const deleteStoreId = () => {
    Ometria.updateStoreId(null);
  };

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
        Ometria.trackCustomEvent('my_custom_type');
        break;
      case Events.FLUSH:
        Ometria.flush();
        break;
      case Events.CLEAR:
        Ometria.clear();
        break;
      case Events.SIMULATE_TOKEN_REFRESH:
        simulatePushTokenRefresh();
        break;
      case Events.RESET_STORE_ID:
        deleteStoreId();
        break;
      default:
        return;
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
        {/*See https://github.com/facebook/react-native/issues/48822 for scrollView height issue*/}
        <ScrollView
          style={Platform.select({
            android: {
              height: 300,
            },
          })}
        >
          {Object.values(Events).map(eventValue => (
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
  onProfileIdentified,
  onUpdateStoreId,
  reinitialization,
  ometriaIsInitialized,
}) => {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [storeId, setStoreId] = useState('');

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <ScrollView style={styles.container}>
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
              reinitialization.handleOmetriaInit,
            )
          }
        >
          <Text style={styles.text}>Save Ometria Token</Text>
        </TouchableOpacity>
        {ometriaIsInitialized && (
          <>
            <Text>Customer Id:</Text>
            <TextInput
              style={styles.input}
              value={userId}
              placeholder="Customer Id"
              placeholderTextColor="#000"
              onChangeText={setUserId}
            />
            <Text>Email:</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={userEmail}
              placeholderTextColor="#000"
              onChangeText={setUserEmail}
            />
            <Text>Store Id (optional):</Text>
            <TextInput
              style={styles.input}
              placeholder="Store Id"
              value={storeId}
              placeholderTextColor="#000"
              onChangeText={setStoreId}
            />
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                if (!userEmail) {
                  Alert.alert('Please provide a customer Email');
                  return;
                }
                onProfileIdentified({ email: userEmail, storeId: storeId });
              }}
            >
              <Text style={styles.text}>
                Identify with Customer Email (± Store Id)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                if (!userId) {
                  Alert.alert('Please provide a customer Id');
                  return;
                }
                onProfileIdentified({ customerId: userId, storeId: storeId });
              }}
            >
              <Text style={styles.text}>
                Identify with Customer Id (± Store Id)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                if (!userId || !userEmail) {
                  Alert.alert('Please provide a customer Id and Email');
                  return;
                }
                onProfileIdentified({
                  customerId: userId,
                  storeId: storeId,
                  email: userEmail,
                });
              }}
            >
              <Text style={styles.text}>
                Identify with Customer Id, Email (± Store Id)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => onUpdateStoreId(storeId)}
            >
              <Text style={styles.text}>Update Store Id only</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.text}>Close settings</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 50,
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
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    color: '#000',
    borderColor: '#33323A',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
    backgroundColor: '#1e1f4d',
  },
  closeBtn: {
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: 'grey',
  },
  archBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
  },
  archText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  line: {
    height: 1,
    backgroundColor: '#33323A',
    marginTop: 12,
    marginBottom: 24,
  },
});
