package com.ometriareactnativesdk

import android.app.Application
import android.os.Handler
import com.android.ometriasdk.core.Ometria
import com.android.ometriasdk.notification.OmetriaNotificationInteractionHandler
import com.facebook.react.bridge.*


class OmetriaReactNativeSdkModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), OmetriaNotificationInteractionHandler {

  var deeplinkInteractionPromise: Promise? = null

  override fun getName(): String {
    return "OmetriaReactNativeSdk"
  }

  // Get a handler that can be used to post to the main thread
  val mainThreadHandler = Handler(reactContext.mainLooper)

  @ReactMethod
  fun initializeWithApiToken(apiToken: String) {
    // run on main thread
    val runOnMainThreadTask = Runnable {
      Ometria.initialize(
        reactContext.applicationContext as Application,
        apiToken,
        reactContext.applicationInfo.icon
      )
    }
    mainThreadHandler.post(runOnMainThreadTask)
  }

  @ReactMethod
  fun trackProfileIdentifiedByCustomerIdEvent(customerId: String) {
    Ometria.instance().trackProfileIdentifiedByCustomerIdEvent(customerId)
  }

  @ReactMethod
  fun trackProfileIdentifiedByEmailEvent(email: String) {
    Ometria.instance().trackProfileIdentifiedByEmailEvent(email)
  }

  @ReactMethod
  fun trackProfileDeidentifiedEvent() {
    Ometria.instance().trackProfileDeidentifiedEvent()
  }

  @ReactMethod
  fun trackProductViewedEvent(productId: String) {
    Ometria.instance().trackProductViewedEvent(productId)
  }

  @ReactMethod
  fun trackProductListingViewedEvent() {
    Ometria.instance().trackProductListingViewedEvent()
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
  fun trackBasketUpdatedEvent(basket: ReadableMap) {
    Ometria.instance().trackBasketUpdatedEvent(basket.basketFromReadableMap())
  }

  @ReactMethod
  fun trackCheckoutStartedEvent(orderId: String) {
    Ometria.instance().trackCheckoutStartedEvent(orderId)
  }

  @ReactMethod
  fun trackOrderCompletedEvent(orderId: String, basket: ReadableMap? = null) {
    Ometria.instance().trackOrderCompletedEvent(orderId, basket?.basketFromReadableMap())
  }

  @ReactMethod
  fun trackHomeScreenViewedEvent() {
    Ometria.instance().trackHomeScreenViewedEvent()
  }

  @ReactMethod
  fun trackDeepLinkOpenedEvent(link: String, screenName: String) {
    Ometria.instance().trackDeepLinkOpenedEvent(link, screenName)
  }

  @ReactMethod
  fun trackScreenViewedEvent(screenName: String, additionalInfo: ReadableMap? = null) {
    Ometria.instance().trackScreenViewedEvent(screenName, additionalInfo?.toHashMap()
      ?: mutableMapOf())
  }

  @ReactMethod
  fun trackCustomEvent(customEventType: String, additionalInfo: ReadableMap? = null) {
    Ometria.instance().trackCustomEvent(customEventType, additionalInfo?.toHashMap()
      ?: mutableMapOf())
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

  @ReactMethod
  fun onMessageReceived(remoteMessage: ReadableMap) {
    val message = remoteMessage.remoteMessageFromReadableMap()
    message.let {
      Ometria.instance().onMessageReceived(message)
    }
  }

  @ReactMethod
  fun onNewToken(token: String) {
    Ometria.instance().onNewToken(token)
  }

  @ReactMethod
  fun onDeepLinkInteracted(resolver: Promise) {
    deeplinkInteractionPromise = resolver
    Ometria.instance().notificationInteractionHandler = this
  }

  override fun onDeepLinkInteraction(deepLink: String) {
    deeplinkInteractionPromise?.resolve(deepLink)
  }
}
