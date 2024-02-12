//
//  NotificationService.swift
//  NotificationService
//
//  Created by Vlad on 07.02.2024.
//

import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
  override func instantiateOmetria() -> Ometria? {
    Ometria.initializeForExtension(appGroupIdentifier: "group.com.tapptitude.ometria.sampleRN")
  }
}
  
