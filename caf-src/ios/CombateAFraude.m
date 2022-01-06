#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(CombateAFraude, RCTEventEmitter)

RCT_EXTERN_METHOD(passiveFaceLiveness:(NSString *)mobileToken)
RCT_EXTERN_METHOD(documentDetector:(NSString *)mobileToken documentType:(NSString *)documentType)
RCT_EXTERN_METHOD(faceAuthenticator:(NSString *)mobileToken CPF:(NSString *)CPF)

@end
