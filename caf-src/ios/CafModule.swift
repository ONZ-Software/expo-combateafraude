//
//  CafModule.swift
//  iproov
//
//  Created by Cristian Henz Krein on 23/10/23.
//

import UIKit
import Foundation
import FaceLiveness
import FaceAuthenticator
import React

@objc(CafModule)
class CafModule: RCTEventEmitter {
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc(startFaceLiveness:personId:)
  func startFaceLiveness(mobileToken: String, personId: String) {
    let faceLivenessController = FaceLivenessController()
    faceLivenessController.cafModule = self
    faceLivenessController.startSDK(mobileToken, personId: personId)
  }

  @objc(FaceLivenessController)
  class FaceLivenessController: UIViewController, RCTBridgeModule, FaceLivenessDelegate {
    var faceLiveness: FaceLivenessSDK!
    weak var cafModule: CafModule?

    @objc func startSDK(_ mobileToken: String, personId: String) {
      faceLiveness = FaceLivenessSDK.Build()
        .setCredentials(mobileToken: mobileToken, personId: personId)
        .setFilter(filter: .natural)
        .build()

      faceLiveness?.delegate = self
      faceLiveness?.startSDK(viewController: self)
    }

    func didFinishLiveness(with faceLivenessResult: FaceLivenessResult) {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessSuccess", eventBody: faceLivenessResult.signedResponse)
      }
    }

    func didFinishWithFail(with faceLivenessFailResult: FaceLivenessFailResult) {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessFail", eventBody: faceLivenessFailResult.description)
      }
    }

    func didFinishWithError(with faceLivenessErrorResult: FaceLivenessErrorResult) {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessCancel", eventBody: faceLivenessErrorResult.description)
      }
    }

    func didFinishWithCancelled(with faceLivenessResult: FaceLivenessResult) {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessCancel", eventBody: faceLivenessResult.signedResponse)
      }
    }

    func openLoadingScreenStartSDK() {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessLoading", eventBody: true)
      }
    }

    func closeLoadingScreenStartSDK() {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessLoading", eventBody: false)
      }
    }

    func openLoadingScreenValidation() {
      if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessLoaded", eventBody: true)
      }
    }

    func closeLoadingScreenValidation() {
       if let cafModule = self.cafModule {
        cafModule.emitEvent(eventName: "onFaceLivenessLoaded", eventBody: false)
      }
    }

    static func moduleName() -> String! {
      return "FaceLivenessController"
    }
  }

  @objc func emitEvent(eventName: String, eventBody: Any?) {
    sendEvent(withName: eventName, body: eventBody)
  }

  override func supportedEvents() -> [String]! {
    return [
      "onFaceLivenessSuccess",
      "onFaceLivenessFail",
      "onFaceLivenessError",
      "onFaceLivenessCancel",
      "onFaceLivenessLoading",
      "onFaceLivenessLoaded",
    ]
  }
}

