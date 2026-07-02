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
exports.withNotificationServiceExtension = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NSE_TARGET_NAME = 'OmetriaNotificationServiceExtension';
const NSE_FOLDER_NAME = 'OmetriaNotificationServiceExtension';
/**
 * Creates the Notification Service Extension files
 */
const withNSEFiles = (config, props) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (modConfig) => {
            const iosPath = path.join(modConfig.modRequest.projectRoot, 'ios');
            const nsePath = path.join(iosPath, NSE_FOLDER_NAME);
            // Create NSE directory
            if (!fs.existsSync(nsePath)) {
                fs.mkdirSync(nsePath, { recursive: true });
            }
            // Create NotificationService.swift
            const swiftContent = generateNotificationServiceSwift(props.appGroupIdentifier);
            fs.writeFileSync(path.join(nsePath, 'NotificationService.swift'), swiftContent);
            // Create Info.plist
            const infoPlistContent = generateInfoPlist();
            fs.writeFileSync(path.join(nsePath, `${NSE_TARGET_NAME}-Info.plist`), infoPlistContent);
            // Create Entitlements
            const entitlementsContent = generateEntitlements(props.appGroupIdentifier);
            fs.writeFileSync(path.join(nsePath, `${NSE_TARGET_NAME}.entitlements`), entitlementsContent);
            return modConfig;
        },
    ]);
};
/**
 * Adds the NSE target to the Xcode project using proper xcode library methods
 */
