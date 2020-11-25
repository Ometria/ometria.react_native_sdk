package com.ometriareactnativesdk

import android.app.Application
import com.android.ometriasdk.core.Ometria
import com.android.ometriasdk.core.event.OmetriaBasket
import com.android.ometriasdk.core.event.OmetriaBasketItem
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OmetriaReactNativeSdkModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "OmetriaReactNativeSdk"
    }

    @ReactMethod
    fun basketItem(productId: String, sku: String, quantity: Int, price: Float, promise: Promise) {
      return promise.resolve(OmetriaBasketItem(productId, sku, quantity, price))
    }

    @ReactMethod
    fun basket(totalPrice: Float, currency: String, items: List<OmetriaBasketItem>, promise: Promise) {
      return promise.resolve(OmetriaBasket(totalPrice, currency, items))
    }

    @ReactMethod
    fun initializeWithApiToken(apiToken: String) {
      Ometria.initialize(reactContext.applicationContext as Application, apiToken, reactContext.applicationInfo.icon)
    }

    @ReactMethod
    fun trackProfileIdentifiedEventByCustomerID(customerId: String) {
      Ometria.instance().trackProfileIdentifiedByCustomerIdEvent(customerId)
    }

    @ReactMethod
    fun trackProfileIdentifiedEventByEmail(email: String) {
      Ometria.instance().trackProfileIdentifiedByCustomerIdEvent(email)
    }

    @ReactMethod
    fun trackProductViewedEvent(productId: String) {
      Ometria.instance().trackProductViewedEvent(productId)
    }

    @ReactMethod
    fun trackProductCategoryViewedEvent(category: String) {
      Ometria.instance().trackProductViewedEvent(category)
    }

    @ReactMethod
    fun trackWishlistAddedToEvent(productId: String) {
      Ometria.instance().trackWishlistAddedToEvent(productId)
    }

    @ReactMethod
    fun trackWishlistRemovedFromEvent(productId: String) {
      Ometria.instance().trackWishlistRemovedFromEvent(productId)
    }

    @ReactMethod
    fun trackBasketViewedEvent() {
      Ometria.instance().trackBasketViewedEvent()
    }

    @ReactMethod
    fun trackBasketUpdatedEvent(basket: OmetriaBasket) {
      Ometria.instance().trackBasketUpdatedEvent(basket)
    }

    @ReactMethod
    fun trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket, promise: Promise) {
      Ometria.instance().trackOrderCompletedEvent(orderId, basket)
    }

    @ReactMethod
    fun trackDeepLinkOpenedEvent(link: String, screenName: String) {
      Ometria.instance().trackDeepLinkOpenedEvent(link, screenName)
    }

    @ReactMethod
    fun trackScreenViewedEvent(screenName: String, additionalInfo: Map<String, Any>) {
      Ometria.instance().trackScreenViewedEvent(screenName, additionalInfo)
    }

    @ReactMethod
    fun trackCustomEvent(customEventType: String, additionalInfo: Map<String, Any>) {
      Ometria.instance().trackCustomEvent(customEventType, additionalInfo)
    }

    @ReactMethod
    fun flush() {
      Ometria.instance().flush()
    }

    @ReactMethod
    fun clear() {
      Ometria.instance().clear()
    }

    @ReactMethod
    fun isLoggingEnabled(enabled: Boolean) {
      Ometria.instance().loggingEnabled(enabled)
    }
}
