import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  TextInput,
  SafeAreaView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import Ometria, { OmetriaBasketItem } from 'react-native-ometria';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from 'react-native-screens/native-stack';

enableScreens();

type StackParamList = {
  Events: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<StackParamList>();
export type EventsScreenNavigationProp = NativeStackNavigationProp<
  StackParamList,
  'Events'
>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  StackParamList,
  'Home'
>;

const EventType = {
  SCREEN_VIEWED: 'SCREEN_VIEWED',
  DEEPLINK_OPENED_EVENT: 'DEEPLINK_OPENED_EVENT',
  PROFILE_IDENTIFIED_BY_EMAIL: 'PROFILE_IDENTIFIED_BY_EMAIL',
  PROFILE_IDENTIFIED_BY_CUSTOMER_ID: 'PROFILE_IDENTIFIED_BY_CUSTOMER_ID',
  PROFILE_DEIDENTIFIED: 'PROFILE_DEIDENTIFIED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED',
  PRODUCT_LISTING_VIEWED: 'PRODUCT_LISTING_VIEWED',
  WISH_LIST_ADDED_TO: 'WISH_LIST_ADDED_TO',
  WISHLIST_REMOVED_FROM: 'WISHLIST_REMOVED_FROM',
  BASKET_VIEWED: 'BASKET_VIEWED',
  BASKET_UPDATED: 'BASKET_UPDATED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  HOME_SCREEN_VIEWED: 'HOME_SCREEN_VIEWED',
  CUSTOM: 'CUSTOM',
  FLUSH: 'FLUSH',
  CLEAR: 'CLEAR',
};

const Home = () => {
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const [isReady, setIsReady] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [notificationContent, setNotificationContent] = React.useState('');

  const requestUserPermission = React.useCallback(async () => {
    await messaging().requestPermission({
      sound: true,
      badge: true,
      alert: true,
    });
  }, []);

  //Handle Deeplink
  const handleUrl = ({ url }: any) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Ometria.processUniversalLink(url).then(
          (response) => {
            Alert.alert('URL processed:', response);
          },
          (error) => {
            console.log(error);
            Alert.alert('Unable to process: ' + url);
          }
        );
      }
    });
  };

  const handleInit = React.useCallback(() => {
    // Ometria init
    try {
      Ometria.initializeWithApiToken(
        'pk_test_IY2XfgrRsIlRGBP0rH2ks9dAbG1Ov24BsdggNTqP'
      ).then(
        () => {
          // enabled Ometria logging
          Ometria.isLoggingEnabled(true);

          setIsReady(true);
        },
        (error) => {
          throw error;
        }
      );
    } catch (error) {
      console.error('Error: ', error);
    }
  }, [setIsReady]);

  React.useEffect(() => {
    handleInit();
    Linking.addEventListener('url', handleUrl);
    return () => {
      Linking.removeEventListener('url', handleUrl);
    };
  });

  React.useEffect(() => {
    if (isReady) {
      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        if (Platform.OS === 'android') {
          Ometria.onMessageReceived(remoteMessage);
        }
        Ometria.onNotificationInteracted()
          .then((response) => {
            setNotificationContent(JSON.stringify(response));
            if (response.deepLinkActionUrl) {
              Linking.openURL(response.deepLinkActionUrl);
            }
          })
          .catch((error: any) => {
            console.warn('Error: ', error);
          });
      });

      // If using other push notification providers (ie Amazon SNS, etc)
      // you may need to get the APNs token instead for iOS:
      if (Platform.OS === 'ios') {
        // Request permission for iOS notifications
        requestUserPermission().then((status) => {
          console.log('Permission status: ', status);
        });
      }
      messaging()
        .getToken()
        .then((pushToken: string) => {
          console.log('TOKEN:', pushToken);
        });

      return () => {
        unsubscribe();
        // Listen to whether the token changes
        messaging().onTokenRefresh((pushToken: string) => {
          if (Platform.OS === 'android') {
            Ometria.onNewToken(pushToken);
          }
        });
      };
    }
    return;
  }, [isReady, requestUserPermission]);

  const handleLogin = React.useCallback(async () => {
    await Ometria.trackProfileIdentifiedByEmailEvent(email);
  }, [email]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#000"
        onChangeText={(value) => setEmail(value)}
      />
      <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
        <Text style={styles.text}>LOGIN WITH EMAIL</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Events')}
      >
        <Text style={styles.text}>Go to Events</Text>
      </TouchableOpacity>
      <View>
        <Text>NOTIFICATION CONTENT: </Text>
        <Text>{notificationContent}</Text>
      </View>
    </View>
  );
};

