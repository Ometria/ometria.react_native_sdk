import { ConfigPlugin } from '@expo/config-plugins';
export type NSEPluginProps = {
    appGroupIdentifier: string;
    ometriaIosSdkVersion: string;
};
/**
 * Main NSE configuration for Ometria
 */
export declare const withNotificationServiceExtension: ConfigPlugin<NSEPluginProps>;
