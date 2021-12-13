package com.ometriareactnativesdk

import android.content.Context
import android.content.SharedPreferences

private const val LOCAL_CACHE_PREFERENCES = "LOCAL_CACHE_PREFERENCES"
private const  val SDK_VERSION_RN_KEY = "SDK_VERSION_RN_KEY"

internal class StorageController(private var context: Context) {
  private fun getLocalCachePreferences(): SharedPreferences {
    return context.getSharedPreferences(LOCAL_CACHE_PREFERENCES, Context.MODE_PRIVATE)
  }
  fun saveSdkVersionRN(sdkVersionRN: String) {
    getLocalCachePreferences().edit().putString(SDK_VERSION_RN_KEY, sdkVersionRN).apply()
  }
}
