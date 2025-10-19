//
//  NotificationService.swift
//  NotificationsService
//
//  Created by Vlad
//

import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
    override func instantiateOmetria() -> Ometria? {
        return Ometria.initializeForExtension(appGroupIdentifier: "group.com.tapptitude.ometria.sampleRN")
    }
}
