"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withOmetriaAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Writes the RN SDK version to AndroidManifest.xml as meta-data
 * so the native module can read it instead of using a hardcoded value.
 */
const withOmetriaRnSdkVersion = (config, props) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (modConfig) => {
        const mainApplication = modConfig.modResults.manifest.application?.[0];
        if (mainApplication) {
            mainApplication['meta-data'] = mainApplication['meta-data'] || [];
            // Remove existing entry if present
            mainApplication['meta-data'] = mainApplication['meta-data'].filter((item) => item.$?.['android:name'] !== 'OmetriaRNSdkVersion');
            mainApplication['meta-data'].push({
                $: {
                    'android:name': 'OmetriaRNSdkVersion',
                    'android:value': props.rnSdkVersion,
                },
            });
        }
        return modConfig;
    });
};
/**
 * Main Android configuration for Ometria
 */
const withOmetriaAndroid = (config, props) => {
    // Warn if Firebase is detected — user must configure it via @react-native-firebase/app plugin
    const projectRoot = config._internal?.projectRoot ?? process.cwd();
    const pkgPath = path.join(projectRoot, 'package.json');
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@react-native-firebase/app']) {
            const plugins = config.plugins ?? [];
            const hasFirebasePlugin = plugins.some((p) => p === '@react-native-firebase/app' || (Array.isArray(p) && p[0] === '@react-native-firebase/app'));
            if (!hasFirebasePlugin) {
                console.warn('[react-native-ometria] Firebase detected. Add "@react-native-firebase/app" to your ' +
                    'plugins array in app.json to configure Google Services for Android. ' +
                    'See: https://rnfirebase.io (Expo setup section).');
            }
        }
    }
    catch {
        // ignore — package.json unreadable
    }
    config = withOmetriaRnSdkVersion(config, props);
    return config;
};
exports.withOmetriaAndroid = withOmetriaAndroid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE9tZXRyaWFBbmRyb2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dpdGhPbWV0cmlhQW5kcm9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5REFHOEI7QUFDOUIsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQU03Qjs7O0dBR0c7QUFDSCxNQUFNLHVCQUF1QixHQUFxQyxDQUNoRSxNQUFNLEVBQ04sS0FBSyxFQUNMLEVBQUU7SUFDRixPQUFPLElBQUEsb0NBQW1CLEVBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDL0MsTUFBTSxlQUFlLEdBQ25CLFNBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksZUFBZSxFQUFFLENBQUM7WUFDcEIsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEUsbUNBQW1DO1lBQ25DLGVBQWUsQ0FBQyxXQUFXLENBQUMsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUNoRSxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLHFCQUFxQixDQUNsRSxDQUFDO1lBQ0YsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDaEMsQ0FBQyxFQUFFO29CQUNELGNBQWMsRUFBRSxxQkFBcUI7b0JBQ3JDLGVBQWUsRUFBRSxLQUFLLENBQUMsWUFBWTtpQkFDcEM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRjs7R0FFRztBQUNJLE1BQU0sa0JBQWtCLEdBQXFDLENBQ2xFLE1BQU0sRUFDTixLQUFLLEVBQ0wsRUFBRTtJQUNGLDhGQUE4RjtJQUM5RixNQUFNLFdBQVcsR0FBSSxNQUFjLENBQUMsU0FBUyxFQUFFLFdBQVcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDNUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDdkQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvRCxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLFlBQVksRUFBRSxHQUFHLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUM3RCxJQUFJLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxPQUFPLEdBQWUsTUFBYyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDekQsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUNwQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLDRCQUE0QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssNEJBQTRCLENBQUMsQ0FDekcsQ0FBQztZQUNGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN2QixPQUFPLENBQUMsSUFBSSxDQUNWLHFGQUFxRjtvQkFDckYsc0VBQXNFO29CQUN0RSxrREFBa0QsQ0FDbkQsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLG1DQUFtQztJQUNyQyxDQUFDO0lBRUQsTUFBTSxHQUFHLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUE3QlcsUUFBQSxrQkFBa0Isc0JBNkI3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbmZpZ1BsdWdpbixcbiAgd2l0aEFuZHJvaWRNYW5pZmVzdCxcbn0gZnJvbSAnQGV4cG8vY29uZmlnLXBsdWdpbnMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxudHlwZSBBbmRyb2lkUGx1Z2luUHJvcHMgPSB7XG4gIHJuU2RrVmVyc2lvbjogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBXcml0ZXMgdGhlIFJOIFNESyB2ZXJzaW9uIHRvIEFuZHJvaWRNYW5pZmVzdC54bWwgYXMgbWV0YS1kYXRhXG4gKiBzbyB0aGUgbmF0aXZlIG1vZHVsZSBjYW4gcmVhZCBpdCBpbnN0ZWFkIG9mIHVzaW5nIGEgaGFyZGNvZGVkIHZhbHVlLlxuICovXG5jb25zdCB3aXRoT21ldHJpYVJuU2RrVmVyc2lvbjogQ29uZmlnUGx1Z2luPEFuZHJvaWRQbHVnaW5Qcm9wcz4gPSAoXG4gIGNvbmZpZyxcbiAgcHJvcHNcbikgPT4ge1xuICByZXR1cm4gd2l0aEFuZHJvaWRNYW5pZmVzdChjb25maWcsIChtb2RDb25maWcpID0+IHtcbiAgICBjb25zdCBtYWluQXBwbGljYXRpb24gPVxuICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHMubWFuaWZlc3QuYXBwbGljYXRpb24/LlswXTtcbiAgICBpZiAobWFpbkFwcGxpY2F0aW9uKSB7XG4gICAgICBtYWluQXBwbGljYXRpb25bJ21ldGEtZGF0YSddID0gbWFpbkFwcGxpY2F0aW9uWydtZXRhLWRhdGEnXSB8fCBbXTtcbiAgICAgIC8vIFJlbW92ZSBleGlzdGluZyBlbnRyeSBpZiBwcmVzZW50XG4gICAgICBtYWluQXBwbGljYXRpb25bJ21ldGEtZGF0YSddID0gbWFpbkFwcGxpY2F0aW9uWydtZXRhLWRhdGEnXS5maWx0ZXIoXG4gICAgICAgIChpdGVtOiBhbnkpID0+IGl0ZW0uJD8uWydhbmRyb2lkOm5hbWUnXSAhPT0gJ09tZXRyaWFSTlNka1ZlcnNpb24nXG4gICAgICApO1xuICAgICAgbWFpbkFwcGxpY2F0aW9uWydtZXRhLWRhdGEnXS5wdXNoKHtcbiAgICAgICAgJDoge1xuICAgICAgICAgICdhbmRyb2lkOm5hbWUnOiAnT21ldHJpYVJOU2RrVmVyc2lvbicsXG4gICAgICAgICAgJ2FuZHJvaWQ6dmFsdWUnOiBwcm9wcy5yblNka1ZlcnNpb24sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG1vZENvbmZpZztcbiAgfSk7XG59O1xuXG4vKipcbiAqIE1haW4gQW5kcm9pZCBjb25maWd1cmF0aW9uIGZvciBPbWV0cmlhXG4gKi9cbmV4cG9ydCBjb25zdCB3aXRoT21ldHJpYUFuZHJvaWQ6IENvbmZpZ1BsdWdpbjxBbmRyb2lkUGx1Z2luUHJvcHM+ID0gKFxuICBjb25maWcsXG4gIHByb3BzXG4pID0+IHtcbiAgLy8gV2FybiBpZiBGaXJlYmFzZSBpcyBkZXRlY3RlZCDigJQgdXNlciBtdXN0IGNvbmZpZ3VyZSBpdCB2aWEgQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHAgcGx1Z2luXG4gIGNvbnN0IHByb2plY3RSb290ID0gKGNvbmZpZyBhcyBhbnkpLl9pbnRlcm5hbD8ucHJvamVjdFJvb3QgPz8gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgcGtnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0Um9vdCwgJ3BhY2thZ2UuanNvbicpO1xuICB0cnkge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGY4JykpID8/IHt9O1xuICAgIGNvbnN0IGRlcHMgPSB7IC4uLnBrZy5kZXBlbmRlbmNpZXMsIC4uLnBrZy5kZXZEZXBlbmRlbmNpZXMgfTtcbiAgICBpZiAoZGVwc1snQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHAnXSkge1xuICAgICAgY29uc3QgcGx1Z2luczogdW5rbm93bltdID0gKGNvbmZpZyBhcyBhbnkpLnBsdWdpbnMgPz8gW107XG4gICAgICBjb25zdCBoYXNGaXJlYmFzZVBsdWdpbiA9IHBsdWdpbnMuc29tZShcbiAgICAgICAgKHApID0+IHAgPT09ICdAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCcgfHwgKEFycmF5LmlzQXJyYXkocCkgJiYgcFswXSA9PT0gJ0ByZWFjdC1uYXRpdmUtZmlyZWJhc2UvYXBwJylcbiAgICAgICk7XG4gICAgICBpZiAoIWhhc0ZpcmViYXNlUGx1Z2luKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBGaXJlYmFzZSBkZXRlY3RlZC4gQWRkIFwiQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHBcIiB0byB5b3VyICcgK1xuICAgICAgICAgICdwbHVnaW5zIGFycmF5IGluIGFwcC5qc29uIHRvIGNvbmZpZ3VyZSBHb29nbGUgU2VydmljZXMgZm9yIEFuZHJvaWQuICcgK1xuICAgICAgICAgICdTZWU6IGh0dHBzOi8vcm5maXJlYmFzZS5pbyAoRXhwbyBzZXR1cCBzZWN0aW9uKS4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmUg4oCUIHBhY2thZ2UuanNvbiB1bnJlYWRhYmxlXG4gIH1cblxuICBjb25maWcgPSB3aXRoT21ldHJpYVJuU2RrVmVyc2lvbihjb25maWcsIHByb3BzKTtcbiAgcmV0dXJuIGNvbmZpZztcbn07XG4iXX0=