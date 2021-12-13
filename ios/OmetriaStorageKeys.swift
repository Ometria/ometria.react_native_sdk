//
//  OmetriaStorageKeys.swift
//  OmetriaReactNativeSdk
//
//  Created by Razvan on 13.12.2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

struct OmetriaStorageKeys {
    
    static var rnVersion: String? {
        get{
            let value = UserDefaults.standard.object(forKey: "com.ometria.sdkVersionRN") as? String
            return value ?? nil
        }
        set{
            UserDefaults.standard.set(newValue, forKey: "com.ometria.sdkVersionRN")
            UserDefaults.standard.synchronize()
        }
    }
    
}
