import UIKit
import Foundation
import DocumentDetector
import PassiveFaceLiveness
import FaceAuthenticator

@objc(CombateAFraude)
class CombateAFraude: RCTEventEmitter, PassiveFaceLivenessControllerDelegate, DocumentDetectorControllerDelegate, FaceAuthenticatorControllerDelegate {

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // PassiveFaceLiveness

  @objc(passiveFaceLiveness:)
  func passiveFaceLiveness(mobileToken: String) {
    let passiveFaceLiveness = PassiveFaceLiveness.Builder(mobileToken: mobileToken)
      .build()

    DispatchQueue.main.async {
      let currentViewController = UIApplication.shared.keyWindow!.rootViewController

      let sdkViewController = PassiveFaceLivenessController(passiveFaceLiveness: passiveFaceLiveness)
      sdkViewController.passiveFaceLivenessDelegate = self

      currentViewController?.present(sdkViewController, animated: true, completion: nil)
    }
  }

  func passiveFaceLivenessController(_ passiveFacelivenessController: PassiveFaceLivenessController, didFinishWithResults results: PassiveFaceLivenessResult) {
    let response : NSMutableDictionary! = [:]

    let imagePath = saveImageToDocumentsDirectory(image: results.image, withName: "selfie.jpg")
    response["imagePath"] = imagePath
    response["imageUrl"] = results.imageUrl
    response["signedResponse"] = results.signedResponse
    response["trackingId"] = results.trackingId

    sendEvent(withName: "PassiveFaceLiveness_Success", body: response)
  }

  func passiveFaceLivenessControllerDidCancel(_ passiveFacelivenessController: PassiveFaceLivenessController) {
    sendEvent(withName: "PassiveFaceLiveness_Cancel", body: nil)
  }

  func passiveFaceLivenessController(_ passiveFacelivenessController: PassiveFaceLivenessController, didFailWithError error: PassiveFaceLivenessFailure) {
    let response : NSMutableDictionary! = [:]

    response["message"] = error.message
    response["type"] = String(describing: type(of: error))

    sendEvent(withName: "PassiveFaceLiveness_Error", body: response)
  }

  // DocumentDetector

  @objc(documentDetector:documentType:)
  func documentDetector(mobileToken: String, documentType: String) {
    let documentDetectorBuilder = DocumentDetector.Builder(mobileToken: mobileToken)

    if (documentType == "RG"){
      documentDetectorBuilder.setDocumentDetectorFlow(flow :[
        DocumentDetectorStep(document: Document.RG_FRONT, stepLabel: nil, illustration: nil, audio: nil),
        DocumentDetectorStep(document: Document.RG_BACK, stepLabel: nil, illustration: nil, audio: nil)
      ])
    } else if (documentType == "CNH"){
      documentDetectorBuilder.setDocumentDetectorFlow(flow :[
        DocumentDetectorStep(document: Document.CNH_FRONT, stepLabel: nil, illustration: nil, audio: nil),
        DocumentDetectorStep(document: Document.CNH_BACK, stepLabel: nil, illustration: nil, audio: nil)
      ])
    } else if (documentType == "RNE"){
      documentDetectorBuilder.setDocumentDetectorFlow(flow :[
        DocumentDetectorStep(document: Document.RNE_FRONT, stepLabel: nil, illustration: nil, audio: nil),
        DocumentDetectorStep(document: Document.RNE_BACK, stepLabel: nil, illustration: nil, audio: nil)
      ])
    } else if (documentType == "CRLV"){
      documentDetectorBuilder.setDocumentDetectorFlow(flow :[
        DocumentDetectorStep(document: Document.CRLV, stepLabel: nil, illustration: nil, audio: nil)
      ])
    }

    DispatchQueue.main.async {
      let currentViewController = UIApplication.shared.keyWindow!.rootViewController

      let sdkViewController = DocumentDetectorController(documentDetector: documentDetectorBuilder.build())
      sdkViewController.documentDetectorDelegate = self

      currentViewController?.present(sdkViewController, animated: true, completion: nil)
    }
  }

