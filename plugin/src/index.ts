import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import { withOmetriaIos } from './withOmetriaIos';
import { withOmetriaAndroid } from './withOmetriaAndroid';

// Read version from main package.json
const pkg = require('../../package.json');

export type OmetriaPluginProps = {
  /**
   * iOS App Group Identifier for sharing data between main app and Notification Service Extension.
   * Required for rich push notifications to work.
   * Example: "group.com.yourcompany.yourapp"
   */
  appGroupIdentifier: string;

  /**
   * Ometria iOS SDK version for the Notification Service Extension.
   * Defaults to the version specified in the main package.json ometria_sdk_version.ios
   */
  ometriaIosSdkVersion?: string;
};

const withOmetria: ConfigPlugin<OmetriaPluginProps> = (config, props) => {
  if (!props?.appGroupIdentifier) {
    throw new Error(
      'react-native-ometria plugin requires appGroupIdentifier. ' +
        'Example: ["react-native-ometria", { "appGroupIdentifier": "group.com.yourcompany.yourapp" }]'
    );
  }

  const ometriaIosSdkVersion =
    props.ometriaIosSdkVersion || pkg.ometria_sdk_version?.ios || '1.8.4';

  const pluginProps = {
    ...props,
    ometriaIosSdkVersion,
  };

  // Apply iOS modifications
  config = withOmetriaIos(config, pluginProps);

  // Apply Android modifications
  config = withOmetriaAndroid(config);

  return config;
};

export default createRunOncePlugin(withOmetria, pkg.name, pkg.version);
