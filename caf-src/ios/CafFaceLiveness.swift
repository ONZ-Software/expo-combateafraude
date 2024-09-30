//
//  CafFaceLiveness.swift
//  cafbridge_faceliveness
//
//  Created by Cristian Henz Krein on 23/10/23.
//

import Foundation
import React
import FaceLiveness

@objc(CafFaceLiveness)
class CafFaceLiveness: RCTEventEmitter, FaceLivenessDelegate {
  static let shared = CafFaceLiveness()

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return [
      "FaceLiveness_Success",
      "FaceLiveness_Error",
      "FaceLiveness_Cancel",
      "FaceLiveness_Loading",
      "FaceLiveness_Loaded",
      "FaceAuthenticator_Success",
      "FaceAuthenticator_Error",
      "FaceAuthenticator_Cancel",
      "FaceAuthenticator_Loading",
      "FaceAuthenticator_Loaded",
      "Identity_Success",
      "Identity_Pending",
      "Identity_Error"
    ]
  }

  @objc(faceLiveness:personId:config:)
  func faceLiveness(token: String, personId: String, config: String) {
    var configDictionary: [String: Any]? = nil
    var filter = Filter.lineDrawing;
    var cafStage = FaceLiveness.CAFStage.prod
    var setLoadingScreen:Bool? = nil;

    if let data = config.data(using: .utf8) {
      configDictionary = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
    }

    if let loadingScreen = configDictionary?["setLoadingScreen"] as? Bool {
      setLoadingScreen = loadingScreen
    }

    if let filterValue = configDictionary?["filter"] as? Int, let newFilter = Filter(rawValue: filterValue) {
      filter = newFilter
    }

    if let cafStageValue = configDictionary?["cafStage"] as? Int, let newCafStage = FaceLiveness.CAFStage(rawValue: cafStageValue) {
      cafStage = newCafStage
    }

    let faceLiveness = FaceLivenessSDK.Build()
        .setStage(stage: cafStage)
        .setFilter(filter: filter)
        .setLoadingScreen(withLoading: setLoadingScreen!)
        .build()
        faceLiveness.delegate = self

        DispatchQueue.main.async {
          if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
             let window = scene.windows.first(where: { $0.isKeyWindow }),
             let currentViewController = window.rootViewController {
              faceLiveness.startSDK(viewController: currentViewController, mobileToken: token, personId: personId)
          }
        }
  }


  // FaceLiveness
  func didFinishLiveness(with livenessResult: FaceLiveness.LivenessResult) {
    let response : NSMutableDictionary = [:]
        response["data"] = livenessResult.signedResponse
        sendEvent(withName: "FaceLiveness_Success", body: response)
  }


  func didFinishWithCancelled() {
    sendEvent(withName: "FaceLiveness_Cancel", body: nil)
  }

  func didFinishWithError(with sdkFailure: FaceLiveness.SDKFailure) {
    let response : NSMutableDictionary = [:]
        response["message"] = sdkFailure.description
        response["type"] = String(describing: sdkFailure.errorType)
        sendEvent(withName: "FaceLiveness_Error", body: response)
  }

  func openLoadingScreenStartSDK() {
    sendEvent(withName: "FaceLiveness_Loading", body: nil)
  }

  func closeLoadingScreenStartSDK() {
    sendEvent(withName: "FaceLiveness_Loaded", body: nil)
  }

  func openLoadingScreenValidation() {
    sendEvent(withName: "FaceLiveness_Loading", body: nil)
  }

  func closeLoadingScreenValidation() {
    sendEvent(withName: "FaceLiveness_Loaded", body: nil)
  }

  func onConnectionChanged(_ state: FaceLiveness.LivenessState) {}
}
