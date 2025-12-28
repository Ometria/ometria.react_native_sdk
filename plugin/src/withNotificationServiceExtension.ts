import {
  ConfigPlugin,
  withDangerousMod,
  withXcodeProject,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import type { OmetriaPluginProps } from './index';

const NSE_TARGET_NAME = 'OmetriaNotificationServiceExtension';
const NSE_FOLDER_NAME = 'OmetriaNotificationServiceExtension';

type IosPluginProps = OmetriaPluginProps & {
  ometriaIosSdkVersion: string;
};

/**
 * Creates the Notification Service Extension files
 */
const withNSEFiles: ConfigPlugin<IosPluginProps> = (config, props) => {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const iosPath = path.join(modConfig.modRequest.projectRoot, 'ios');
      const nsePath = path.join(iosPath, NSE_FOLDER_NAME);

      // Create NSE directory
      if (!fs.existsSync(nsePath)) {
        fs.mkdirSync(nsePath, { recursive: true });
      }

      // Create NotificationService.swift
      const swiftContent = generateNotificationServiceSwift(
        props.appGroupIdentifier
      );
      fs.writeFileSync(
        path.join(nsePath, 'NotificationService.swift'),
        swiftContent
      );

      // Create Info.plist
      const infoPlistContent = generateInfoPlist();
      fs.writeFileSync(
        path.join(nsePath, `${NSE_TARGET_NAME}-Info.plist`),
        infoPlistContent
      );

      // Create Entitlements
      const entitlementsContent = generateEntitlements(
        props.appGroupIdentifier
      );
      fs.writeFileSync(
        path.join(nsePath, `${NSE_TARGET_NAME}.entitlements`),
        entitlementsContent
      );

      return modConfig;
    },
  ]);
};

/**
 * Adds the NSE target to the Xcode project using proper xcode library methods
 */
