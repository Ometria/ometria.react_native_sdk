import { ConfigPlugin } from '@expo/config-plugins';
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
declare const _default: ConfigPlugin<OmetriaPluginProps | undefined>;
export default _default;
