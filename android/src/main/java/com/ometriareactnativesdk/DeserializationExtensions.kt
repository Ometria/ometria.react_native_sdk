package com.ometriareactnativesdk

import com.android.ometriasdk.notification.OmetriaNotification
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

@Suppress("UNCHECKED_CAST")
fun toWritableArray(array: Array<Any?>): WritableArray? {
  val writableArray = Arguments.createArray()
  for (i in array.indices) {
    val value = array[i]
    if (value == null) {
      writableArray.pushNull()
    }
    if (value is Boolean) {
      writableArray.pushBoolean((value as Boolean?)!!)
    }
    if (value is Double) {
      writableArray.pushDouble((value as Double?)!!)
    }
    if (value is Int) {
      writableArray.pushInt((value as Int?)!!)
    }
    if (value is String) {
      writableArray.pushString(value as String?)
    }
    if (value is Map<*, *>) {
      writableArray.pushMap(toWritableMap((value as Map<String, *>?).orEmpty().toMutableMap()))
    }
    if (value!!.javaClass.isArray) {
      writableArray.pushArray(toWritableArray(value as Array<Any?>))
    }
  }
  return writableArray
}

@Suppress("UNCHECKED_CAST")
fun toWritableMap(map: MutableMap<String?, Any?>): WritableMap? {
  val writableMap = Arguments.createMap()
  val iterator: MutableIterator<*> = map.entries.iterator()
  while (iterator.hasNext()) {
    val pair = iterator.next() as Map.Entry<*, *>
    val value = pair.value
    when {
        value == null -> {
          writableMap.putNull((pair.key as String?)!!)
        }
        value is Boolean -> {
          writableMap.putBoolean((pair.key as String?)!!, (value as Boolean?)!!)
        }
        value is Double -> {
          writableMap.putDouble((pair.key as String?)!!, (value as Double?)!!)
        }
        value is Int -> {
          writableMap.putInt((pair.key as String?)!!, (value as Int?)!!)
        }
        value is String -> {
          writableMap.putString((pair.key as String?)!!, value as String?)
        }
        value is Map<*, *> -> {
          writableMap.putMap((pair.key as String?)!!, toWritableMap((value as Map<String?, Any?>?).orEmpty().toMutableMap()))
        }
        value.javaClass.isArray -> {
          writableMap.putArray((pair.key as String?)!!, toWritableArray(value as Array<Any?>))
        }
    }
    iterator.remove()
  }
  return writableMap
}
fun OmetriaNotification.toJSON() : WritableNativeMap {
  val ometriaNotifJson = WritableNativeMap()

  ometriaNotifJson.putString("deepLinkActionUrl", this.deepLinkActionUrl)
  ometriaNotifJson.putString("imageUrl", this.imageUrl)
  ometriaNotifJson.putString("campaignType", this.campaignType)
  ometriaNotifJson.putString("externalCustomerId", this.externalCustomerId)
  ometriaNotifJson.putString("sendId", this.sendId)
  ometriaNotifJson.putMap("tracking", toWritableMap(this.tracking.orEmpty().toMutableMap()))

  return ometriaNotifJson
}
