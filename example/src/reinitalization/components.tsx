import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

/**
 * [Test mode] Test Component to allow token changes
 *
 * Not for production usage
 */
const TestComponent = ({
  token,
  setToken,
  saveToken,
  onSuccess,
}: {
  token: string;
  setToken: (token: string) => void;
  saveToken: (
    valueToSave: string,
    onSuccess: (token: string) => Promise<void>
  ) => void;
  onSuccess: (token: string) => Promise<void>;
}) => {
  return (
    <>
      <TextInput
        style={styles.input}
        placeholder="Ometria API TOKEN"
        placeholderTextColor="#000"
        value={token}
        onChangeText={setToken}
      />
      <TouchableOpacity
        style={styles.btn}
        onPress={() => saveToken(token, onSuccess)}
      >
        <Text style={styles.text}>Save Ometria pushToken</Text>
      </TouchableOpacity>
    </>
  );
};

export default TestComponent;

const styles = StyleSheet.create({
  text: {
    color: '#FFF',
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
});
