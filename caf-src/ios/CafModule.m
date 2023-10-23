//
//  CafModule.m
//  iproov
//
//  Created by Cristian Henz Krein on 23/10/23.
//
#import <Foundation/Foundation.h>

#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(CafModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startFaceLiveness: (NSString *)mobileToken personId:(NSString *)personId)

@end
