//
//  OmetriaRNNotificationServiceExtension.swift
//  ometria-react-native-sdk
//
//  Created by Catalin Demian on 08.02.2024.
//

import Foundation
import UserNotifications
import Ometria

class OmetriaRNNotificationServiceExtension: OmetriaNotificationServiceExtension {
    override func instantiateOmetria() -> Ometria? {
        if let apiToken = OmetriaStorageKeys.cachedToken {
            Ometria.initializeForExtension(apiToken: apiToken, appGroupIdentifier: "group.com.tapptitude.ometria.sampleRN")
        }
        return nil
    }
}