  func documentDetectionController(_ scanner: DocumentDetectorController, didFinishWithResults results: DocumentDetectorResult) {
    let response : NSMutableDictionary! = [:]

    var captureMap : [NSMutableDictionary?]  = []
    for index in (0 ... results.captures.count - 1) {
      let capture : NSMutableDictionary! = [:]
      let imagePath = saveImageToDocumentsDirectory(image: results.captures[index].image, withName: "document\(index).jpg")
      capture["imagePath"] = imagePath
      capture["imageUrl"] = results.captures[index].imageUrl
      capture["quality"] = results.captures[index].quality
      capture["label"] = results.captures[index].scannedLabel
      captureMap.append(capture)
    }

    response["type"] = results.type
    response["captures"] = captureMap
    response["trackingId"] = results.trackingId

    sendEvent(withName: "DocumentDetector_Success", body: response)
  }

  func documentDetectionControllerDidCancel(_ scanner: DocumentDetectorController) {
    sendEvent(withName: "DocumentDetector_Cancel", body: nil)
  }

  func documentDetectionController(_ scanner: DocumentDetectorController, didFailWithError error: DocumentDetectorFailure) {
    let response : NSMutableDictionary! = [:]

    response["message"] = error.message
    response["type"] = String(describing: type(of: error))

    sendEvent(withName: "DocumentDetector_Error", body: response)
  }

  // Auxiliar functions

  func saveImageToDocumentsDirectory(image: UIImage, withName: String) -> String? {
    if let data = image.jpegData(compressionQuality: 0.8) {
      let dirPath = getDocumentsDirectory()
      let filename = dirPath.appendingPathComponent(withName)
      do {
        try data.write(to: filename)
        print("Successfully saved image at path: \(filename)")
        return filename.path
      } catch {
        print("Error saving image: \(error)")
      }
    }
    return nil
  }

  func getDocumentsDirectory() -> URL {
    let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    return paths[0]
  }

  // FaceAuthenticator

  @objc(faceAuthenticator:CPF:)
  func faceAuthenticator(mobileToken: String, CPF: String) {
    let faceAuthenticator = FaceAuthenticator.Builder(mobileToken: mobileToken)
      // .setPeopleId(CPF)
      .build()

    DispatchQueue.main.async {
      let currentViewController = UIApplication.shared.keyWindow!.rootViewController

      let sdkViewController = FaceAuthenticatorController(faceAuthenticator: faceAuthenticator)
      sdkViewController.faceAuthenticatorDelegate = self

      currentViewController?.present(sdkViewController, animated: true, completion: nil)
    }
  }

  func faceAuthenticatorController(_ faceAuthenticatorController: FaceAuthenticatorController, didFinishWithResults results: FaceAuthenticatorResult) {

    let response : NSMutableDictionary! = [:]

    response["authenticated"] = results.authenticated
    response["signedResponse"] = results.signedResponse
    response["trackingId"] = results.trackingId

    sendEvent(withName: "FaceAuthenticator_Success", body: response)

  }

  func faceAuthenticatorControllerDidCancel(_ faceAuthenticatorController: FaceAuthenticatorController) {
    let response : NSMutableDictionary! = [:]

    sendEvent(withName: "FaceAuthenticator_Cancel", body: nil)
  }

  func faceAuthenticatorController(_ faceAuthenticatorController: FaceAuthenticatorController, didFailWithError error: FaceAuthenticatorFailure) {
    let response : NSMutableDictionary! = [:]

    response["message"] = error.message
    response["type"] = String(describing: type(of: error))
    sendEvent(withName: "FaceAuthenticator_Error", body: response)

  }

  override func supportedEvents() -> [String]! {
    return ["PassiveFaceLiveness_Success", "PassiveFaceLiveness_Cancel", "PassiveFaceLiveness_Error", "DocumentDetector_Success", "DocumentDetector_Cancel", "DocumentDetector_Error", "FaceAuthenticator_Success", "FaceAuthenticator_Cancel", "FaceAuthenticator_Error"]
  }


}
