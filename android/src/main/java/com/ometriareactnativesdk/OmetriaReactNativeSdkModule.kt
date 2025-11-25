package com.ometriareactnativesdk

import android.app.Application
import android.os.Handler
import com.android.ometriasdk.core.Ometria
import com.android.ometriasdk.core.listener.ProcessAppLinkListener
import com.android.ometriasdk.notification.OmetriaNotificationInteractionHandler
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import java.lang.Runnable

@ReactModule(name = OmetriaReactNativeSdkModule.NAME)
class OmetriaReactNativeSdkModule(private val reactContext: ReactApplicationContext) :
  NativeOmetriaReactNativeSdkSpec(reactContext),
  OmetriaNotificationInteractionHandler {

  companion object {
    const val NAME = "OmetriaReactNativeSdk"
  }

  private val mainThreadHandler = Handler(reactContext.mainLooper)
  private var deeplinkInteractionPromise: Promise? = null

  init {
    StorageController(reactContext.applicationContext).saveSdkVersionRN("2.6.1")
  }

  override fun getName(): String = NAME

  @ReactMethod
  override fun initializeWithApiToken(apiToken: String, options: ReadableMap?, promise: Promise) {
    val runOnMainThreadTask = Runnable {
      Ometria.initialize(
        application = reactContext.applicationContext as Application,
        apiToken = apiToken,
        notificationIcon = reactContext.applicationInfo.icon,
        notificationChannelName = options?.getString("notificationChannelName") ?: " "
      )
      promise.resolve(null)
    }
    mainThreadHandler.post(runOnMainThreadTask)
  }

  @ReactMethod
  override fun updateStoreId(storeId: String?, promise: Promise) {
    Ometria.instance().updateStoreId(storeId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProfileIdentifiedByCustomerIdEvent(
    customerId: String,
    storeId: String?,
    promise: Promise
  ) {
    Ometria.instance().trackProfileIdentifiedByCustomerIdEvent(customerId, storeId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProfileIdentifiedByEmailEvent(
    email: String,
    storeId: String?,
    promise: Promise
  ) {
    Ometria.instance().trackProfileIdentifiedByEmailEvent(email, storeId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProfileIdentifiedEvent(
    customerId: String,
    email: String,
    storeId: String?,
    promise: Promise
  ) {
    Ometria.instance().trackProfileIdentifiedEvent(customerId, email, storeId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProfileDeidentifiedEvent(promise: Promise) {
    Ometria.instance().trackProfileDeidentifiedEvent()
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProductViewedEvent(productId: String, promise: Promise) {
    Ometria.instance().trackProductViewedEvent(productId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackProductListingViewedEvent(
    listingType: String?,
    listingAttributes: ReadableMap?,
    promise: Promise
  ) {
    Ometria.instance().trackProductListingViewedEvent(
      listingType,
      listingAttributes?.toHashMap().orEmpty() as Map<String, Any>
    )
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackWishlistAddedToEvent(productId: String, promise: Promise) {
    Ometria.instance().trackWishlistAddedToEvent(productId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackWishlistRemovedFromEvent(productId: String, promise: Promise) {
    Ometria.instance().trackWishlistRemovedFromEvent(productId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackBasketViewedEvent(promise: Promise) {
    Ometria.instance().trackBasketViewedEvent()
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackBasketUpdatedEvent(basket: ReadableMap, promise: Promise) {
    Ometria.instance().trackBasketUpdatedEvent(basket.basketFromReadableMap())
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackCheckoutStartedEvent(orderId: String, promise: Promise) {
    Ometria.instance().trackCheckoutStartedEvent(orderId)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackOrderCompletedEvent(orderId: String, basket: ReadableMap?, promise: Promise) {
    Ometria.instance().trackOrderCompletedEvent(orderId, basket?.basketFromReadableMap())
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackHomeScreenViewedEvent(promise: Promise) {
    Ometria.instance().trackHomeScreenViewedEvent()
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackDeepLinkOpenedEvent(link: String, screenName: String, promise: Promise) {
    Ometria.instance().trackDeepLinkOpenedEvent(link, screenName)
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackScreenViewedEvent(
    screenName: String,
    additionalInfo: ReadableMap?,
    promise: Promise
  ) {
    Ometria.instance().trackScreenViewedEvent(
      screenName,
      (additionalInfo?.toHashMap() ?: mutableMapOf()) as Map<String, Any>
    )
    promise.resolve(null)
  }

  @ReactMethod
  override fun trackCustomEvent(
    customEventType: String,
    additionalInfo: ReadableMap?,
    promise: Promise
  ) {
    Ometria.instance().trackCustomEvent(
      customEventType,
      (additionalInfo?.toHashMap() ?: mutableMapOf()) as Map<String, Any>
    )
    promise.resolve(null)
  }

  @ReactMethod
  override fun flush(promise: Promise) {
    Ometria.instance().flush()
    promise.resolve(null)
  }

  @ReactMethod
  override fun clear(promise: Promise) {
    Ometria.instance().clear()
    promise.resolve(null)
  }

  @ReactMethod
  override fun isLoggingEnabled(enabled: Boolean, promise: Promise) {
    Ometria.instance().loggingEnabled(enabled)
    promise.resolve(null)
  }

  @ReactMethod
  override fun onMessageReceived(remoteMessage: ReadableMap, promise: Promise) {
    val message = remoteMessage.remoteMessageFromReadableMap()
    Ometria.instance().onMessageReceived(message)
    promise.resolve(null)
  }

  @ReactMethod
  override fun onNotificationReceived(remoteMessage: ReadableMap, promise: Promise) {
    val message = remoteMessage.remoteMessageFromReadableMap()
    Ometria.instance().onNotificationReceived(message)
    promise.resolve(null)
  }

  @ReactMethod
  override fun parseNotification(remoteMessage: ReadableMap, promise: Promise) {
    val message = remoteMessage.remoteMessageFromReadableMap()
    val ometriaNotification = Ometria.instance().parseNotification(message)
    promise.resolve(ometriaNotification?.toJSON())
  }

  @ReactMethod
  override fun onNotificationInteracted(remoteMessage: ReadableMap, promise: Promise) {
    val message = remoteMessage.remoteMessageFromReadableMap()
    Ometria.instance().onNotificationInteracted(message)
    promise.resolve(null)
  }

  @ReactMethod
  override fun onNewToken(token: String, promise: Promise) {
    Ometria.instance().onNewToken(token)
    promise.resolve(null)
  }

  @ReactMethod
  override fun onDeepLinkInteracted(promise: Promise) {
    deeplinkInteractionPromise = promise
    Ometria.instance().notificationInteractionHandler = this
  }

  override fun onDeepLinkInteraction(deepLink: String) {
    deeplinkInteractionPromise?.resolve(deepLink)
  }

  @ReactMethod
  override fun processUniversalLink(url: String, promise: Promise) {
    Ometria.instance().processAppLink(
      url,
      object : ProcessAppLinkListener {
        override fun onProcessFailed(error: String) {
          promise.reject(Throwable(error))
        }

        override fun onProcessResult(url: String) {
          promise.resolve(url)
        }
      }
    )
  }
}
