package com.ometriareactnativesdk

import android.app.Application
import android.util.Log
import com.android.ometriasdk.core.Ometria
import com.android.ometriasdk.core.event.OmetriaBasket
import com.android.ometriasdk.core.event.OmetriaBasketItem
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.google.firebase.messaging.RemoteMessage
import com.google.gson.Gson

private const val KEY_REMOTE_MESSAGE = "_"
private const val KEY_COLLAPSE_KEY = "collapseKey"
private const val KEY_DATA = "data"
private const val KEY_MESSAGE_ID = "messageId"
private const val KEY_MESSAGE_TYPE = "messageType"
private const val KEY_TTL = "ttl"

class OmetriaReactNativeSdkModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val basketItems = mutableListOf<OmetriaBasketItem>()

  override fun getName(): String {
    return "OmetriaReactNativeSdk"
  }

  @ReactMethod
  fun initializeWithApiToken(apiToken: String) {
    Ometria.initialize(
      reactContext.applicationContext as Application,
      apiToken,
      reactContext.applicationInfo.icon
    )
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
  fun trackBasketUpdatedEvent(totalPrice: Float, currency: String) {
    Ometria.instance().trackBasketUpdatedEvent(OmetriaBasket(totalPrice, currency, basketItems))
    basketItems.clear()
  }

  @ReactMethod
  fun addBasketItem(productId: String, sku: String, quantity: Int, price: Float) {
    basketItems.add(OmetriaBasketItem(productId, sku, quantity, price))
  }

  @ReactMethod
  fun trackOrderCompletedEvent(orderId: String, totalPrice: Float, currency: String) {
    Ometria.instance().trackOrderCompletedEvent(orderId, OmetriaBasket(totalPrice, currency, basketItems))
    basketItems.clear()
  }

  @ReactMethod
  fun trackDeepLinkOpenedEvent(link: String, screenName: String) {
    Ometria.instance().trackDeepLinkOpenedEvent(link, screenName)
  }

  @ReactMethod
  fun trackScreenViewedEvent(screenName: String, additionalInfo: ReadableMap) {
    Ometria.instance().trackScreenViewedEvent(screenName, additionalInfo.toHashMap())
  }

  @ReactMethod
  fun trackCustomEvent(customEventType: String, additionalInfo: ReadableMap) {
    Ometria.instance().trackCustomEvent(customEventType, additionalInfo.toHashMap())
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
    val message = remoteMessageFromReadableMap(remoteMessage)
    Log.d("remoteMessage", remoteMessage.toString())
    Ometria.instance().onMessageReceived(message!!)
  }

  @ReactMethod
  fun onNewToken(token: String) {
    Ometria.instance().onNewToken(token)
  }

  fun remoteMessageFromReadableMap(readableMap: ReadableMap): RemoteMessage? {
    val builder = RemoteMessage.Builder(KEY_REMOTE_MESSAGE)
    if (readableMap.hasKey(KEY_TTL)) {
      builder.setTtl(readableMap.getInt(KEY_TTL))
    }
    if (readableMap.hasKey(KEY_MESSAGE_ID)) {
      builder.setMessageId(readableMap.getString(KEY_MESSAGE_ID)!!)
    }
    if (readableMap.hasKey(KEY_MESSAGE_TYPE)) {
      builder.setMessageType(readableMap.getString(KEY_MESSAGE_TYPE))
    }
    if (readableMap.hasKey(KEY_COLLAPSE_KEY)) {
      builder.setCollapseKey(readableMap.getString(KEY_COLLAPSE_KEY))
    }
    if (readableMap.hasKey(KEY_DATA)) {
      val messageData = readableMap.getMap(KEY_DATA)
      val iterator = messageData!!.keySetIterator()
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        builder.addData(key, messageData.getString(key))
      }
    }
    return builder.build()
  }
}
