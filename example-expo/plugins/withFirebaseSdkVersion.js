// Pins the Firebase iOS SDK used by React Native Firebase by setting $FirebaseSDKVersion in the Podfile.
// 12.19.0 is the last Firebase release with FirebaseMessaging on CocoaPods (13.x is SPM only).
const { withPodfile } = require('expo/config-plugins');

module.exports = function withFirebaseSdkVersion(config, version) {
  return withPodfile(config, (modConfig) => {
    const contents = modConfig.modResults.contents;
    if (!contents.includes('$FirebaseSDKVersion')) {
      modConfig.modResults.contents = `$FirebaseSDKVersion = '${version}'\n${contents}`;
    }
    return modConfig;
  });
};
