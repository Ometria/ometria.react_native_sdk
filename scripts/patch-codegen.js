#!/usr/bin/env node
/**
 * Patches the generated RCTModuleProviders.mm file to include our TurboModule
 * This script runs after Codegen to register our custom Objective-C++ wrapper
 */

const fs = require('fs');
const path = require('path');

// Path to the generated file (relative to project root)
const PROVIDERS_FILE_PATH = 'build/generated/ios/RCTModuleProviders.mm';

// Module registration entry
const MODULE_NAME = 'OmetriaReactNativeSdk';
const MODULE_CLASS = 'OmetriaReactNativeSdkTurboModule';

function patchModuleProviders(basePath) {
  const filePath = path.join(basePath, PROVIDERS_FILE_PATH);

  if (!fs.existsSync(filePath)) {
    console.log(`[Ometria] RCTModuleProviders.mm not found at ${filePath}, skipping patch`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already patched
  if (content.includes(MODULE_NAME)) {
    console.log(`[Ometria] Module already registered in RCTModuleProviders.mm`);
    return;
  }

  // Add module mapping entry
  const searchPattern = /moduleMapping = @\{\s*/;
  const replacement = `moduleMapping = @{\n      @"${MODULE_NAME}": @"${MODULE_CLASS}",\n      `;

  if (searchPattern.test(content)) {
    content = content.replace(searchPattern, replacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[Ometria] Successfully patched RCTModuleProviders.mm`);
}

// Get the iOS build directory from command line or use default
const iosBuildDir = process.argv[2] || path.join(process.cwd(), 'ios');

patchModuleProviders(iosBuildDir);
