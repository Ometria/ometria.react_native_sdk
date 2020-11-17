import * as React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import OmetriaReactNativeSdk from 'ometria.react-native_sdk';

export default function App({
  apiToken = 'as897da9cukjduas9',
}: {
  apiToken: string;
}) {
  const [token, setToken] = React.useState<string | undefined>();

  React.useEffect(() => {
    async function OmetriaInit() {
      const response = await OmetriaReactNativeSdk.initializeWithApiToken(
        apiToken
      );
      console.log('response', response);
      setToken(response);
    }

    OmetriaInit();
  }, [apiToken]);

  return (
    <View style={styles.container}>
      <Text>API Token:</Text>
      <Text>{token}</Text>
      <View>
        <Button
          title="Track profile identified event by customerID"
          onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByCustomerID('product0')}
        />
        <Button
          title="Track profile identified event by email"
          onPress={() => OmetriaReactNativeSdk.trackProfileIdentifiedEventByEmail('customer@email.com')}
        />
        <Button
          title="Track product viewed event"
          onPress={() => OmetriaReactNativeSdk.trackProductViewedEvent('product1')}
        />
        <Button
          title="Track product category viewed event"
          onPress={() => OmetriaReactNativeSdk.trackProductCategoryViewedEvent('category1')}
        />
        <Button
          title="Track wishlist added to event"
          onPress={() => OmetriaReactNativeSdk.trackWishlistAddedToEvent('product2')}
        />
        <Button
          title="Track wishlist removed from event"
          onPress={() => OmetriaReactNativeSdk.trackWishlistRemovedFromEvent()}
        />
        <Button
          title="Track basket viewed event"
          onPress={() => OmetriaReactNativeSdk.trackBasketViewedEvent()}
        />
        <Button
          title="Track basket updated event"
          onPress={() => {
            const myItem = OmetriaBasketItem({
              productId: "product-1",
              sku: "sku-product-1",
              quantity: 1,
              price: 12.0
            })
            const myItems = [myItem]
            const myBasket = OmetriaBasket({ totalPrice: 12.0, currency: "USD", items: myItems })
            OmetriaReactNativeSdk.trackBasketUpdatedEvent(myBasket)
          }}
        />
        <Button
          title="Track order completed event"
          onPress={() => OmetriaReactNativeSdk.trackOrderCompletedEvent('order1', {})}
        />
        <Button
          title="Track deeplink opened event"
          onPress={() => OmetriaReactNativeSdk.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen')}
        />
        <Button
          title="Track screen viewed event"
          onPress={() => OmetriaReactNativeSdk.trackScreenViewedEvent('OnboardingScreen', {})}
        />
        <Button
          title="Track custom event"
          onPress={() => OmetriaReactNativeSdk.trackCustomEvent('customEventType', {})}
        />
        <Button
          title="Flush events"
          onPress={() => OmetriaReactNativeSdk.flush()}
        />
        <Button
          title="Clear events"
          onPress={() => OmetriaReactNativeSdk.clear()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
