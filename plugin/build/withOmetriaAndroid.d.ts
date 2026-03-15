import { ConfigPlugin } from '@expo/config-plugins';
type AndroidPluginProps = {
    rnSdkVersion: string;
};
/**
 * Main Android configuration for Ometria
 */
export declare const withOmetriaAndroid: ConfigPlugin<AndroidPluginProps>;
export {};
