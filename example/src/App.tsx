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
} from 'react-native';
import Ometria, { OmetriaBasketItem } from 'react-native-ometria';
// import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

// import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';

enableScreens();
const Stack = createNativeStackNavigator();

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
  PROCESS_UNIVERSAL_LINK: 'PROCESS_UNIVERSAL_LINK',
};

const Home = () => {
  const navigation = useNavigation();
  const [isReady, setIsReady] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const requestUserPermission = React.useCallback(async () => {
    await messaging().requestPermission({
      sound: true,
      badge: true,
      alert: true,
    });
  }, []);

  const handleInit = React.useCallback(() => {
    // Ometria init
    try {
      Ometria.initializeWithApiToken(
        'pk_test_IY2XfgrRsIlRGBP0rH2ks9dAbG1Ov24BsdggNTqP'
      ).then(
        () => {
          console.log('INITIALIZED');
          // enabled Ometria logging
          Ometria.isLoggingEnabled(false);

          // Deep linking interaction from push notifications
          Ometria.onDeepLinkInteracted()
            .then((notificationURL) => {
              console.log('Notification URL interacted: ', notificationURL);
              //Open in browser
              Linking.openURL(notificationURL);
            })
            .catch((error: any) => {
              console.warn('Error: ', error);
            });

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
    console.log('INITIALIZE');
    handleInit();
  });

  React.useEffect(() => {
    console.log('Is Ready: ', isReady);
    if (isReady) {
      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        // only for Android
        if (Platform.OS === 'android') {
          Ometria.onMessageReceived(remoteMessage);
        }
      });

      // If using other push notification providers (ie Amazon SNS, etc)
      // you may need to get the APNs token instead for iOS:
      if (Platform.OS === 'android') {
        // Get Android device token
        messaging()
          .getToken()
          .then((pushToken: string) => {
            console.log('TOKEN: ', pushToken);
            Ometria.onNewToken(pushToken);
          });
      } else {
        // Request permission for iOS notifications
        requestUserPermission().then((status) => {
          console.log('Permission status: ', status);
        });
      }

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
        onPress={() => navigation.navigate({ key: 'Events' })}
      >
        <Text style={styles.text}>Go to Events</Text>
      </TouchableOpacity>
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
      Ometria.trackProductListingViewedEvent();
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
    if (eventType === EventType.PROCESS_UNIVERSAL_LINK)
      Ometria.processUniversalLink(
        'https://clickom.omdemo.net/f/a/0CVMAp9OAVf-nkN8d6Np1Q~~/AAAAAQA~/RgRio1hIP0TDaHR0cHM6Ly9vbWV0cmlhLXRlc3RpbmctYXJlYS5teXNob3BpZnkuY29tL2NvbGxlY3Rpb25zL2FscGhhLW1vb3NlLz9vbV9jYW1wYWlnbj1vbXRlX2RlZmF1bHQmb21fc2VuZD1jMzI2YmFkYWIxYWQ0NDVmOWNkYWExYmM4YTAzNjIxZiZ1dG1fY2FtcGFpZ249b210ZV9kZWZhdWx0JnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1vbWV0cmlhVwdvbWV0cmlhQgpgvkjTwGA2PqhWUhlwZXRlci5ob3J2YXRoQG9tZXRyaWEuY29tWAQAAAEb'
      ).then(
        (response) => {
          console.log(response);
        },
        (error) => {
          console.log(error);
        }
      );
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
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PROCESS_UNIVERSAL_LINK)}
          >
            <Text style={styles.text}>PROCESS_UNIVERSAL_LINK</Text>
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
