package com.ometriareactnativesdk

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
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
    private const val RN_SDK_VERSION_META_KEY = "OmetriaRNSdkVersion"
    private const val BARE_RN_SDK_VERSION = "2.8.0"

    /**
     * Id of the high-importance channel the SDK creates so Android displays Ometria's
     * `notification`-type pushes as heads-up notifications. Bare RN apps set this same value as
     * `messaging_android_notification_channel_id` in firebase.json so Firebase posts to it.
     */
    const val PUSH_NOTIFICATION_CHANNEL_ID = "ometria_high_importance"
  }

  private val mainThreadHandler = Handler(reactContext.mainLooper)
  private var deeplinkInteractionPromise: Promise? = null

  init {
    val rnSdkVersion = try {
      val appInfo = reactContext.packageManager.getApplicationInfo(
        reactContext.packageName,
        PackageManager.GET_META_DATA
      )
      appInfo.metaData?.getString(RN_SDK_VERSION_META_KEY) ?: BARE_RN_SDK_VERSION
    } catch (e: Exception) {
      BARE_RN_SDK_VERSION
    }
    StorageController(reactContext.applicationContext).saveSdkVersionRN(rnSdkVersion)
  }

  override fun getName(): String = NAME

  @ReactMethod
  override fun initializeWithApiToken(apiToken: String, options: ReadableMap?, promise: Promise) {
    val notificationChannelName = options?.getString("notificationChannelName") ?: " "
    val runOnMainThreadTask = Runnable {
      Ometria.initialize(
        application = reactContext.applicationContext as Application,
        apiToken = apiToken,
        notificationIcon = reactContext.applicationInfo.icon,
        notificationChannelName = notificationChannelName
      )
      createPushNotificationChannel(notificationChannelName)
      promise.resolve(null)
    }
    mainThreadHandler.post(runOnMainThreadTask)
  }

  /**
   * Creates the high-importance notification channel that Android uses to display Ometria's
   * `notification`-type pushes as heads-up notifications.
   *
   * Ometria pushes are rendered by Android/Firebase directly (not by the SDK), so whether a push
   * shows as a heads-up pop-up depends on the channel Firebase posts to. Firebase only USES the
   * channel referenced by `messaging_android_notification_channel_id` (firebase.json) — it never
   * creates it — so the SDK creates it here. Because Ometria can only deliver a push after the
   * app has registered its FCM token (i.e. after initialize has run at least once), this channel
   * always exists before the first push can arrive, including in the killed state.
   *
   * The channel id is fixed ([PUSH_NOTIFICATION_CHANNEL_ID]); its display name comes from the
   * `notificationChannelName` option. Android freezes a channel's importance at creation.
   */
  private fun createPushNotificationChannel(channelName: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        PUSH_NOTIFICATION_CHANNEL_ID,
        channelName.ifBlank { "Notifications" },
        NotificationManager.IMPORTANCE_HIGH
      )
      reactContext.getSystemService(NotificationManager::class.java)
        ?.createNotificationChannel(channel)
    }
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
    Ometria.instance().trackProfileIdentifiedEvent(email, customerId, storeId)
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
  override fun setTrackingEnabled(enabled: Boolean, promise: Promise) {
    Ometria.instance().setTrackingEnabled(enabled)
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