const withNSETarget = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, (_config) => {
        const xcodeProject = _config.modResults;
        const appName = _config.modRequest.projectName || 'App';
        const bundleIdentifier = _config.ios?.bundleIdentifier || 'com.example.app';
        const buildNumber = _config.ios?.buildNumber || '1';
        const marketingVersion = _config.version || '1.0.0';
        // Get deployment target from project build settings (synced with main app)
        const MIN_DEPLOYMENT_TARGET = 15.1;
        let highestDeploymentTarget = MIN_DEPLOYMENT_TARGET;
        let deploymentTarget = '15.1'; // Default minimum for Ometria SDK
        const buildConfigs = xcodeProject.hash.project.objects.XCBuildConfiguration || {};
        for (const [key, value] of Object.entries(buildConfigs)) {
            if (key.endsWith('_comment'))
                continue;
            const configObj = value;
            if (configObj.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
                const target = configObj.buildSettings.IPHONEOS_DEPLOYMENT_TARGET.replace(/"/g, '');
                const parsed = parseFloat(target);
                // Use the highest deployment target found across all configurations (at least 15.1 for Ometria)
                if (!isNaN(parsed) && parsed > highestDeploymentTarget) {
                    highestDeploymentTarget = parsed;
                    deploymentTarget = target;
                }
            }
        }
        // Check if target already exists
        if (xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
            console.log(`[Ometria] ${NSE_TARGET_NAME} target already exists`);
            return _config;
        }
        // Add the NSE target
        const targetUuid = xcodeProject.generateUuid();
        const productUuid = xcodeProject.generateUuid();
        const buildConfigurationListUuid = xcodeProject.generateUuid();
        const debugBuildConfigUuid = xcodeProject.generateUuid();
        const releaseBuildConfigUuid = xcodeProject.generateUuid();
        const sourcesBuildPhaseUuid = xcodeProject.generateUuid();
        const frameworksBuildPhaseUuid = xcodeProject.generateUuid();
        const resourcesBuildPhaseUuid = xcodeProject.generateUuid();
        const groupUuid = xcodeProject.generateUuid();
        // Common build settings for NSE
        const commonBuildSettings = {
            CLANG_ENABLE_MODULES: 'YES',
            CODE_SIGN_ENTITLEMENTS: `${NSE_FOLDER_NAME}/${NSE_TARGET_NAME}.entitlements`,
            CODE_SIGN_STYLE: 'Automatic',
            CURRENT_PROJECT_VERSION: buildNumber,
            GENERATE_INFOPLIST_FILE: 'NO',
            INFOPLIST_FILE: `${NSE_FOLDER_NAME}/${NSE_TARGET_NAME}-Info.plist`,
            IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
            MARKETING_VERSION: marketingVersion,
            PRODUCT_BUNDLE_IDENTIFIER: `${bundleIdentifier}.${NSE_TARGET_NAME}`,
            PRODUCT_NAME: `"$(TARGET_NAME)"`,
            SKIP_INSTALL: 'YES',
            SWIFT_EMIT_LOC_STRINGS: 'YES',
            SWIFT_VERSION: '5.0',
            TARGETED_DEVICE_FAMILY: `"1,2"`,
        };
        // Add build configurations
        xcodeProject.hash.project.objects.XCBuildConfiguration =
            xcodeProject.hash.project.objects.XCBuildConfiguration || {};
        xcodeProject.hash.project.objects.XCBuildConfiguration[debugBuildConfigUuid] = {
            isa: 'XCBuildConfiguration',
            buildSettings: {
                ...commonBuildSettings,
                DEBUG_INFORMATION_FORMAT: 'dwarf',
            },
            name: 'Debug',
        };
        xcodeProject.hash.project.objects.XCBuildConfiguration[`${debugBuildConfigUuid}_comment`] = 'Debug';
        xcodeProject.hash.project.objects.XCBuildConfiguration[releaseBuildConfigUuid] = {
            isa: 'XCBuildConfiguration',
            buildSettings: {
                ...commonBuildSettings,
                DEBUG_INFORMATION_FORMAT: `"dwarf-with-dsym"`,
            },
            name: 'Release',
        };
        xcodeProject.hash.project.objects.XCBuildConfiguration[`${releaseBuildConfigUuid}_comment`] = 'Release';
        // Add build configuration list
        xcodeProject.hash.project.objects.XCConfigurationList =
            xcodeProject.hash.project.objects.XCConfigurationList || {};
        xcodeProject.hash.project.objects.XCConfigurationList[buildConfigurationListUuid] = {
            isa: 'XCConfigurationList',
            buildConfigurations: [
                { value: debugBuildConfigUuid, comment: 'Debug' },
                { value: releaseBuildConfigUuid, comment: 'Release' },
            ],
            defaultConfigurationIsVisible: 0,
            defaultConfigurationName: 'Release',
        };
        xcodeProject.hash.project.objects.XCConfigurationList[`${buildConfigurationListUuid}_comment`] = `Build configuration list for PBXNativeTarget "${NSE_TARGET_NAME}"`;
        // Add source file reference
        const swiftFileUuid = xcodeProject.generateUuid();
        const swiftFileBuildUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects.PBXFileReference =
            xcodeProject.hash.project.objects.PBXFileReference || {};
        xcodeProject.hash.project.objects.PBXFileReference[swiftFileUuid] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'sourcecode.swift',
            path: 'NotificationService.swift',
            sourceTree: '"<group>"',
        };
        xcodeProject.hash.project.objects.PBXFileReference[`${swiftFileUuid}_comment`] = 'NotificationService.swift';
        // Add plist file reference
        const plistFileUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects.PBXFileReference[plistFileUuid] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'text.plist.xml',
            path: `${NSE_TARGET_NAME}-Info.plist`,
            sourceTree: '"<group>"',
        };
        xcodeProject.hash.project.objects.PBXFileReference[`${plistFileUuid}_comment`] = `${NSE_TARGET_NAME}-Info.plist`;
        // Add entitlements file reference
        const entitlementsFileUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects.PBXFileReference[entitlementsFileUuid] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'text.plist.entitlements',
            path: `${NSE_TARGET_NAME}.entitlements`,
            sourceTree: '"<group>"',
        };
        xcodeProject.hash.project.objects.PBXFileReference[`${entitlementsFileUuid}_comment`] = `${NSE_TARGET_NAME}.entitlements`;
        // Add product reference
        xcodeProject.hash.project.objects.PBXFileReference[productUuid] = {
            isa: 'PBXFileReference',
            explicitFileType: `"wrapper.app-extension"`,
            includeInIndex: 0,
            path: `${NSE_TARGET_NAME}.appex`,
            sourceTree: 'BUILT_PRODUCTS_DIR',
        };
        xcodeProject.hash.project.objects.PBXFileReference[`${productUuid}_comment`] = `${NSE_TARGET_NAME}.appex`;
        // Add build file for swift source
        xcodeProject.hash.project.objects.PBXBuildFile =
            xcodeProject.hash.project.objects.PBXBuildFile || {};
        xcodeProject.hash.project.objects.PBXBuildFile[swiftFileBuildUuid] = {
            isa: 'PBXBuildFile',
            fileRef: swiftFileUuid,
            fileRef_comment: 'NotificationService.swift',
        };
        xcodeProject.hash.project.objects.PBXBuildFile[`${swiftFileBuildUuid}_comment`] = 'NotificationService.swift in Sources';
        // Add group for NSE files
        xcodeProject.hash.project.objects.PBXGroup =
            xcodeProject.hash.project.objects.PBXGroup || {};
        xcodeProject.hash.project.objects.PBXGroup[groupUuid] = {
            isa: 'PBXGroup',
            children: [
                { value: swiftFileUuid, comment: 'NotificationService.swift' },
                { value: plistFileUuid, comment: `${NSE_TARGET_NAME}-Info.plist` },
                {
                    value: entitlementsFileUuid,
                    comment: `${NSE_TARGET_NAME}.entitlements`,
                },
            ],
            path: NSE_FOLDER_NAME,
            sourceTree: '"<group>"',
        };
        xcodeProject.hash.project.objects.PBXGroup[`${groupUuid}_comment`] =
            NSE_TARGET_NAME;
        // Add group to main group
        const mainGroupUuid = xcodeProject.getFirstProject().firstProject.mainGroup;
        const mainGroup = xcodeProject.hash.project.objects.PBXGroup[mainGroupUuid];
        if (mainGroup && mainGroup.children) {
            mainGroup.children.push({ value: groupUuid, comment: NSE_TARGET_NAME });
        }
        // Add product to Products group
        const productsGroupUuid = xcodeProject.pbxGroupByName('Products')?.uuid;
        if (productsGroupUuid) {
            const productsGroup = xcodeProject.hash.project.objects.PBXGroup[productsGroupUuid];
            if (productsGroup && productsGroup.children) {
                productsGroup.children.push({
                    value: productUuid,
                    comment: `${NSE_TARGET_NAME}.appex`,
                });
            }
        }
        // Add build phases
        xcodeProject.hash.project.objects.PBXSourcesBuildPhase =
            xcodeProject.hash.project.objects.PBXSourcesBuildPhase || {};
        xcodeProject.hash.project.objects.PBXSourcesBuildPhase[sourcesBuildPhaseUuid] = {
            isa: 'PBXSourcesBuildPhase',
            buildActionMask: 2147483647,
            files: [
                {
                    value: swiftFileBuildUuid,
                    comment: 'NotificationService.swift in Sources',
                },
            ],
            runOnlyForDeploymentPostprocessing: 0,
        };
        xcodeProject.hash.project.objects.PBXSourcesBuildPhase[`${sourcesBuildPhaseUuid}_comment`] = 'Sources';
        xcodeProject.hash.project.objects.PBXFrameworksBuildPhase =
            xcodeProject.hash.project.objects.PBXFrameworksBuildPhase || {};
        xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[frameworksBuildPhaseUuid] = {
            isa: 'PBXFrameworksBuildPhase',
            buildActionMask: 2147483647,
            files: [],
            runOnlyForDeploymentPostprocessing: 0,
        };
        xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[`${frameworksBuildPhaseUuid}_comment`] = 'Frameworks';
        xcodeProject.hash.project.objects.PBXResourcesBuildPhase =
            xcodeProject.hash.project.objects.PBXResourcesBuildPhase || {};
        xcodeProject.hash.project.objects.PBXResourcesBuildPhase[resourcesBuildPhaseUuid] = {
            isa: 'PBXResourcesBuildPhase',
            buildActionMask: 2147483647,
            files: [],
            runOnlyForDeploymentPostprocessing: 0,
        };
        xcodeProject.hash.project.objects.PBXResourcesBuildPhase[`${resourcesBuildPhaseUuid}_comment`] = 'Resources';
        // Add native target
        xcodeProject.hash.project.objects.PBXNativeTarget =
            xcodeProject.hash.project.objects.PBXNativeTarget || {};
        xcodeProject.hash.project.objects.PBXNativeTarget[targetUuid] = {
            isa: 'PBXNativeTarget',
            buildConfigurationList: buildConfigurationListUuid,
            buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${NSE_TARGET_NAME}"`,
            buildPhases: [
                { value: sourcesBuildPhaseUuid, comment: 'Sources' },
                { value: frameworksBuildPhaseUuid, comment: 'Frameworks' },
                { value: resourcesBuildPhaseUuid, comment: 'Resources' },
            ],
            buildRules: [],
            dependencies: [],
            name: `"${NSE_TARGET_NAME}"`,
            productName: `"${NSE_TARGET_NAME}"`,
            productReference: productUuid,
            productReference_comment: `${NSE_TARGET_NAME}.appex`,
            productType: `"com.apple.product-type.app-extension"`,
        };
        xcodeProject.hash.project.objects.PBXNativeTarget[`${targetUuid}_comment`] =
            NSE_TARGET_NAME;
        // Add target to project
        const firstProject = xcodeProject.getFirstProject();
        const projectUuid = firstProject.uuid;
        const projectObject = firstProject.firstProject;
        if (projectObject.targets) {
            projectObject.targets.push({
                value: targetUuid,
                comment: NSE_TARGET_NAME,
            });
        }
        // Find the main app target UUID by iterating through PBXNativeTarget objects
        // pbxTargetByName doesn't reliably give us the key needed for hash access
        const nativeTargets = xcodeProject.hash.project.objects.PBXNativeTarget || {};
        let mainAppTargetUuid = null;
        for (const [uuid, target] of Object.entries(nativeTargets)) {
            if (uuid.endsWith('_comment'))
                continue;
            const targetObj = target;
            const targetName = (targetObj.name || '').replace(/"/g, '');
            const productType = (targetObj.productType || '').replace(/"/g, '');
            // Match by name or by being the application target (not extension)
            if (targetName === appName &&
                productType === 'com.apple.product-type.application') {
                mainAppTargetUuid = uuid;
                break;
            }
        }
        if (mainAppTargetUuid) {
            // Create PBXContainerItemProxy for the dependency
            const containerItemProxyUuid = xcodeProject.generateUuid();
            xcodeProject.hash.project.objects.PBXContainerItemProxy =
                xcodeProject.hash.project.objects.PBXContainerItemProxy || {};
            xcodeProject.hash.project.objects.PBXContainerItemProxy[containerItemProxyUuid] = {
                isa: 'PBXContainerItemProxy',
                containerPortal: projectUuid,
                containerPortal_comment: 'Project object',
                proxyType: 1,
                remoteGlobalIDString: targetUuid,
                remoteInfo: `"${NSE_TARGET_NAME}"`,
            };
            xcodeProject.hash.project.objects.PBXContainerItemProxy[`${containerItemProxyUuid}_comment`] = 'PBXContainerItemProxy';
            // Create PBXTargetDependency
            const targetDependencyUuid = xcodeProject.generateUuid();
            xcodeProject.hash.project.objects.PBXTargetDependency =
                xcodeProject.hash.project.objects.PBXTargetDependency || {};
            xcodeProject.hash.project.objects.PBXTargetDependency[targetDependencyUuid] = {
                isa: 'PBXTargetDependency',
                target: targetUuid,
                target_comment: NSE_TARGET_NAME,
                targetProxy: containerItemProxyUuid,
                targetProxy_comment: 'PBXContainerItemProxy',
            };
            xcodeProject.hash.project.objects.PBXTargetDependency[`${targetDependencyUuid}_comment`] = 'PBXTargetDependency';
            // Add dependency to main app target
            const mainAppTargetObj = xcodeProject.hash.project.objects.PBXNativeTarget[mainAppTargetUuid];
            if (mainAppTargetObj) {
                mainAppTargetObj.dependencies = mainAppTargetObj.dependencies || [];
                mainAppTargetObj.dependencies.push({
                    value: targetDependencyUuid,
                    comment: 'PBXTargetDependency',
                });
            }
            // Create build file for embedding the extension
            const embedBuildFileUuid = xcodeProject.generateUuid();
            xcodeProject.hash.project.objects.PBXBuildFile[embedBuildFileUuid] = {
                isa: 'PBXBuildFile',
                fileRef: productUuid,
                fileRef_comment: `${NSE_TARGET_NAME}.appex`,
                settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
            };
            xcodeProject.hash.project.objects.PBXBuildFile[`${embedBuildFileUuid}_comment`] = `${NSE_TARGET_NAME}.appex in Embed Foundation Extensions`;
            // Create "Embed Foundation Extensions" copy files build phase
            const copyFilesBuildPhaseUuid = xcodeProject.generateUuid();
            xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase =
                xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase || {};
            xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase[copyFilesBuildPhaseUuid] = {
                isa: 'PBXCopyFilesBuildPhase',
                buildActionMask: 2147483647,
                dstPath: '""',
                dstSubfolderSpec: 13, // 13 = PlugIns folder for app extensions
                files: [
                    {
                        value: embedBuildFileUuid,
                        comment: `${NSE_TARGET_NAME}.appex in Embed Foundation Extensions`,
                    },
                ],
                name: '"Embed Foundation Extensions"',
                runOnlyForDeploymentPostprocessing: 0,
            };
            xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase[`${copyFilesBuildPhaseUuid}_comment`] = 'Embed Foundation Extensions';
            // Add the copy files build phase to the main app target
            if (mainAppTargetObj && mainAppTargetObj.buildPhases) {
                mainAppTargetObj.buildPhases.push({
                    value: copyFilesBuildPhaseUuid,
                    comment: 'Embed Foundation Extensions',
                });
            }
            console.log(`[Ometria] Added ${NSE_TARGET_NAME} embedding to ${appName} target`);
        }
        console.log(`[Ometria] Added ${NSE_TARGET_NAME} target to Xcode project`);
        return _config;
    });
};
function generateNotificationServiceSwift(appGroupIdentifier) {
    return `//
//  NotificationService.swift
//  ${NSE_TARGET_NAME}
//
//  Generated by react-native-ometria Expo plugin
//

import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
    override func instantiateOmetria() -> Ometria? {
        return Ometria.initializeForExtension(appGroupIdentifier: "${appGroupIdentifier}")
    }
}
`;
}
function generateInfoPlist() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>${NSE_TARGET_NAME}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.usernotifications.service</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).NotificationService</string>
    </dict>
