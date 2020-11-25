import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
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

  const handleBasketItem = React.useCallback(async (
    productId: string,
    sku: string,
    quantity: number,
    price: number
  ) => {
    const basketItem = await OmetriaReactNativeSdk.basketItem(
      productId,
      sku,
      quantity,
      price
    );
    console.log('handleBasketItem', basketItem)
  }, [])

  return (
    <View style={styles.container}>
      <Text>Ometria example</Text>

      <View>

        <TouchableOpacity
          onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByCustomerID('customer1')}
        >
          <Text>Track profile identified event by customerID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByEmail('customer@email.com')}
        >
          <Text>Track profile identified event by email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => OmetriaReactNativeSdk.trackProductViewedEvent('product1')}
        >
          <Text>Track product viewed event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleBasketItem("product-1", "sku-product-1", 1, 12.0)}
        >
          <Text>Track basket updated event</Text>
        </TouchableOpacity>

        {/* 
        <TouchableOpacity
          title="Track product category viewed event"
          onPress={() => OmetriaReactNativeSdk.trackProductCategoryViewedEvent('category1')}
        />
        <TouchableOpacity
          title="Track wishlist added to event"
          onPress={() => OmetriaReactNativeSdk.trackWishlistAddedToEvent('product2')}
        />
        <TouchableOpacity
          title="Track wishlist removed from event"
          onPress={() => OmetriaReactNativeSdk.trackWishlistRemovedFromEvent()}
        />
        <TouchableOpacity
          title="Track basket viewed event"
          onPress={() => OmetriaReactNativeSdk.trackBasketViewedEvent()}
        />
        
        <TouchableOpacity
          title="Track basket updated event"
          onPress={() => {
            const myItem = OmetriaBasketItem(
              productId: "product-1",
              sku: "sku-product-1",
              quantity: 1,
              price: 12.0
            )
            const myItems = [myItem]
            const myBasket = OmetriaBasket({ totalPrice: 12.0, currency: "USD", items: myItems })
            OmetriaReactNativeSdk.trackBasketUpdatedEvent(myBasket)
          }}
        />
        <TouchableOpacity
          title="Track order completed event"
          onPress={() => OmetriaReactNativeSdk.trackOrderCompletedEvent('order1', {})}
        /> 
        <TouchableOpacity
          title="Track deeplink opened event"
          onPress={() => OmetriaReactNativeSdk.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen')}
        />
        <TouchableOpacity
          title="Track screen viewed event"
          onPress={() => OmetriaReactNativeSdk.trackScreenViewedEvent('OnboardingScreen', {})}
        />
        <TouchableOpacity
          title="Track custom event"
          onPress={() => OmetriaReactNativeSdk.trackCustomEvent('customEventType', {})}
        />
        <TouchableOpacity
          title="Flush events"
          onPress={() => OmetriaReactNativeSdk.flush()}
        />
        <TouchableOpacity
          title="Clear events"
          onPress={() => OmetriaReactNativeSdk.clear()}
        />*/}
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