const Events = () => {
  const sendEvent = (eventType: string) => {
    if (eventType === EventType.DEEPLINK_OPENED_EVENT)
      Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
    if (eventType === EventType.SCREEN_VIEWED)
      Ometria.trackScreenViewedEvent('OnboardingScreen', { a: '1', b: '2' });
    if (eventType === EventType.HOME_SCREEN_VIEWED)
      Ometria.trackHomeScreenViewedEvent();
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_EMAIL)
      Ometria.trackProfileIdentifiedByEmailEvent('test@gmail.com');
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)
      Ometria.trackProfileIdentifiedByCustomerIdEvent('test_customer_id');
    if (eventType === EventType.PROFILE_DEIDENTIFIED)
      Ometria.trackProfileDeidentifiedEvent();
    if (eventType === EventType.PRODUCT_VIEWED)
      Ometria.trackProductViewedEvent('product_1');
    if (eventType === EventType.PRODUCT_LISTING_VIEWED)
      Ometria.trackProductListingViewedEvent('product_list', {});
    if (eventType === EventType.WISH_LIST_ADDED_TO)
      Ometria.trackWishlistAddedToEvent('product_1');
    if (eventType === EventType.WISHLIST_REMOVED_FROM)
      Ometria.trackWishlistRemovedFromEvent('product_1');
    if (eventType === EventType.BASKET_VIEWED) Ometria.trackBasketViewedEvent();
    if (eventType === EventType.BASKET_UPDATED) {
      // list of products
      const items: OmetriaBasketItem[] = [
        {
          productId: 'product-1',
          sku: 'sku-product-1',
          quantity: 1,
          price: 12.0,
        },
        {
          productId: 'product-2',
          sku: 'sku-product-2',
          quantity: 2,
          price: 9.0,
        },
        {
          productId: 'product-3',
          sku: 'sku-product-3',
          quantity: 3,
          price: 20.0,
        },
      ];

      Ometria.trackBasketUpdatedEvent({
        totalPrice: 12.0,
        currency: 'USD',
        items,
        link: 'link_eg',
      });
    }
    if (eventType === EventType.CHECKOUT_STARTED) {
      Ometria.trackCheckoutStartedEvent('orderId-1');
    }
    if (eventType === EventType.ORDER_COMPLETED) {
      Ometria.trackOrderCompletedEvent('order-1', {
        totalPrice: 12.0,
        currency: 'USD',
        items: [],
        link: 'link_eg',
      });
    }
    if (eventType === EventType.CUSTOM)
      Ometria.trackCustomEvent('my_custom_type', {});
    if (eventType === EventType.FLUSH) Ometria.flush();
    if (eventType === EventType.CLEAR) Ometria.clear();
  };

  return (
    <SafeAreaView>
      <ScrollView
        renderToHardwareTextureAndroid
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => Ometria.isLoggingEnabled(true)}
          >
            <Text style={styles.text}>ENABLE LOGGING</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PROFILE_IDENTIFIED_BY_EMAIL)}
          >
            <Text style={styles.text}>
              {EventType.PROFILE_IDENTIFIED_BY_EMAIL}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              sendEvent(EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)
            }
          >
            <Text style={styles.text}>
              {EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PROFILE_DEIDENTIFIED)}
          >
            <Text style={styles.text}>{EventType.PROFILE_DEIDENTIFIED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PRODUCT_VIEWED)}
          >
            <Text style={styles.text}>{EventType.PRODUCT_VIEWED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PRODUCT_LISTING_VIEWED)}
          >
            <Text style={styles.text}>{EventType.PRODUCT_LISTING_VIEWED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.WISH_LIST_ADDED_TO)}
          >
            <Text style={styles.text}>{EventType.WISH_LIST_ADDED_TO}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.WISHLIST_REMOVED_FROM)}
          >
            <Text style={styles.text}>{EventType.WISHLIST_REMOVED_FROM}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.BASKET_VIEWED)}
          >
            <Text style={styles.text}>{EventType.BASKET_VIEWED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.BASKET_UPDATED)}
          >
            <Text style={styles.text}>{EventType.BASKET_UPDATED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.CHECKOUT_STARTED)}
          >
            <Text style={styles.text}>{EventType.CHECKOUT_STARTED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.ORDER_COMPLETED)}
          >
            <Text style={styles.text}>{EventType.ORDER_COMPLETED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.DEEPLINK_OPENED_EVENT)}
          >
            <Text style={styles.text}>{EventType.DEEPLINK_OPENED_EVENT}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.SCREEN_VIEWED)}
          >
            <Text style={styles.text}>{EventType.SCREEN_VIEWED}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.HOME_SCREEN_VIEWED)}
          >
            <Text style={styles.text}>{EventType.HOME_SCREEN_VIEWED}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.CUSTOM)}
          >
            <Text style={styles.text}>{EventType.CUSTOM}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.FLUSH)}
          >
            <Text style={styles.text}>FLUSH EVENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.CLEAR)}
          >
            <Text style={styles.text}>CLEAR EVENTS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Events" component={Events} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { margin: 10 },
  title: { fontSize: 18, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  text: { color: '#FFF' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#33323A',
    padding: 12,
    color: '#000',
  },
  button: {
    color: '#FFF',
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: '#323499',
  },
  gray: { backgroundColor: '#33323A' },
});
