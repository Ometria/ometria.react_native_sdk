import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import OmetriaReactNativeSdk from 'ometria.react-native_sdk';

export default function App({
  apiToken = 'pk_test_IY2XfgrRsIlRGBP0rH2ks9dAbG1Ov24BsdggNTqP',
}: {
  apiToken: string;
}) {
  const [token, setToken] = React.useState<string | undefined>();

  React.useEffect(() => {
    async function OmetriaInit() {
      await OmetriaReactNativeSdk.initializeWithApiToken(apiToken);
      setToken(apiToken);
    }
    OmetriaInit();
  }, [apiToken]);

  const handleBasketItem = React.useCallback((productId: string, sku: string, quantity: number, price: number) => {
    OmetriaReactNativeSdk.basketItem(productId, sku, quantity, price)
    console.log('handleBasketItem', { productId, sku, quantity, price });
  }, [])

  const handleBasket = React.useCallback((totalPrice: number, currency: string) => {
    OmetriaReactNativeSdk.basket(totalPrice, currency)
    console.log('handleBasket', { totalPrice, currency });
  }, [])

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
        onPress={() => handleBasketItem("product-1", "sku-product-1", 1, 12.0)}
      >
        <Text>BASKET UPDATED EVENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleBasket(12, "USD")}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CCC', padding: 12, alignItems: 'center' },
});
