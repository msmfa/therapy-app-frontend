#import <React/RCTBridgeModule.h>
@interface RCT_EXTERN_MODULE(ProgressWidgetBridge, NSObject)
RCT_EXTERN_METHOD(setOwner:(NSString * _Nullable)owner)
RCT_EXTERN_METHOD(write:(NSString *)owner json:(NSString *)json resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