</dict>
</plist>
`;
}
function generateEntitlements(appGroupIdentifier) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${appGroupIdentifier}</string>
    </array>
</dict>
</plist>
`;
}
/**
 * Main NSE configuration for Ometria
 */
const withNotificationServiceExtension = (config, props) => {
    // Create NSE files
    config = withNSEFiles(config, props);
    // Add NSE target to Xcode project
    config = withNSETarget(config, props);
    return config;
};
exports.withNotificationServiceExtension = withNotificationServiceExtension;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvd2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBSThCO0FBQzlCLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsTUFBTSxlQUFlLEdBQUcscUNBQXFDLENBQUM7QUFDOUQsTUFBTSxlQUFlLEdBQUcscUNBQXFDLENBQUM7QUFPOUQ7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBaUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDbkUsT0FBTyxJQUFBLGlDQUFnQixFQUFDLE1BQU0sRUFBRTtRQUM5QixLQUFLO1FBQ0wsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ2xCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFcEQsdUJBQXVCO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELG1DQUFtQztZQUNuQyxNQUFNLFlBQVksR0FBRyxnQ0FBZ0MsQ0FDbkQsS0FBSyxDQUFDLGtCQUFrQixDQUN6QixDQUFDO1lBQ0YsRUFBRSxDQUFDLGFBQWEsQ0FDZCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSwyQkFBMkIsQ0FBQyxFQUMvQyxZQUFZLENBQ2IsQ0FB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a0I7OztDQUd0RixDQUFDO0FBQ0YsQ0FBQztBQUVELFNBQVMsaUJBQWlCO0lBQ3hCLE9BQU87Ozs7Ozs7Y0FPSyxlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QjVCLENBQUM7QUFDRixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxrQkFBMEI7SUFDdEQsT0FBTzs7Ozs7O2tCQU1TLGtCQUFrQjs7OztDQUluQyxDQUFDO0FBQ0YsQ0FBQztBQUVEOztHQUVHO0FBQ0ksTUFBTSxnQ0FBZ0MsR0FBaUMsQ0FDNUUsTUFBTSxFQUNOLEtBQUssRUFDTCxFQUFFO0lBQ0YsbUJBQW1CO0lBQ25CLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJDLGtDQUFrQztJQUNsQyxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV0QyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFYVyxRQUFBLGdDQUFnQyxvQ0FXM0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb25maWdQbHVnaW4sXG4gIHdpdGhEYW5nZXJvdXNNb2QsXG4gIHdpdGhYY29kZVByb2plY3QsXG59IGZyb20gJ0BleHBvL2NvbmZpZy1wbHVnaW5zJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IE5TRV9UQVJHRVRfTkFNRSA9ICdPbWV0cmlhTm90aWZpY2F0aW9uU2VydmljZUV4dGVuc2lvbic7XG5jb25zdCBOU0VfRk9MREVSX05BTUUgPSAnT21ldHJpYU5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24nO1xuXG5leHBvcnQgdHlwZSBOU0VQbHVnaW5Qcm9wcyA9IHtcbiAgYXBwR3JvdXBJZGVudGlmaWVyOiBzdHJpbmc7XG4gIG9tZXRyaWFJb3NTZGtWZXJzaW9uOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIE5vdGlmaWNhdGlvbiBTZXJ2aWNlIEV4dGVuc2lvbiBmaWxlc1xuICovXG5jb25zdCB3aXRoTlNFRmlsZXM6IENvbmZpZ1BsdWdpbjxOU0VQbHVnaW5Qcm9wcz4gPSAoY29uZmlnLCBwcm9wcykgPT4ge1xuICByZXR1cm4gd2l0aERhbmdlcm91c01vZChjb25maWcsIFtcbiAgICAnaW9zJyxcbiAgICBhc3luYyAobW9kQ29uZmlnKSA9PiB7XG4gICAgICBjb25zdCBpb3NQYXRoID0gcGF0aC5qb2luKG1vZENvbmZpZy5tb2RSZXF1ZXN0LnByb2plY3RSb290LCAnaW9zJyk7XG4gICAgICBjb25zdCBuc2VQYXRoID0gcGF0aC5qb2luKGlvc1BhdGgsIE5TRV9GT0xERVJfTkFNRSk7XG5cbiAgICAgIC8vIENyZWF0ZSBOU0UgZGlyZWN0b3J5XG4gICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobnNlUGF0aCkpIHtcbiAgICAgICAgZnMubWtkaXJTeW5jKG5zZVBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdFxuICAgICAgY29uc3Qgc3dpZnRDb250ZW50ID0gZ2VuZXJhdGVOb3RpZmljYXRpb25TZXJ2aWNlU3dpZnQoXG4gICAgICAgIHByb3BzLmFwcEdyb3VwSWRlbnRpZmllclxuICAgICAgKTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICAgIHBhdGguam9pbihuc2VQYXRoLCAnTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdCcpLFxuICAgICAgICBzd2lmdENvbnRlbnRcbiAgICAgICk7XG5cbiAgICAgIC8vIENyZWF0ZSBJbmZvLnBsaXN0XG4gICAgICBjb25zdCBpbmZvUGxpc3RDb250ZW50ID0gZ2VuZXJhdGVJbmZvUGxpc3QoKTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICAgIHBhdGguam9pbihuc2VQYXRoLCBgJHtOU0VfVEFSR0VUX05BTUV9LUluZm8ucGxpc3RgKSxcbiAgICAgICAgaW5mb1BsaXN0Q29udGVudFxuICAgICAgKTtcblxuICAgICAgLy8gQ3JlYXRlIEVudGl0bGVtZW50c1xuICAgICAgY29uc3QgZW50aXRsZW1lbnRzQ29udGVudCA9IGdlbmVyYXRlRW50aXRsZW1lbnRzKFxuICAgICAgICBwcm9wcy5hcHBHcm91cElkZW50aWZpZXJcbiAgICAgICk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgICBwYXRoLmpvaW4obnNlUGF0aCwgYCR7TlNFX1RBUkdFVF9OQU1FfS5lbnRpdGxlbWVudHNgKSxcbiAgICAgICAgZW50aXRsZW1lbnRzQ29udGVudFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIG1vZENvbmZpZztcbiAgICB9LFxuICBdKTtcbn07XG5cbi8qKlxuICogQWRkcyB0aGUgTlNFIHRhcmdldCB0byB0aGUgWGNvZGUgcHJvamVjdCB1c2luZyBwcm9wZXIgeGNvZGUgbGlicmFyeSBtZXRob2RzXG4gKi9cbmNvbnN0IHdpdGhOU0VUYXJnZXQ6IENvbmZpZ1BsdWdpbjxOU0VQbHVnaW5Qcm9wcz4gPSAoY29uZmlnKSA9PiB7XG4gIHJldHVybiB3aXRoWGNvZGVQcm9qZWN0KGNvbmZpZywgKF9jb25maWcpID0+IHtcbiAgICBjb25zdCB4Y29kZVByb2plY3QgPSBfY29uZmlnLm1vZFJlc3VsdHM7XG4gICAgY29uc3QgYXBwTmFtZSA9IF9jb25maWcubW9kUmVxdWVzdC5wcm9qZWN0TmFtZSB8fCAnQXBwJztcbiAgICBjb25zdCBidW5kbGVJZGVudGlmaWVyID0gX2NvbmZpZy5pb3M/LmJ1bmRsZUlkZW50aWZpZXIgfHwgJ2NvbS5leGFtcGxlLmFwcCc7XG4gICAgY29uc3QgYnVpbGROdW1iZXIgPSBfY29uZmlnLmlvcz8uYnVpbGROdW1iZXIgfHwgJzEnO1xuICAgIGNvbnN0IG1hcmtldGluZ1ZlcnNpb24gPSBfY29uZmlnLnZlcnNpb24gfHwgJzEuMC4wJztcblxuICAgIC8vIEdldCBkZXBsb3ltZW50IHRhcmdldCBmcm9tIHByb2plY3QgYnVpbGQgc2V0dGluZ3MgKHN5bmNlZCB3aXRoIG1haW4gYXBwKVxuICAgIGNvbnN0IE1JTl9ERVBMT1lNRU5UX1RBUkdFVCA9IDE1LjE7XG4gICAgbGV0IGhpZ2hlc3REZXBsb3ltZW50VGFyZ2V0ID0gTUlOX0RFUExPWU1FTlRfVEFSR0VUO1xuICAgIGxldCBkZXBsb3ltZW50VGFyZ2V0ID0gJzE1LjEnOyAvLyBEZWZhdWx0IG1pbmltdW0gZm9yIE9tZXRyaWEgU0RLXG4gICAgY29uc3QgYnVpbGRDb25maWdzID1cbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5YQ0J1aWxkQ29uZmlndXJhdGlvbiB8fCB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhidWlsZENvbmZpZ3MpKSB7XG4gICAgICBpZiAoa2V5LmVuZHNXaXRoKCdfY29tbWVudCcpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNvbmZpZ09iaiA9IHZhbHVlIGFzIGFueTtcbiAgICAgIGlmIChjb25maWdPYmouYnVpbGRTZXR0aW5ncz8uSVBIT05FT1NfREVQTE9ZTUVOVF9UQVJHRVQpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID1cbiAgICAgICAgICBjb25maWdPYmouYnVpbGRTZXR0aW5ncy5JUEhPTkVPU19ERVBMT1lNRU5UX1RBUkdFVC5yZXBsYWNlKC9cIi9nLCAnJyk7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmxvYXQodGFyZ2V0KTtcbiAgICAgICAgLy8gVXNlIHRoZSBoaWdoZXN0IGRlcGxveW1lbnQgdGFyZ2V0IGZvdW5kIGFjcm9zcyBhbGwgY29uZmlndXJhdGlvbnMgKGF0IGxlYXN0IDE1LjEgZm9yIE9tZXRyaWEpXG4gICAgICAgIGlmICghaXNOYU4ocGFyc2VkKSAmJiBwYXJzZWQgPiBoaWdoZXN0RGVwbG95bWVudFRhcmdldCkge1xuICAgICAgICAgIGhpZ2hlc3REZXBsb3ltZW50VGFyZ2V0ID0gcGFyc2VkO1xuICAgICAgICAgIGRlcGxveW1lbnRUYXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB0YXJnZXQgYWxyZWFkeSBleGlzdHNcbiAgICBpZiAoeGNvZGVQcm9qZWN0LnBieFRhcmdldEJ5TmFtZShOU0VfVEFSR0VUX05BTUUpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW09tZXRyaWFdICR7TlNFX1RBUkdFVF9OQU1FfSB0YXJnZXQgYWxyZWFkeSBleGlzdHNgKTtcbiAgICAgIHJldHVybiBfY29uZmlnO1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgTlNFIHRhcmdldFxuICAgIGNvbnN0IHRhcmdldFV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3QgcHJvZHVjdFV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3QgYnVpbGRDb25maWd1cmF0aW9uTGlzdFV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3QgZGVidWdCdWlsZENvbmZpZ1V1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3QgcmVsZWFzZUJ1aWxkQ29uZmlnVXVpZCA9IHhjb2RlUHJvamVjdC5nZW5lcmF0ZVV1aWQoKTtcbiAgICBjb25zdCBzb3VyY2VzQnVpbGRQaGFzZVV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3QgZnJhbWV3b3Jrc0J1aWxkUGhhc2VVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuICAgIGNvbnN0IHJlc291cmNlc0J1aWxkUGhhc2VVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuICAgIGNvbnN0IGdyb3VwVXVpZCA9IHhjb2RlUHJvamVjdC5nZW5lcmF0ZVV1aWQoKTtcblxuICAgIC8vIENvbW1vbiBidWlsZCBzZXR0aW5ncyBmb3IgTlNFXG4gICAgY29uc3QgY29tbW9uQnVpbGRTZXR0aW5ncyA9IHtcbiAgICAgIENMQU5HX0VOQUJMRV9NT0RVTEVTOiAnWUVTJyxcbiAgICAgIENPREVfU0lHTl9FTlRJVExFTUVOVFM6IGAke05TRV9GT0xERVJfTkFNRX0vJHtOU0VfVEFSR0VUX05BTUV9LmVudGl0bGVtZW50c2AsXG4gICAgICBDT0RFX1NJR05fU1RZTEU6ICdBdXRvbWF0aWMnLFxuICAgICAgQ1VSUkVOVF9QUk9KRUNUX1ZFUlNJT046IGJ1aWxkTnVtYmVyLFxuICAgICAgR0VORVJBVEVfSU5GT1BMSVNUX0ZJTEU6ICdOTycsXG4gICAgICBJTkZPUExJU1RfRklMRTogYCR7TlNFX0ZPTERFUl9OQU1FfS8ke05TRV9UQVJHRVRfTkFNRX0tSW5mby5wbGlzdGAsXG4gICAgICBJUEhPTkVPU19ERVBMT1lNRU5UX1RBUkdFVDogZGVwbG95bWVudFRhcmdldCxcbiAgICAgIE1BUktFVElOR19WRVJTSU9OOiBtYXJrZXRpbmdWZXJzaW9uLFxuICAgICAgUFJPRFVDVF9CVU5ETEVfSURFTlRJRklFUjogYCR7YnVuZGxlSWRlbnRpZmllcn0uJHtOU0VfVEFSR0VUX05BTUV9YCxcbiAgICAgIFBST0RVQ1RfTkFNRTogYFwiJChUQVJHRVRfTkFNRSlcImAsXG4gICAgICBTS0lQX0lOU1RBTEw6ICdZRVMnLFxuICAgICAgU1dJRlRfRU1JVF9MT0NfU1RSSU5HUzogJ1lFUycsXG4gICAgICBTV0lGVF9WRVJTSU9OOiAnNS4wJyxcbiAgICAgIFRBUkdFVEVEX0RFVklDRV9GQU1JTFk6IGBcIjEsMlwiYCxcbiAgICB9O1xuXG4gICAgLy8gQWRkIGJ1aWxkIGNvbmZpZ3VyYXRpb25zXG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlhDQnVpbGRDb25maWd1cmF0aW9uID1cbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5YQ0J1aWxkQ29uZmlndXJhdGlvbiB8fCB7fTtcblxuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5YQ0J1aWxkQ29uZmlndXJhdGlvbltcbiAgICAgIGRlYnVnQnVpbGRDb25maWdVdWlkXG4gICAgXSA9IHtcbiAgICAgIGlzYTogJ1hDQnVpbGRDb25maWd1cmF0aW9uJyxcbiAgICAgIGJ1aWxkU2V0dGluZ3M6IHtcbiAgICAgICAgLi4uY29tbW9uQnVpbGRTZXR0aW5ncyxcbiAgICAgICAgREVCVUdfSU5GT1JNQVRJT05fRk9STUFUOiAnZHdhcmYnLFxuICAgICAgfSxcbiAgICAgIG5hbWU6ICdEZWJ1ZycsXG4gICAgfTtcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuWENCdWlsZENvbmZpZ3VyYXRpb25bXG4gICAgICBgJHtkZWJ1Z0J1aWxkQ29uZmlnVXVpZH1fY29tbWVudGBcbiAgICBdID0gJ0RlYnVnJztcblxuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5YQ0J1aWxkQ29uZmlndXJhdGlvbltcbiAgICAgIHJlbGVhc2VCdWlsZENvbmZpZ1V1aWRcbiAgICBdID0ge1xuICAgICAgaXNhOiAnWENCdWlsZENvbmZpZ3VyYXRpb24nLFxuICAgICAgYnVpbGRTZXR0aW5nczoge1xuICAgICAgICAuLi5jb21tb25CdWlsZFNldHRpbmdzLFxuICAgICAgICBERUJVR19JTkZPUk1BVElPTl9GT1JNQVQ6IGBcImR3YXJmLXdpdGgtZHN5bVwiYCxcbiAgICAgIH0sXG4gICAgICBuYW1lOiAnUmVsZWFzZScsXG4gICAgfTtcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuWENCdWlsZENvbmZpZ3VyYXRpb25bXG4gICAgICBgJHtyZWxlYXNlQnVpbGRDb25maWdVdWlkfV9jb21tZW50YFxuICAgIF0gPSAnUmVsZWFzZSc7XG5cbiAgICAvLyBBZGQgYnVpbGQgY29uZmlndXJhdGlvbiBsaXN0XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlhDQ29uZmlndXJhdGlvbkxpc3QgPVxuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlhDQ29uZmlndXJhdGlvbkxpc3QgfHwge307XG5cbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuWENDb25maWd1cmF0aW9uTGlzdFtcbiAgICAgIGJ1aWxkQ29uZmlndXJhdGlvbkxpc3RVdWlkXG4gICAgXSA9IHtcbiAgICAgIGlzYTogJ1hDQ29uZmlndXJhdGlvbkxpc3QnLFxuICAgICAgYnVpbGRDb25maWd1cmF0aW9uczogW1xuICAgICAgICB7IHZhbHVlOiBkZWJ1Z0J1aWxkQ29uZmlnVXVpZCwgY29tbWVudDogJ0RlYnVnJyB9LFxuICAgICAgICB7IHZhbHVlOiByZWxlYXNlQnVpbGRDb25maWdVdWlkLCBjb21tZW50OiAnUmVsZWFzZScgfSxcbiAgICAgIF0sXG4gICAgICBkZWZhdWx0Q29uZmlndXJhdGlvbklzVmlzaWJsZTogMCxcbiAgICAgIGRlZmF1bHRDb25maWd1cmF0aW9uTmFtZTogJ1JlbGVhc2UnLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlhDQ29uZmlndXJhdGlvbkxpc3RbXG4gICAgICBgJHtidWlsZENvbmZpZ3VyYXRpb25MaXN0VXVpZH1fY29tbWVudGBcbiAgICBdID0gYEJ1aWxkIGNvbmZpZ3VyYXRpb24gbGlzdCBmb3IgUEJYTmF0aXZlVGFyZ2V0IFwiJHtOU0VfVEFSR0VUX05BTUV9XCJgO1xuXG4gICAgLy8gQWRkIHNvdXJjZSBmaWxlIHJlZmVyZW5jZVxuICAgIGNvbnN0IHN3aWZ0RmlsZVV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgY29uc3Qgc3dpZnRGaWxlQnVpbGRVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuXG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2UgPVxuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2UgfHwge307XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2Vbc3dpZnRGaWxlVXVpZF0gPSB7XG4gICAgICBpc2E6ICdQQlhGaWxlUmVmZXJlbmNlJyxcbiAgICAgIGxhc3RLbm93bkZpbGVUeXBlOiAnc291cmNlY29kZS5zd2lmdCcsXG4gICAgICBwYXRoOiAnTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdCcsXG4gICAgICBzb3VyY2VUcmVlOiAnXCI8Z3JvdXA+XCInLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2VbXG4gICAgICBgJHtzd2lmdEZpbGVVdWlkfV9jb21tZW50YFxuICAgIF0gPSAnTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdCc7XG5cbiAgICAvLyBBZGQgcGxpc3QgZmlsZSByZWZlcmVuY2VcbiAgICBjb25zdCBwbGlzdEZpbGVVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhGaWxlUmVmZXJlbmNlW3BsaXN0RmlsZVV1aWRdID0ge1xuICAgICAgaXNhOiAnUEJYRmlsZVJlZmVyZW5jZScsXG4gICAgICBsYXN0S25vd25GaWxlVHlwZTogJ3RleHQucGxpc3QueG1sJyxcbiAgICAgIHBhdGg6IGAke05TRV9UQVJHRVRfTkFNRX0tSW5mby5wbGlzdGAsXG4gICAgICBzb3VyY2VUcmVlOiAnXCI8Z3JvdXA+XCInLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2VbXG4gICAgICBgJHtwbGlzdEZpbGVVdWlkfV9jb21tZW50YFxuICAgIF0gPSBgJHtOU0VfVEFSR0VUX05BTUV9LUluZm8ucGxpc3RgO1xuXG4gICAgLy8gQWRkIGVudGl0bGVtZW50cyBmaWxlIHJlZmVyZW5jZVxuICAgIGNvbnN0IGVudGl0bGVtZW50c0ZpbGVVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhGaWxlUmVmZXJlbmNlW2VudGl0bGVtZW50c0ZpbGVVdWlkXSA9IHtcbiAgICAgIGlzYTogJ1BCWEZpbGVSZWZlcmVuY2UnLFxuICAgICAgbGFzdEtub3duRmlsZVR5cGU6ICd0ZXh0LnBsaXN0LmVudGl0bGVtZW50cycsXG4gICAgICBwYXRoOiBgJHtOU0VfVEFSR0VUX05BTUV9LmVudGl0bGVtZW50c2AsXG4gICAgICBzb3VyY2VUcmVlOiAnXCI8Z3JvdXA+XCInLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2VbXG4gICAgICBgJHtlbnRpdGxlbWVudHNGaWxlVXVpZH1fY29tbWVudGBcbiAgICBdID0gYCR7TlNFX1RBUkdFVF9OQU1FfS5lbnRpdGxlbWVudHNgO1xuXG4gICAgLy8gQWRkIHByb2R1Y3QgcmVmZXJlbmNlXG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZpbGVSZWZlcmVuY2VbcHJvZHVjdFV1aWRdID0ge1xuICAgICAgaXNhOiAnUEJYRmlsZVJlZmVyZW5jZScsXG4gICAgICBleHBsaWNpdEZpbGVUeXBlOiBgXCJ3cmFwcGVyLmFwcC1leHRlbnNpb25cImAsXG4gICAgICBpbmNsdWRlSW5JbmRleDogMCxcbiAgICAgIHBhdGg6IGAke05TRV9UQVJHRVRfTkFNRX0uYXBwZXhgLFxuICAgICAgc291cmNlVHJlZTogJ0JVSUxUX1BST0RVQ1RTX0RJUicsXG4gICAgfTtcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYRmlsZVJlZmVyZW5jZVtcbiAgICAgIGAke3Byb2R1Y3RVdWlkfV9jb21tZW50YFxuICAgIF0gPSBgJHtOU0VfVEFSR0VUX05BTUV9LmFwcGV4YDtcblxuICAgIC8vIEFkZCBidWlsZCBmaWxlIGZvciBzd2lmdCBzb3VyY2VcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYQnVpbGRGaWxlID1cbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhCdWlsZEZpbGUgfHwge307XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEJ1aWxkRmlsZVtzd2lmdEZpbGVCdWlsZFV1aWRdID0ge1xuICAgICAgaXNhOiAnUEJYQnVpbGRGaWxlJyxcbiAgICAgIGZpbGVSZWY6IHN3aWZ0RmlsZVV1aWQsXG4gICAgICBmaWxlUmVmX2NvbW1lbnQ6ICdOb3RpZmljYXRpb25TZXJ2aWNlLnN3aWZ0JyxcbiAgICB9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhCdWlsZEZpbGVbXG4gICAgICBgJHtzd2lmdEZpbGVCdWlsZFV1aWR9X2NvbW1lbnRgXG4gICAgXSA9ICdOb3RpZmljYXRpb25TZXJ2aWNlLnN3aWZ0IGluIFNvdXJjZXMnO1xuXG4gICAgLy8gQWRkIGdyb3VwIGZvciBOU0UgZmlsZXNcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYR3JvdXAgPVxuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEdyb3VwIHx8IHt9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhHcm91cFtncm91cFV1aWRdID0ge1xuICAgICAgaXNhOiAnUEJYR3JvdXAnLFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgeyB2YWx1ZTogc3dpZnRGaWxlVXVpZCwgY29tbWVudDogJ05vdGlmaWNhdGlvblNlcnZpY2Uuc3dpZnQnIH0sXG4gICAgICAgIHsgdmFsdWU6IHBsaXN0RmlsZVV1aWQsIGNvbW1lbnQ6IGAke05TRV9UQVJHRVRfTkFNRX0tSW5mby5wbGlzdGAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBlbnRpdGxlbWVudHNGaWxlVXVpZCxcbiAgICAgICAgICBjb21tZW50OiBgJHtOU0VfVEFSR0VUX05BTUV9LmVudGl0bGVtZW50c2AsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcGF0aDogTlNFX0ZPTERFUl9OQU1FLFxuICAgICAgc291cmNlVHJlZTogJ1wiPGdyb3VwPlwiJyxcbiAgICB9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhHcm91cFtgJHtncm91cFV1aWR9X2NvbW1lbnRgXSA9XG4gICAgICBOU0VfVEFSR0VUX05BTUU7XG5cbiAgICAvLyBBZGQgZ3JvdXAgdG8gbWFpbiBncm91cFxuICAgIGNvbnN0IG1haW5Hcm91cFV1aWQgPSB4Y29kZVByb2plY3QuZ2V0Rmlyc3RQcm9qZWN0KCkuZmlyc3RQcm9qZWN0Lm1haW5Hcm91cDtcbiAgICBjb25zdCBtYWluR3JvdXAgPSB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYR3JvdXBbbWFpbkdyb3VwVXVpZF07XG4gICAgaWYgKG1haW5Hcm91cCAmJiBtYWluR3JvdXAuY2hpbGRyZW4pIHtcbiAgICAgIG1haW5Hcm91cC5jaGlsZHJlbi5wdXNoKHsgdmFsdWU6IGdyb3VwVXVpZCwgY29tbWVudDogTlNFX1RBUkdFVF9OQU1FIH0pO1xuICAgIH1cblxuICAgIC8vIEFkZCBwcm9kdWN0IHRvIFByb2R1Y3RzIGdyb3VwXG4gICAgY29uc3QgcHJvZHVjdHNHcm91cFV1aWQgPSB4Y29kZVByb2plY3QucGJ4R3JvdXBCeU5hbWUoJ1Byb2R1Y3RzJyk/LnV1aWQ7XG4gICAgaWYgKHByb2R1Y3RzR3JvdXBVdWlkKSB7XG4gICAgICBjb25zdCBwcm9kdWN0c0dyb3VwID1cbiAgICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEdyb3VwW3Byb2R1Y3RzR3JvdXBVdWlkXTtcbiAgICAgIGlmIChwcm9kdWN0c0dyb3VwICYmIHByb2R1Y3RzR3JvdXAuY2hpbGRyZW4pIHtcbiAgICAgICAgcHJvZHVjdHNHcm91cC5jaGlsZHJlbi5wdXNoKHtcbiAgICAgICAgICB2YWx1ZTogcHJvZHVjdFV1aWQsXG4gICAgICAgICAgY29tbWVudDogYCR7TlNFX1RBUkdFVF9OQU1FfS5hcHBleGAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBidWlsZCBwaGFzZXNcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYU291cmNlc0J1aWxkUGhhc2UgPVxuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWFNvdXJjZXNCdWlsZFBoYXNlIHx8IHt9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhTb3VyY2VzQnVpbGRQaGFzZVtcbiAgICAgIHNvdXJjZXNCdWlsZFBoYXNlVXVpZFxuICAgIF0gPSB7XG4gICAgICBpc2E6ICdQQlhTb3VyY2VzQnVpbGRQaGFzZScsXG4gICAgICBidWlsZEFjdGlvbk1hc2s6IDIxNDc0ODM2NDcsXG4gICAgICBmaWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IHN3aWZ0RmlsZUJ1aWxkVXVpZCxcbiAgICAgICAgICBjb21tZW50OiAnTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdCBpbiBTb3VyY2VzJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBydW5Pbmx5Rm9yRGVwbG95bWVudFBvc3Rwcm9jZXNzaW5nOiAwLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWFNvdXJjZXNCdWlsZFBoYXNlW1xuICAgICAgYCR7c291cmNlc0J1aWxkUGhhc2VVdWlkfV9jb21tZW50YFxuICAgIF0gPSAnU291cmNlcyc7XG5cbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYRnJhbWV3b3Jrc0J1aWxkUGhhc2UgPVxuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZyYW1ld29ya3NCdWlsZFBoYXNlIHx8IHt9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhGcmFtZXdvcmtzQnVpbGRQaGFzZVtcbiAgICAgIGZyYW1ld29ya3NCdWlsZFBoYXNlVXVpZFxuICAgIF0gPSB7XG4gICAgICBpc2E6ICdQQlhGcmFtZXdvcmtzQnVpbGRQaGFzZScsXG4gICAgICBidWlsZEFjdGlvbk1hc2s6IDIxNDc0ODM2NDcsXG4gICAgICBmaWxlczogW10sXG4gICAgICBydW5Pbmx5Rm9yRGVwbG95bWVudFBvc3Rwcm9jZXNzaW5nOiAwLFxuICAgIH07XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEZyYW1ld29ya3NCdWlsZFBoYXNlW1xuICAgICAgYCR7ZnJhbWV3b3Jrc0J1aWxkUGhhc2VVdWlkfV9jb21tZW50YFxuICAgIF0gPSAnRnJhbWV3b3Jrcyc7XG5cbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYUmVzb3VyY2VzQnVpbGRQaGFzZSA9XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYUmVzb3VyY2VzQnVpbGRQaGFzZSB8fCB7fTtcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYUmVzb3VyY2VzQnVpbGRQaGFzZVtcbiAgICAgIHJlc291cmNlc0J1aWxkUGhhc2VVdWlkXG4gICAgXSA9IHtcbiAgICAgIGlzYTogJ1BCWFJlc291cmNlc0J1aWxkUGhhc2UnLFxuICAgICAgYnVpbGRBY3Rpb25NYXNrOiAyMTQ3NDgzNjQ3LFxuICAgICAgZmlsZXM6IFtdLFxuICAgICAgcnVuT25seUZvckRlcGxveW1lbnRQb3N0cHJvY2Vzc2luZzogMCxcbiAgICB9O1xuICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhSZXNvdXJjZXNCdWlsZFBoYXNlW1xuICAgICAgYCR7cmVzb3VyY2VzQnVpbGRQaGFzZVV1aWR9X2NvbW1lbnRgXG4gICAgXSA9ICdSZXNvdXJjZXMnO1xuXG4gICAgLy8gQWRkIG5hdGl2ZSB0YXJnZXRcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYTmF0aXZlVGFyZ2V0ID1cbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhOYXRpdmVUYXJnZXQgfHwge307XG4gICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWE5hdGl2ZVRhcmdldFt0YXJnZXRVdWlkXSA9IHtcbiAgICAgIGlzYTogJ1BCWE5hdGl2ZVRhcmdldCcsXG4gICAgICBidWlsZENvbmZpZ3VyYXRpb25MaXN0OiBidWlsZENvbmZpZ3VyYXRpb25MaXN0VXVpZCxcbiAgICAgIGJ1aWxkQ29uZmlndXJhdGlvbkxpc3RfY29tbWVudDogYEJ1aWxkIGNvbmZpZ3VyYXRpb24gbGlzdCBmb3IgUEJYTmF0aXZlVGFyZ2V0IFwiJHtOU0VfVEFSR0VUX05BTUV9XCJgLFxuICAgICAgYnVpbGRQaGFzZXM6IFtcbiAgICAgICAgeyB2YWx1ZTogc291cmNlc0J1aWxkUGhhc2VVdWlkLCBjb21tZW50OiAnU291cmNlcycgfSxcbiAgICAgICAgeyB2YWx1ZTogZnJhbWV3b3Jrc0J1aWxkUGhhc2VVdWlkLCBjb21tZW50OiAnRnJhbWV3b3JrcycgfSxcbiAgICAgICAgeyB2YWx1ZTogcmVzb3VyY2VzQnVpbGRQaGFzZVV1aWQsIGNvbW1lbnQ6ICdSZXNvdXJjZXMnIH0sXG4gICAgICBdLFxuICAgICAgYnVpbGRSdWxlczogW10sXG4gICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgbmFtZTogYFwiJHtOU0VfVEFSR0VUX05BTUV9XCJgLFxuICAgICAgcHJvZHVjdE5hbWU6IGBcIiR7TlNFX1RBUkdFVF9OQU1FfVwiYCxcbiAgICAgIHByb2R1Y3RSZWZlcmVuY2U6IHByb2R1Y3RVdWlkLFxuICAgICAgcHJvZHVjdFJlZmVyZW5jZV9jb21tZW50OiBgJHtOU0VfVEFSR0VUX05BTUV9LmFwcGV4YCxcbiAgICAgIHByb2R1Y3RUeXBlOiBgXCJjb20uYXBwbGUucHJvZHVjdC10eXBlLmFwcC1leHRlbnNpb25cImAsXG4gICAgfTtcbiAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYTmF0aXZlVGFyZ2V0W2Ake3RhcmdldFV1aWR9X2NvbW1lbnRgXSA9XG4gICAgICBOU0VfVEFSR0VUX05BTUU7XG5cbiAgICAvLyBBZGQgdGFyZ2V0IHRvIHByb2plY3RcbiAgICBjb25zdCBmaXJzdFByb2plY3QgPSB4Y29kZVByb2plY3QuZ2V0Rmlyc3RQcm9qZWN0KCk7XG4gICAgY29uc3QgcHJvamVjdFV1aWQgPSBmaXJzdFByb2plY3QudXVpZDtcbiAgICBjb25zdCBwcm9qZWN0T2JqZWN0ID0gZmlyc3RQcm9qZWN0LmZpcnN0UHJvamVjdDtcbiAgICBpZiAocHJvamVjdE9iamVjdC50YXJnZXRzKSB7XG4gICAgICBwcm9qZWN0T2JqZWN0LnRhcmdldHMucHVzaCh7XG4gICAgICAgIHZhbHVlOiB0YXJnZXRVdWlkLFxuICAgICAgICBjb21tZW50OiBOU0VfVEFSR0VUX05BTUUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBtYWluIGFwcCB0YXJnZXQgVVVJRCBieSBpdGVyYXRpbmcgdGhyb3VnaCBQQlhOYXRpdmVUYXJnZXQgb2JqZWN0c1xuICAgIC8vIHBieFRhcmdldEJ5TmFtZSBkb2Vzbid0IHJlbGlhYmx5IGdpdmUgdXMgdGhlIGtleSBuZWVkZWQgZm9yIGhhc2ggYWNjZXNzXG4gICAgY29uc3QgbmF0aXZlVGFyZ2V0cyA9XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYTmF0aXZlVGFyZ2V0IHx8IHt9O1xuICAgIGxldCBtYWluQXBwVGFyZ2V0VXVpZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGNvbnN0IFt1dWlkLCB0YXJnZXRdIG9mIE9iamVjdC5lbnRyaWVzKG5hdGl2ZVRhcmdldHMpKSB7XG4gICAgICBpZiAodXVpZC5lbmRzV2l0aCgnX2NvbW1lbnQnKSkgY29udGludWU7XG4gICAgICBjb25zdCB0YXJnZXRPYmogPSB0YXJnZXQgYXMgYW55O1xuICAgICAgY29uc3QgdGFyZ2V0TmFtZSA9ICh0YXJnZXRPYmoubmFtZSB8fCAnJykucmVwbGFjZSgvXCIvZywgJycpO1xuICAgICAgY29uc3QgcHJvZHVjdFR5cGUgPSAodGFyZ2V0T2JqLnByb2R1Y3RUeXBlIHx8ICcnKS5yZXBsYWNlKC9cIi9nLCAnJyk7XG5cbiAgICAgIC8vIE1hdGNoIGJ5IG5hbWUgb3IgYnkgYmVpbmcgdGhlIGFwcGxpY2F0aW9uIHRhcmdldCAobm90IGV4dGVuc2lvbilcbiAgICAgIGlmIChcbiAgICAgICAgdGFyZ2V0TmFtZSA9PT0gYXBwTmFtZSAmJlxuICAgICAgICBwcm9kdWN0VHlwZSA9PT0gJ2NvbS5hcHBsZS5wcm9kdWN0LXR5cGUuYXBwbGljYXRpb24nXG4gICAgICApIHtcbiAgICAgICAgbWFpbkFwcFRhcmdldFV1aWQgPSB1dWlkO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWFpbkFwcFRhcmdldFV1aWQpIHtcbiAgICAgIC8vIENyZWF0ZSBQQlhDb250YWluZXJJdGVtUHJveHkgZm9yIHRoZSBkZXBlbmRlbmN5XG4gICAgICBjb25zdCBjb250YWluZXJJdGVtUHJveHlVdWlkID0geGNvZGVQcm9qZWN0LmdlbmVyYXRlVXVpZCgpO1xuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWENvbnRhaW5lckl0ZW1Qcm94eSA9XG4gICAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhDb250YWluZXJJdGVtUHJveHkgfHwge307XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYQ29udGFpbmVySXRlbVByb3h5W1xuICAgICAgICBjb250YWluZXJJdGVtUHJveHlVdWlkXG4gICAgICBdID0ge1xuICAgICAgICBpc2E6ICdQQlhDb250YWluZXJJdGVtUHJveHknLFxuICAgICAgICBjb250YWluZXJQb3J0YWw6IHByb2plY3RVdWlkLFxuICAgICAgICBjb250YWluZXJQb3J0YWxfY29tbWVudDogJ1Byb2plY3Qgb2JqZWN0JyxcbiAgICAgICAgcHJveHlUeXBlOiAxLFxuICAgICAgICByZW1vdGVHbG9iYWxJRFN0cmluZzogdGFyZ2V0VXVpZCxcbiAgICAgICAgcmVtb3RlSW5mbzogYFwiJHtOU0VfVEFSR0VUX05BTUV9XCJgLFxuICAgICAgfTtcbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhDb250YWluZXJJdGVtUHJveHlbXG4gICAgICAgIGAke2NvbnRhaW5lckl0ZW1Qcm94eVV1aWR9X2NvbW1lbnRgXG4gICAgICBdID0gJ1BCWENvbnRhaW5lckl0ZW1Qcm94eSc7XG5cbiAgICAgIC8vIENyZWF0ZSBQQlhUYXJnZXREZXBlbmRlbmN5XG4gICAgICBjb25zdCB0YXJnZXREZXBlbmRlbmN5VXVpZCA9IHhjb2RlUHJvamVjdC5nZW5lcmF0ZVV1aWQoKTtcbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhUYXJnZXREZXBlbmRlbmN5ID1cbiAgICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWFRhcmdldERlcGVuZGVuY3kgfHwge307XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYVGFyZ2V0RGVwZW5kZW5jeVtcbiAgICAgICAgdGFyZ2V0RGVwZW5kZW5jeVV1aWRcbiAgICAgIF0gPSB7XG4gICAgICAgIGlzYTogJ1BCWFRhcmdldERlcGVuZGVuY3knLFxuICAgICAgICB0YXJnZXQ6IHRhcmdldFV1aWQsXG4gICAgICAgIHRhcmdldF9jb21tZW50OiBOU0VfVEFSR0VUX05BTUUsXG4gICAgICAgIHRhcmdldFByb3h5OiBjb250YWluZXJJdGVtUHJveHlVdWlkLFxuICAgICAgICB0YXJnZXRQcm94eV9jb21tZW50OiAnUEJYQ29udGFpbmVySXRlbVByb3h5JyxcbiAgICAgIH07XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYVGFyZ2V0RGVwZW5kZW5jeVtcbiAgICAgICAgYCR7dGFyZ2V0RGVwZW5kZW5jeVV1aWR9X2NvbW1lbnRgXG4gICAgICBdID0gJ1BCWFRhcmdldERlcGVuZGVuY3knO1xuXG4gICAgICAvLyBBZGQgZGVwZW5kZW5jeSB0byBtYWluIGFwcCB0YXJnZXRcbiAgICAgIGNvbnN0IG1haW5BcHBUYXJnZXRPYmogPVxuICAgICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYTmF0aXZlVGFyZ2V0W21haW5BcHBUYXJnZXRVdWlkXTtcbiAgICAgIGlmIChtYWluQXBwVGFyZ2V0T2JqKSB7XG4gICAgICAgIG1haW5BcHBUYXJnZXRPYmouZGVwZW5kZW5jaWVzID0gbWFpbkFwcFRhcmdldE9iai5kZXBlbmRlbmNpZXMgfHwgW107XG4gICAgICAgIG1haW5BcHBUYXJnZXRPYmouZGVwZW5kZW5jaWVzLnB1c2goe1xuICAgICAgICAgIHZhbHVlOiB0YXJnZXREZXBlbmRlbmN5VXVpZCxcbiAgICAgICAgICBjb21tZW50OiAnUEJYVGFyZ2V0RGVwZW5kZW5jeScsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYnVpbGQgZmlsZSBmb3IgZW1iZWRkaW5nIHRoZSBleHRlbnNpb25cbiAgICAgIGNvbnN0IGVtYmVkQnVpbGRGaWxlVXVpZCA9IHhjb2RlUHJvamVjdC5nZW5lcmF0ZVV1aWQoKTtcbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhCdWlsZEZpbGVbZW1iZWRCdWlsZEZpbGVVdWlkXSA9IHtcbiAgICAgICAgaXNhOiAnUEJYQnVpbGRGaWxlJyxcbiAgICAgICAgZmlsZVJlZjogcHJvZHVjdFV1aWQsXG4gICAgICAgIGZpbGVSZWZfY29tbWVudDogYCR7TlNFX1RBUkdFVF9OQU1FfS5hcHBleGAsXG4gICAgICAgIHNldHRpbmdzOiB7IEFUVFJJQlVURVM6IFsnUmVtb3ZlSGVhZGVyc09uQ29weSddIH0sXG4gICAgICB9O1xuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWEJ1aWxkRmlsZVtcbiAgICAgICAgYCR7ZW1iZWRCdWlsZEZpbGVVdWlkfV9jb21tZW50YFxuICAgICAgXSA9IGAke05TRV9UQVJHRVRfTkFNRX0uYXBwZXggaW4gRW1iZWQgRm91bmRhdGlvbiBFeHRlbnNpb25zYDtcblxuICAgICAgLy8gQ3JlYXRlIFwiRW1iZWQgRm91bmRhdGlvbiBFeHRlbnNpb25zXCIgY29weSBmaWxlcyBidWlsZCBwaGFzZVxuICAgICAgY29uc3QgY29weUZpbGVzQnVpbGRQaGFzZVV1aWQgPSB4Y29kZVByb2plY3QuZ2VuZXJhdGVVdWlkKCk7XG4gICAgICB4Y29kZVByb2plY3QuaGFzaC5wcm9qZWN0Lm9iamVjdHMuUEJYQ29weUZpbGVzQnVpbGRQaGFzZSA9XG4gICAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhDb3B5RmlsZXNCdWlsZFBoYXNlIHx8IHt9O1xuICAgICAgeGNvZGVQcm9qZWN0Lmhhc2gucHJvamVjdC5vYmplY3RzLlBCWENvcHlGaWxlc0J1aWxkUGhhc2VbXG4gICAgICAgIGNvcHlGaWxlc0J1aWxkUGhhc2VVdWlkXG4gICAgICBdID0ge1xuICAgICAgICBpc2E6ICdQQlhDb3B5RmlsZXNCdWlsZFBoYXNlJyxcbiAgICAgICAgYnVpbGRBY3Rpb25NYXNrOiAyMTQ3NDgzNjQ3LFxuICAgICAgICBkc3RQYXRoOiAnXCJcIicsXG4gICAgICAgIGRzdFN1YmZvbGRlclNwZWM6IDEzLCAvLyAxMyA9IFBsdWdJbnMgZm9sZGVyIGZvciBhcHAgZXh0ZW5zaW9uc1xuICAgICAgICBmaWxlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiBlbWJlZEJ1aWxkRmlsZVV1aWQsXG4gICAgICAgICAgICBjb21tZW50OiBgJHtOU0VfVEFSR0VUX05BTUV9LmFwcGV4IGluIEVtYmVkIEZvdW5kYXRpb24gRXh0ZW5zaW9uc2AsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgbmFtZTogJ1wiRW1iZWQgRm91bmRhdGlvbiBFeHRlbnNpb25zXCInLFxuICAgICAgICBydW5Pbmx5Rm9yRGVwbG95bWVudFBvc3Rwcm9jZXNzaW5nOiAwLFxuICAgICAgfTtcbiAgICAgIHhjb2RlUHJvamVjdC5oYXNoLnByb2plY3Qub2JqZWN0cy5QQlhDb3B5RmlsZXNCdWlsZFBoYXNlW1xuICAgICAgICBgJHtjb3B5RmlsZXNCdWlsZFBoYXNlVXVpZH1fY29tbWVudGBcbiAgICAgIF0gPSAnRW1iZWQgRm91bmRhdGlvbiBFeHRlbnNpb25zJztcblxuICAgICAgLy8gQWRkIHRoZSBjb3B5IGZpbGVzIGJ1aWxkIHBoYXNlIHRvIHRoZSBtYWluIGFwcCB0YXJnZXRcbiAgICAgIGlmIChtYWluQXBwVGFyZ2V0T2JqICYmIG1haW5BcHBUYXJnZXRPYmouYnVpbGRQaGFzZXMpIHtcbiAgICAgICAgbWFpbkFwcFRhcmdldE9iai5idWlsZFBoYXNlcy5wdXNoKHtcbiAgICAgICAgICB2YWx1ZTogY29weUZpbGVzQnVpbGRQaGFzZVV1aWQsXG4gICAgICAgICAgY29tbWVudDogJ0VtYmVkIEZvdW5kYXRpb24gRXh0ZW5zaW9ucycsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFtPbWV0cmlhXSBBZGRlZCAke05TRV9UQVJHRVRfTkFNRX0gZW1iZWRkaW5nIHRvICR7YXBwTmFtZX0gdGFyZ2V0YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW09tZXRyaWFdIEFkZGVkICR7TlNFX1RBUkdFVF9OQU1FfSB0YXJnZXQgdG8gWGNvZGUgcHJvamVjdGApO1xuXG4gICAgcmV0dXJuIF9jb25maWc7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZ2VuZXJhdGVOb3RpZmljYXRpb25TZXJ2aWNlU3dpZnQoYXBwR3JvdXBJZGVudGlmaWVyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYC8vXG4vLyAgTm90aWZpY2F0aW9uU2VydmljZS5zd2lmdFxuLy8gICR7TlNFX1RBUkdFVF9OQU1FfVxuLy9cbi8vICBHZW5lcmF0ZWQgYnkgcmVhY3QtbmF0aXZlLW9tZXRyaWEgRXhwbyBwbHVnaW5cbi8vXG5cbmltcG9ydCBVc2VyTm90aWZpY2F0aW9uc1xuaW1wb3J0IE9tZXRyaWFcblxuY2xhc3MgTm90aWZpY2F0aW9uU2VydmljZTogT21ldHJpYU5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24ge1xuICAgIG92ZXJyaWRlIGZ1bmMgaW5zdGFudGlhdGVPbWV0cmlhKCkgLT4gT21ldHJpYT8ge1xuICAgICAgICByZXR1cm4gT21ldHJpYS5pbml0aWFsaXplRm9yRXh0ZW5zaW9uKGFwcEdyb3VwSWRlbnRpZmllcjogXCIke2FwcEdyb3VwSWRlbnRpZmllcn1cIilcbiAgICB9XG59XG5gO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUluZm9QbGlzdCgpOiBzdHJpbmcge1xuICByZXR1cm4gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxuPCFET0NUWVBFIHBsaXN0IFBVQkxJQyBcIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTlwiIFwiaHR0cDovL3d3dy5hcHBsZS5jb20vRFREcy9Qcm9wZXJ0eUxpc3QtMS4wLmR0ZFwiPlxuPHBsaXN0IHZlcnNpb249XCIxLjBcIj5cbjxkaWN0PlxuICAgIDxrZXk+Q0ZCdW5kbGVEZXZlbG9wbWVudFJlZ2lvbjwva2V5PlxuICAgIDxzdHJpbmc+JChERVZFTE9QTUVOVF9MQU5HVUFHRSk8L3N0cmluZz5cbiAgICA8a2V5PkNGQnVuZGxlRGlzcGxheU5hbWU8L2tleT5cbiAgICA8c3RyaW5nPiR7TlNFX1RBUkdFVF9OQU1FfTwvc3RyaW5nPlxuICAgIDxrZXk+Q0ZCdW5kbGVFeGVjdXRhYmxlPC9rZXk+XG4gICAgPHN0cmluZz4kKEVYRUNVVEFCTEVfTkFNRSk8L3N0cmluZz5cbiAgICA8a2V5PkNGQnVuZGxlSWRlbnRpZmllcjwva2V5PlxuICAgIDxzdHJpbmc+JChQUk9EVUNUX0JVTkRMRV9JREVOVElGSUVSKTwvc3RyaW5nPlxuICAgIDxrZXk+Q0ZCdW5kbGVJbmZvRGljdGlvbmFyeVZlcnNpb248L2tleT5cbiAgICA8c3RyaW5nPjYuMDwvc3RyaW5nPlxuICAgIDxrZXk+Q0ZCdW5kbGVOYW1lPC9rZXk+XG4gICAgPHN0cmluZz4kKFBST0RVQ1RfTkFNRSk8L3N0cmluZz5cbiAgICA8a2V5PkNGQnVuZGxlUGFja2FnZVR5cGU8L2tleT5cbiAgICA8c3RyaW5nPiQoUFJPRFVDVF9CVU5ETEVfUEFDS0FHRV9UWVBFKTwvc3RyaW5nPlxuICAgIDxrZXk+Q0ZCdW5kbGVTaG9ydFZlcnNpb25TdHJpbmc8L2tleT5cbiAgICA8c3RyaW5nPiQoTUFSS0VUSU5HX1ZFUlNJT04pPC9zdHJpbmc+XG4gICAgPGtleT5DRkJ1bmRsZVZlcnNpb248L2tleT5cbiAgICA8c3RyaW5nPiQoQ1VSUkVOVF9QUk9KRUNUX1ZFUlNJT04pPC9zdHJpbmc+XG4gICAgPGtleT5OU0V4dGVuc2lvbjwva2V5PlxuICAgIDxkaWN0PlxuICAgICAgICA8a2V5Pk5TRXh0ZW5zaW9uUG9pbnRJZGVudGlmaWVyPC9rZXk+XG4gICAgICAgIDxzdHJpbmc+Y29tLmFwcGxlLnVzZXJub3RpZmljYXRpb25zLnNlcnZpY2U8L3N0cmluZz5cbiAgICAgICAgPGtleT5OU0V4dGVuc2lvblByaW5jaXBhbENsYXNzPC9rZXk+XG4gICAgICAgIDxzdHJpbmc+JChQUk9EVUNUX01PRFVMRV9OQU1FKS5Ob3RpZmljYXRpb25TZXJ2aWNlPC9zdHJpbmc+XG4gICAgPC9kaWN0PlxuPC9kaWN0PlxuPC9wbGlzdD5cbmA7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRW50aXRsZW1lbnRzKGFwcEdyb3VwSWRlbnRpZmllcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cbjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgXCItLy9BcHBsZS8vRFREIFBMSVNUIDEuMC8vRU5cIiBcImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGRcIj5cbjxwbGlzdCB2ZXJzaW9uPVwiMS4wXCI+XG48ZGljdD5cbiAgICA8a2V5PmNvbS5hcHBsZS5zZWN1cml0eS5hcHBsaWNhdGlvbi1ncm91cHM8L2tleT5cbiAgICA8YXJyYXk+XG4gICAgICAgIDxzdHJpbmc+JHthcHBHcm91cElkZW50aWZpZXJ9PC9zdHJpbmc+XG4gICAgPC9hcnJheT5cbjwvZGljdD5cbjwvcGxpc3Q+XG5gO1xufVxuXG4vKipcbiAqIE1haW4gTlNFIGNvbmZpZ3VyYXRpb24gZm9yIE9tZXRyaWFcbiAqL1xuZXhwb3J0IGNvbnN0IHdpdGhOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uOiBDb25maWdQbHVnaW48TlNFUGx1Z2luUHJvcHM+ID0gKFxuICBjb25maWcsXG4gIHByb3BzXG4pID0+IHtcbiAgLy8gQ3JlYXRlIE5TRSBmaWxlc1xuICBjb25maWcgPSB3aXRoTlNFRmlsZXMoY29uZmlnLCBwcm9wcyk7XG5cbiAgLy8gQWRkIE5TRSB0YXJnZXQgdG8gWGNvZGUgcHJvamVjdFxuICBjb25maWcgPSB3aXRoTlNFVGFyZ2V0KGNvbmZpZywgcHJvcHMpO1xuXG4gIHJldHVybiBjb25maWc7XG59O1xuIl19