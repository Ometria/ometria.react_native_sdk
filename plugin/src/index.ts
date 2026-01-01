import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import { withOmetriaIos } from './withOmetriaIos';
import { withOmetriaAndroid } from './withOmetriaAndroid';

// Read version from main package.json
const pkg = require('../../package.json');

export type OmetriaPluginProps = {
  /**
   * Custom iOS App Group Identifier. If not provided, it will be auto-generated
   * from ios.bundleIdentifier as "group.{bundleIdentifier}".
   * Example: "group.com.yourcompany.yourapp"
   */
  customAppGroupIdentifier?: string;

  /**
   * Skip the Notification Service Extension setup.
   * When true, rich push notification content (images, etc.) will not work on iOS.
   * Defaults to false.
   */
  skipNSE?: boolean;
};

const withOmetria: ConfigPlugin<OmetriaPluginProps | undefined> = (
  config,
  props
) => {
  const ometriaIosSdkVersion = pkg.ometria_sdk_version?.ios || '1.8.4';

  // Apply iOS modifications
  config = withOmetriaIos(config, {
    customAppGroupIdentifier: props?.customAppGroupIdentifier,
    skipNSE: props?.skipNSE ?? false,
    ometriaIosSdkVersion,
  });

  // Apply Android modifications
  config = withOmetriaAndroid(config);

  return config;
};

export default createRunOncePlugin(withOmetria, pkg.name, pkg.version);
