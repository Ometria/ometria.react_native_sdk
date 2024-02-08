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
    
    public static var cachedToken: String? {
        get{
            let value = UserDefaults(suiteName: "group.com.tapptitude.ometria.sampleRN")?.object(forKey: "cachedTokenRN") as? String
            return value ?? nil
        }
        set{
            UserDefaults(suiteName: "group.com.tapptitude.ometria.sampleRN")?.set(newValue, forKey: "cachedTokenRN")
        }
    }
    
}
