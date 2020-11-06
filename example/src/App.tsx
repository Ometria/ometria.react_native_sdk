import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
