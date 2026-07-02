import { ConfigPlugin } from '@expo/config-plugins';
type IosPluginProps = {
    customAppGroupIdentifier?: string;
    ometriaIosSdkVersion: string;
    skipNSE: boolean;
    rnSdkVersion: string;
    apsEnvironment?: 'development' | 'production';
};
/**
 * Main iOS configuration for Ometria
 */
export declare const withOmetriaIos: ConfigPlugin<IosPluginProps>;
export {};
