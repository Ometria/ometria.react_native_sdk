package com.ometriareactnativesdk

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class OmetriaReactNativeSdkPackage : TurboReactPackage() {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(OmetriaReactNativeSdkModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == OmetriaReactNativeSdkModule.NAME) {
      OmetriaReactNativeSdkModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        OmetriaReactNativeSdkModule.NAME to ReactModuleInfo(
          OmetriaReactNativeSdkModule.NAME,
          OmetriaReactNativeSdkModule::class.java.name,
          false,
          false,
          false,
          false,
          true
        )
      )
    }
}
