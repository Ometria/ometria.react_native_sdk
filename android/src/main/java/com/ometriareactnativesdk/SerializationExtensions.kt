package com.ometriareactnativesdk

import com.facebook.react.bridge.ReadableMap
import com.google.firebase.messaging.RemoteMessage

private const val KEY_REMOTE_MESSAGE = "_"
private const val KEY_COLLAPSE_KEY = "collapseKey"
private const val KEY_DATA = "data"
private const val KEY_MESSAGE_ID = "messageId"
private const val KEY_MESSAGE_TYPE = "messageType"
private const val KEY_TTL = "ttl"

fun ReadableMap.remoteMessageFromReadableMap(): RemoteMessage {
  val builder = RemoteMessage.Builder(KEY_REMOTE_MESSAGE)

  if (hasKey(KEY_TTL)) {
    builder.setTtl(getInt(KEY_TTL))
  }
  if (hasKey(KEY_MESSAGE_ID)) {
    builder.setMessageId(getString(KEY_MESSAGE_ID)!!)
  }
  if (hasKey(KEY_MESSAGE_TYPE)) {
    builder.setMessageType(getString(KEY_MESSAGE_TYPE))
  }
  if (hasKey(KEY_COLLAPSE_KEY)) {
    builder.setCollapseKey(getString(KEY_COLLAPSE_KEY))
  }
  if (hasKey(KEY_DATA)) {
    val messageData = getMap(KEY_DATA)
    val iterator = messageData!!.keySetIterator()
    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      builder.addData(key, messageData.getString(key))
    }
  }

  return builder.build()
}
