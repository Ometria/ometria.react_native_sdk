package com.ometriareactnativesdk

import com.facebook.react.bridge.ReadableMap
import com.google.firebase.messaging.RemoteMessage

private const val KEY_REMOTE_MESSAGE = "_"
private const val KEY_COLLAPSE_KEY = "collapseKey"
private const val KEY_DATA = "data"
private const val KEY_MESSAGE_ID = "messageId"
private const val KEY_MESSAGE_TYPE = "messageType"
private const val KEY_TTL = "ttl"

fun remoteMessageFromReadableMap(readableMap: ReadableMap): RemoteMessage {
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
