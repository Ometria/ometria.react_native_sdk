import Ometria

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: NSObject {

    @objc(multiply:withB:withResolver:withRejecter:)
    func multiply(a: Float, b: Float, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(a*b)
    }

    @objc(initializeWithApiToken:withResolver:withRejecter:)
    func initialize(apiToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let ometriaInit = Ometria.initialize(apiToken: apiToken)
        resolve(ometriaInit)
    }

}
