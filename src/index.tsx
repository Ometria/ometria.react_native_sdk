import { NativeModules } from 'react-native';

type OmetriaReactNativeSdkType = {
  multiply(a: number, b: number): Promise<number>;
};

const { OmetriaReactNativeSdk } = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