const withNSETarget: ConfigPlugin<IosPluginProps> = (config) => {
  return withXcodeProject(config, (_config) => {
    const xcodeProject = _config.modResults;
    const appName = _config.modRequest.projectName || 'App';
    const bundleIdentifier = _config.ios?.bundleIdentifier || 'com.example.app';
    const bundleShortVersion = _config.ios?.buildNumber || '1';
    const bundleVersion = _config.version || '1.0.0';

    // Get deployment target from project build settings (synced with main app)
    let deploymentTarget = '15.1'; // Default minimum for Ometria SDK
    const buildConfigs =
      xcodeProject.hash.project.objects.XCBuildConfiguration || {};
    for (const [key, value] of Object.entries(buildConfigs)) {
      if (key.endsWith('_comment')) continue;
      const configObj = value as any;
      if (configObj.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
        const target =
          configObj.buildSettings.IPHONEOS_DEPLOYMENT_TARGET.replace(/"/g, '');
        // Use the highest deployment target found (at least 15.1 for Ometria)
        if (parseFloat(target) >= 15.1) {
          deploymentTarget = target;
          break;
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
      CURRENT_PROJECT_VERSION: bundleShortVersion,
      GENERATE_INFOPLIST_FILE: 'NO',
      INFOPLIST_FILE: `${NSE_FOLDER_NAME}/${NSE_TARGET_NAME}-Info.plist`,
      IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
      MARKETING_VERSION: bundleVersion,
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

    xcodeProject.hash.project.objects.XCBuildConfiguration[
      debugBuildConfigUuid
    ] = {
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
        DEBUG_INFORMATION_FORMAT: 'dwarf',
      },
      name: 'Debug',
    };
    xcodeProject.hash.project.objects.XCBuildConfiguration[
      `${debugBuildConfigUuid}_comment`
    ] = 'Debug';

    xcodeProject.hash.project.objects.XCBuildConfiguration[
      releaseBuildConfigUuid
    ] = {
      isa: 'XCBuildConfiguration',
      buildSettings: {
        ...commonBuildSettings,
        DEBUG_INFORMATION_FORMAT: `"dwarf-with-dsym"`,
      },
      name: 'Release',
    };
    xcodeProject.hash.project.objects.XCBuildConfiguration[
      `${releaseBuildConfigUuid}_comment`
    ] = 'Release';

    // Add build configuration list
    xcodeProject.hash.project.objects.XCConfigurationList =
      xcodeProject.hash.project.objects.XCConfigurationList || {};

    xcodeProject.hash.project.objects.XCConfigurationList[
      buildConfigurationListUuid
    ] = {
      isa: 'XCConfigurationList',
      buildConfigurations: [
        { value: debugBuildConfigUuid, comment: 'Debug' },
        { value: releaseBuildConfigUuid, comment: 'Release' },
      ],
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: 'Release',
    };
    xcodeProject.hash.project.objects.XCConfigurationList[
      `${buildConfigurationListUuid}_comment`
    ] = `Build configuration list for PBXNativeTarget "${NSE_TARGET_NAME}"`;

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
    xcodeProject.hash.project.objects.PBXFileReference[
      `${swiftFileUuid}_comment`
    ] = 'NotificationService.swift';

    // Add plist file reference
    const plistFileUuid = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects.PBXFileReference[plistFileUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'text.plist.xml',
      path: `${NSE_TARGET_NAME}-Info.plist`,
      sourceTree: '"<group>"',
    };
    xcodeProject.hash.project.objects.PBXFileReference[
      `${plistFileUuid}_comment`
    ] = `${NSE_TARGET_NAME}-Info.plist`;

    // Add entitlements file reference
    const entitlementsFileUuid = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects.PBXFileReference[entitlementsFileUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'text.plist.entitlements',
      path: `${NSE_TARGET_NAME}.entitlements`,
      sourceTree: '"<group>"',
    };
    xcodeProject.hash.project.objects.PBXFileReference[
      `${entitlementsFileUuid}_comment`
    ] = `${NSE_TARGET_NAME}.entitlements`;

    // Add product reference
    xcodeProject.hash.project.objects.PBXFileReference[productUuid] = {
      isa: 'PBXFileReference',
      explicitFileType: `"wrapper.app-extension"`,
      includeInIndex: 0,
      path: `${NSE_TARGET_NAME}.appex`,
      sourceTree: 'BUILT_PRODUCTS_DIR',
    };
    xcodeProject.hash.project.objects.PBXFileReference[
      `${productUuid}_comment`
    ] = `${NSE_TARGET_NAME}.appex`;

    // Add build file for swift source
    xcodeProject.hash.project.objects.PBXBuildFile =
      xcodeProject.hash.project.objects.PBXBuildFile || {};
    xcodeProject.hash.project.objects.PBXBuildFile[swiftFileBuildUuid] = {
      isa: 'PBXBuildFile',
      fileRef: swiftFileUuid,
      fileRef_comment: 'NotificationService.swift',
    };
    xcodeProject.hash.project.objects.PBXBuildFile[
      `${swiftFileBuildUuid}_comment`
    ] = 'NotificationService.swift in Sources';

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
      const productsGroup =
        xcodeProject.hash.project.objects.PBXGroup[productsGroupUuid];
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
    xcodeProject.hash.project.objects.PBXSourcesBuildPhase[
      sourcesBuildPhaseUuid
    ] = {
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
    xcodeProject.hash.project.objects.PBXSourcesBuildPhase[
      `${sourcesBuildPhaseUuid}_comment`
    ] = 'Sources';

    xcodeProject.hash.project.objects.PBXFrameworksBuildPhase =
      xcodeProject.hash.project.objects.PBXFrameworksBuildPhase || {};
    xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[
      frameworksBuildPhaseUuid
    ] = {
      isa: 'PBXFrameworksBuildPhase',
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[
      `${frameworksBuildPhaseUuid}_comment`
    ] = 'Frameworks';

    xcodeProject.hash.project.objects.PBXResourcesBuildPhase =
      xcodeProject.hash.project.objects.PBXResourcesBuildPhase || {};
    xcodeProject.hash.project.objects.PBXResourcesBuildPhase[
      resourcesBuildPhaseUuid
    ] = {
      isa: 'PBXResourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    xcodeProject.hash.project.objects.PBXResourcesBuildPhase[
      `${resourcesBuildPhaseUuid}_comment`
    ] = 'Resources';

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
    const nativeTargets =
      xcodeProject.hash.project.objects.PBXNativeTarget || {};
    let mainAppTargetUuid: string | null = null;

    for (const [uuid, target] of Object.entries(nativeTargets)) {
      if (uuid.endsWith('_comment')) continue;
      const targetObj = target as any;
      const targetName = (targetObj.name || '').replace(/"/g, '');
      const productType = (targetObj.productType || '').replace(/"/g, '');

      // Match by name or by being the application target (not extension)
      if (
        targetName === appName &&
        productType === 'com.apple.product-type.application'
      ) {
        mainAppTargetUuid = uuid;
        break;
      }
    }

    if (mainAppTargetUuid) {
      // Create PBXContainerItemProxy for the dependency
      const containerItemProxyUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects.PBXContainerItemProxy =
        xcodeProject.hash.project.objects.PBXContainerItemProxy || {};
      xcodeProject.hash.project.objects.PBXContainerItemProxy[
        containerItemProxyUuid
      ] = {
        isa: 'PBXContainerItemProxy',
        containerPortal: projectUuid,
        containerPortal_comment: 'Project object',
        proxyType: 1,
        remoteGlobalIDString: targetUuid,
        remoteInfo: `"${NSE_TARGET_NAME}"`,
      };
      xcodeProject.hash.project.objects.PBXContainerItemProxy[
        `${containerItemProxyUuid}_comment`
      ] = 'PBXContainerItemProxy';

      // Create PBXTargetDependency
      const targetDependencyUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects.PBXTargetDependency =
        xcodeProject.hash.project.objects.PBXTargetDependency || {};
      xcodeProject.hash.project.objects.PBXTargetDependency[
        targetDependencyUuid
      ] = {
        isa: 'PBXTargetDependency',
        target: targetUuid,
        target_comment: NSE_TARGET_NAME,
        targetProxy: containerItemProxyUuid,
        targetProxy_comment: 'PBXContainerItemProxy',
      };
      xcodeProject.hash.project.objects.PBXTargetDependency[
        `${targetDependencyUuid}_comment`
      ] = 'PBXTargetDependency';

      // Add dependency to main app target
      const mainAppTargetObj =
        xcodeProject.hash.project.objects.PBXNativeTarget[mainAppTargetUuid];
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
      xcodeProject.hash.project.objects.PBXBuildFile[
        `${embedBuildFileUuid}_comment`
      ] = `${NSE_TARGET_NAME}.appex in Embed Foundation Extensions`;

      // Create "Embed Foundation Extensions" copy files build phase
      const copyFilesBuildPhaseUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase =
        xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase || {};
      xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase[
        copyFilesBuildPhaseUuid
      ] = {
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
      xcodeProject.hash.project.objects.PBXCopyFilesBuildPhase[
        `${copyFilesBuildPhaseUuid}_comment`
      ] = 'Embed Foundation Extensions';

      // Add the copy files build phase to the main app target
      if (mainAppTargetObj && mainAppTargetObj.buildPhases) {
        mainAppTargetObj.buildPhases.push({
          value: copyFilesBuildPhaseUuid,
          comment: 'Embed Foundation Extensions',
        });
      }

      console.log(
        `[Ometria] Added ${NSE_TARGET_NAME} embedding to ${appName} target`
      );
    }

    console.log(`[Ometria] Added ${NSE_TARGET_NAME} target to Xcode project`);

    return _config;
  });
};

function generateNotificationServiceSwift(appGroupIdentifier: string): string {
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

function generateInfoPlist(): string {
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

function generateEntitlements(appGroupIdentifier: string): string {
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
export const withNotificationServiceExtension: ConfigPlugin<IosPluginProps> = (
  config,
  props
) => {
  // Create NSE files
  config = withNSEFiles(config, props);

  // Add NSE target to Xcode project
  config = withNSETarget(config, props);

  return config;
};
