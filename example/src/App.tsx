import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import OmetriaReactNativeSdk from 'ometria.react-native_sdk';
import messaging from '@react-native-firebase/messaging';

export default function App({
  apiToken = 'pk_test_IY2XfgrRsIlRGBP0rH2ks9dAbG1Ov24BsdggNTqP',
}: {
  apiToken: string;
}) {
  const [token, setToken] = React.useState<string | undefined>();

  React.useEffect(() => {
    // Get the device token
    messaging()
      .getToken()
      .then(pushToken => {
        console.log('getToken', pushToken);
        OmetriaReactNativeSdk.onNewToken(pushToken);
      });

    // If using other push notification providers (ie Amazon SNS, etc)
    // you may need to get the APNs token instead for iOS:
    // if(Platform.OS == 'ios') { messaging().getAPNSToken().then(token => { return saveTokenToDatabase(token); }); }

    // Listen to whether the token changes
    return messaging().onTokenRefresh(pushToken => {
      console.log('onTokenRefresh', pushToken);
      OmetriaReactNativeSdk.onNewToken(pushToken);
    });
  }, []);

  React.useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      // console.log('onMessage', JSON.stringify(remoteMessage));
      OmetriaReactNativeSdk.onMessageReceived(remoteMessage);
      // onMessage {"collapseKey": "61dae09c4fc04640aa4f92bc769112e5", "data": {"body": "hello sent at 09/12/2020 - 15:59:25", "ometria": "{\"imageUrl\": \"https://upload.wikimedia.org/wikipedia/commons/f/f9/Phoenicopterus_ruber_in_S%C3%A3o_Paulo_Zoo.jpg\", \"deepLinkActionUrl\": \"https://ometria\", \"context\": {\"account_id\": 352, \"om_customer_id\": 1, \"send_id\": \"61dae09c4fc04640aa4f92bc769112e5\", \"ts\": \"09/12/2020 - 15:59:25\"}}", "title": "Ometria Push E2E Demo"}, "from": "921921093359", "messageId": "0:1607522366345466%702ff5107f6b87be", "sentTime": 1607522366341, "ttl": 2419200}
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    async function OmetriaInit() {
      await OmetriaReactNativeSdk.initializeWithApiToken(apiToken);
      setToken(apiToken);
      OmetriaReactNativeSdk.isLoggingEnabled(true)
    }
    OmetriaInit();
  }, [apiToken]);

  return (
    <ScrollView>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.isLoggingEnabled(true)}
      >
        <Text>ENABLE LOGGING</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByCustomerID('customer1')}
      >
        <Text>PROFILE IDENTIFIED EVENT BY CUSTOMER_ID</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByEmail('customer@email.com')}
      >
        <Text>PROFILE IDENTIFIED EVENT BY EMAIL</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackProductViewedEvent('product1')}
      >
        <Text>PRODUCT VIEWED EVENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackProductCategoryViewedEvent('category1')}
      >
        <Text>PRODUCT CATEGORY VIEWED EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackWishlistAddedToEvent('product2')}
      >
        <Text>WISHLIST ADDED TO EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackWishlistRemovedFromEvent('product3')}
      >
        <Text>WISHLIST REMOVED FROM EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackBasketViewedEvent()}
      >
        <Text>BASKET VIEWED EVENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const items = {
            product1: ["product-1", "sku-product-1", 1, 12.0],
            product2: ["product-2", "sku-product-2", 1, 9.0],
            product3: ["product-3", "sku-product-3", 1, 20.0],
          }

          Object.values(items).map(([productId, sku, qty, price]) => {
            // @ts-ignore
            OmetriaReactNativeSdk.addBasketItem(productId, sku, qty, price)
          })
          OmetriaReactNativeSdk.trackBasketUpdatedEvent(12.0, 'USD')
        }}
      >
        <Text>BASKET UPDATED EVENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const items = {
            product1: ["product-1", "sku-product-1", 1, 12.0],
            product2: ["product-2", "sku-product-2", 1, 9.0],
            product3: ["product-3", "sku-product-3", 1, 20.0],
          }

          Object.values(items).map(([productId, sku, qty, price]) => {
            // @ts-ignore
            OmetriaReactNativeSdk.addBasketItem(productId, sku, qty, price)
          })

          OmetriaReactNativeSdk.trackOrderCompletedEvent('order-1', 12.0, 'USD')
        }}
      >
        <Text>ORDER COMPLETED EVENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen')}
      >
        <Text>DEEPLINK OPENED EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackScreenViewedEvent('OnboardingScreen', { "a": "1", "b": "2" })}
      // onPress={() => OmetriaReactNativeSdk.trackScreenViewedEvent('OnboardingScreen',
      //   // new Map([["1", "one"], ["2", "two"], ["3", "tree"]])
      //   [{ "1": "one" }, { "2": "two" }, { "3": "tree" }]
      // )}
      >
        <Text>SCREEN VIEWED EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.trackCustomEvent('customEventType', {})}
      >
        <Text>CUSTOM EVENT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.flush()}
      >
        <Text>FLUSH EVENTS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => OmetriaReactNativeSdk.clear()}
      >
        <Text>CLEAR EVENTS</Text>
      </TouchableOpacity>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CCC', padding: 12, alignItems: 'center' },
});
