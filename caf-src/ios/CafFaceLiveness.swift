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
    var cafStage = FaceLiveness.CAFStage.PROD
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
        .setCredentials(mobileToken: token, personId: personId)
        .build()
        faceLiveness.delegate = self

        DispatchQueue.main.async {
            guard let currentViewController = UIApplication.shared.keyWindow!.rootViewController else { return }
            faceLiveness.startSDK(viewController: currentViewController)
        }
  }


  // FaceLiveness

  func didFinishLiveness(with faceLivenessResult: FaceLiveness.FaceLivenessResult) {
    let response : NSMutableDictionary = [:]
        response["data"] = faceLivenessResult.signedResponse
        sendEvent(withName: "FaceLiveness_Success", body: response)
  }

  func didFinishWithFail(with faceLivenessFailResult: FaceLiveness.FaceLivenessFailResult) {
    let response : NSMutableDictionary = [:]
        response["message"] = faceLivenessFailResult.description
        response["type"] = String(describing: faceLivenessFailResult.failType)
        response["data"] = String(describing: faceLivenessFailResult.signedResponse)
        sendEvent(withName: "FaceLiveness_Error", body: response)
  }

  func didFinishWithCancelled(with faceLivenessResult: FaceLiveness.FaceLivenessResult) {
    sendEvent(withName: "FaceLiveness_Cancel", body: nil)
  }

  func didFinishWithError(with faceLivenessErrorResult: FaceLiveness.FaceLivenessErrorResult) {
    let response : NSMutableDictionary = [:]
        response["message"] = faceLivenessErrorResult.description
        response["type"] = String(describing: faceLivenessErrorResult.errorType)
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
}
