package com.ometriareactnativesdk

import android.app.Application
import com.android.ometriasdk.core.Ometria
import com.android.ometriasdk.core.event.OmetriaBasket
import com.android.ometriasdk.core.event.OmetriaBasketItem
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OmetriaReactNativeBasketModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "OmetriaReactNativeBasket"
  }

  @ReactMethod
  fun basketItem(productId: String, sku: String, quantity: Int, price: Float, promise: Promise) {
    return promise.resolve(OmetriaBasketItem(productId, sku, quantity, price))
  }

  @ReactMethod
  fun basket(totalPrice: Float, currency: String, items: List<OmetriaBasketItem>, promise: Promise) {
    return promise.resolve(OmetriaBasket(totalPrice, currency, items))
  }
}
