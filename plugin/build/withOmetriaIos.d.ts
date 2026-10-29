import { ConfigPlugin } from '@expo/config-plugins';
type IosPluginProps = {
    customAppGroupIdentifier?: string;
    ometriaIosSdkVersion: string;
    skipNSE: boolean;
    rnSdkVersion: string;
    apsEnvironment?: 'development' | 'production';
};
/**
 * Only Swift AppDelegates of apps that use React Native Firebase with a GoogleService-Info.plist
 * get FirebaseApp.configure(); without the plist, configure() would crash at launch.
 */
export declare function shouldAddFirebaseConfigure(language: string, googleServicesFile: string | undefined, projectRoot: string): boolean;
export declare function addFirebaseConfigure(appDelegate: string): string;
/**
 * Main iOS configuration for Ometria
 */
export declare const withOmetriaIos: ConfigPlugin<IosPluginProps>;
export {};
