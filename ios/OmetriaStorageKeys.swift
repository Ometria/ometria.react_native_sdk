//
//  OmetriaStorageKeys.swift
//  OmetriaReactNativeSdk
//
//  Created by Razvan on 13.12.2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

public struct OmetriaStorageKeys {
    
    public static var rnVersion: String? {
        get{
            let value = UserDefaults.standard.object(forKey: "sdkVersionRN") as? String
            return value ?? nil
        }
        set{
            UserDefaults.standard.set(newValue, forKey: "sdkVersionRN")
            UserDefaults.standard.synchronize()
        }
    }

    // The Notification Service Extension runs in its own process and can't read the app's standard
    // UserDefaults. The native SDK reads sdkVersionRN from the App Group suite first, so mirror it there.
    public static func setRNVersion(_ version: String?, appGroupIdentifier: String?) {
        rnVersion = version
        guard let appGroupIdentifier = appGroupIdentifier,
              let suite = UserDefaults(suiteName: appGroupIdentifier) else { return }
        suite.set(version, forKey: "sdkVersionRN")
    }
}
