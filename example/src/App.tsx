import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ScrollView, View, TextInput } from 'react-native';
import Ometria from 'ometria.react-native_sdk';
import messaging from '@react-native-firebase/messaging';

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
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  HOME_SCREEN_VIEWED: 'HOME_SCREEN_VIEWED',
  CUSTOM: 'CUSTOM',
  FLUSH: 'FLUSH',
  CLEAR: 'CLEAR',
}

const Home = ({ onToken }: { onToken: (token: string) => {} }) => {
  const [loading, setLoading] = React.useState<string>("");
  const [authenticated, setAuthenticated] = React.useState(false);
  const [apiToken, setApiToken] = React.useState("");
  const [email, setEmail] = React.useState("");

  const handleInitialize = React.useCallback(
    async () => {
      setLoading("token")

      await Ometria.initializeWithApiToken(apiToken)

      onToken && onToken(apiToken);
      setAuthenticated(true)
      setLoading("")
    },
    [apiToken],
  )

  const handleLogin = React.useCallback(
    async () => {
      setLoading("email")
      await Ometria.trackProfileIdentifiedByEmailEvent(email)
      setLoading("")
    },
    [email],
  )

  return (
    <View>
      <View>
        <TextInput onChangeText={value => setApiToken(value)} placeholder="API TOKEN" />
        <TouchableOpacity style={[styles.button, styles.gray]} onPress={() => handleInitialize()}>
          {loading === "token" ? <ActivityIndicator /> : <Text>INITIALIZE</Text>}
        </TouchableOpacity>
      </View>
      {authenticated &&
        <View>
          <TextInput onChangeText={value => setEmail(value)} placeholder="Email" />
          <TouchableOpacity style={[styles.button, styles.gray]} onPress={() => handleLogin()}>
            {loading === "email" ? <ActivityIndicator /> : <Text>LOGIN WITH EMAIL</Text>}
          </TouchableOpacity>
        </View>
      }
    </View>
  )
}

const Events = () => {
  const sendEvent = (eventType: string) => {
    if (eventType === EventType.SCREEN_VIEWED)
      Ometria.trackScreenViewedEvent('OnboardingScreen', { "a": "1", "b": "2" })
    if (eventType === EventType.DEEPLINK_OPENED_EVENT)
      Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen')
    if (eventType === EventType.SCREEN_VIEWED)
      Ometria.trackScreenViewedEvent('OnboardingScreen', { "a": "1", "b": "2" })
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_EMAIL)
      Ometria.trackProfileIdentifiedByEmailEvent("test@gmail.com")
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)
      Ometria.trackProfileIdentifiedByCustomerIdEvent("test_customer_id")
    if (eventType === EventType.PROFILE_DEIDENTIFIED)
      Ometria.trackProfileDeidentifiedEvent()
    if (eventType === EventType.PRODUCT_VIEWED)
      Ometria.trackProductViewedEvent("product_1")
    if (eventType === EventType.PRODUCT_LISTING_VIEWED)
      Ometria.trackProductListingViewedEvent()
    if (eventType === EventType.WISH_LIST_ADDED_TO)
      Ometria.trackWishlistAddedToEvent("product_1")
    if (eventType === EventType.WISHLIST_REMOVED_FROM)
      Ometria.trackWishlistRemovedFromEvent("product_1")
    if (eventType === EventType.BASKET_VIEWED)
      Ometria.trackBasketViewedEvent()
    if (eventType === EventType.BASKET_UPDATED) {
      const items = {
        product1: ["product-1", "sku-product-1", 1, 12.0],
        product2: ["product-2", "sku-product-2", 1, 9.0],
        product3: ["product-3", "sku-product-3", 1, 20.0],
      }

      Object.values(items).map(([productId, sku, qty, price]) => {
        Ometria.addBasketItem(String(productId), String(sku), Number(qty), Number(price))
      })
      Ometria.trackBasketUpdatedEvent(12.0, 'USD')
    }
    if (eventType === EventType.ORDER_COMPLETED) {
      const items = {
        product1: ["product-1", "sku-product-1", 1, 12.0],
        product2: ["product-2", "sku-product-2", 1, 9.0],
        product3: ["product-3", "sku-product-3", 1, 20.0],
      }
      Object.values(items).map(([productId, sku, qty, price]) => {
        Ometria.addBasketItem(String(productId), String(sku), Number(qty), Number(price))
      })

      Ometria.trackOrderCompletedEvent('order-1', 12.0, 'USD')
    }
    if (eventType === EventType.CUSTOM)
      Ometria.trackCustomEvent("my_custom_type", [])
    if (eventType === EventType.FLUSH)
      Ometria.flush()
    if (eventType === EventType.CLEAR)
      Ometria.clear()
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Ometria.isLoggingEnabled(true)}
      >
        <Text>ENABLE LOGGING</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.PROFILE_IDENTIFIED_BY_EMAIL)}
      >
        <Text>{EventType.PROFILE_IDENTIFIED_BY_EMAIL}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)}
      >
        <Text>{EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.PROFILE_DEIDENTIFIED)}
      >
        <Text>{EventType.PROFILE_DEIDENTIFIED}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.PRODUCT_VIEWED)}
      >
        <Text>{EventType.PRODUCT_VIEWED}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.WISH_LIST_ADDED_TO)}
      >
        <Text>{EventType.WISH_LIST_ADDED_TO}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.WISHLIST_REMOVED_FROM)}
      >
        <Text>{EventType.WISHLIST_REMOVED_FROM}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.BASKET_VIEWED)}
      >
        <Text>{EventType.BASKET_VIEWED}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.BASKET_UPDATED)}
      >
        <Text>{EventType.BASKET_UPDATED}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.ORDER_COMPLETED)}
      >
        <Text>{EventType.ORDER_COMPLETED}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.DEEPLINK_OPENED_EVENT)}
      >
        <Text>{EventType.DEEPLINK_OPENED_EVENT}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.SCREEN_VIEWED)}
      >
        <Text>{EventType.SCREEN_VIEWED}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.CUSTOM)}
      >
        <Text>{EventType.CUSTOM}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.FLUSH)}
      >
        <Text>FLUSH EVENTS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendEvent(EventType.CLEAR)}
      >
        <Text>CLEAR EVENTS</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  // apiToken = 'pk_test_IY2XfgrRsIlRGBP0rH2ks9dAbG1Ov24BsdggNTqP',
  const [token, setToken] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (token) {
      console.log('token', token);

      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        Ometria.onMessageReceived(remoteMessage);
      });

      // Get the device token
      messaging().getToken().then(pushToken => Ometria.onNewToken(pushToken));

      // If using other push notification providers (ie Amazon SNS, etc)
      // you may need to get the APNs token instead for iOS:
      // if(Platform.OS == 'ios') { messaging().getAPNSToken().then(token => { return saveTokenToDatabase(token); }); }

      return () => {
        unsubscribe;
        // Listen to whether the token changes
        messaging().onTokenRefresh(pushToken => Ometria.onNewToken(pushToken))
      };
    }
    return;
  }, [token]);


  return (
    <ScrollView renderToHardwareTextureAndroid style={styles.container}>
      <Home onToken={async (value) => setToken(value)} />
      {Boolean(token) &&
        <>
          <Text style={styles.title}>EVENTS</Text>
          <Events />
        </>
      }
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { margin: 10 },
  title: { fontSize: 18, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  button: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CCC', padding: 12, alignItems: 'center' },
  gray: { backgroundColor: '#CCC' },
});
