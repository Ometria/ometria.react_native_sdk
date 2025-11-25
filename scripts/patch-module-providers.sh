#!/bin/bash

# Script to patch RCTModuleProviders.mm after Codegen runs
# This adds our custom TurboModule to the module registry

PROVIDERS_FILE="${SCRIPT_OUTPUT_FILE_0}"

if [ ! -f "$PROVIDERS_FILE" ]; then
  echo "RCTModuleProviders.mm not found at $PROVIDERS_FILE"
  exit 0
fi

# Check if our module is already registered
if grep -q "OmetriaReactNativeSdk" "$PROVIDERS_FILE"; then
  echo "Module already registered in RCTModuleProviders.mm"
  exit 0
fi

# Add our module to the moduleMapping dictionary
sed -i '' 's/moduleMapping = @{/moduleMapping = @{\
      @"OmetriaReactNativeSdk": @"OmetriaReactNativeSdkTurboModule"/' "$PROVIDERS_FILE"

echo "Added OmetriaReactNativeSdk to RCTModuleProviders.mm"
