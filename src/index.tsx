import { NativeModules } from 'react-native';

type OmetriaReactNativeSdkType = {
  multiply(a: number, b: number): Promise<number>;
  initializeWithApiToken(token: string): Promise<any>;
};

const { OmetriaReactNativeSdk } = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
