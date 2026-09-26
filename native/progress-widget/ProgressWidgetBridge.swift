import Foundation
import WidgetKit
import React

@objc(ProgressWidgetBridge)
class ProgressWidgetBridge: NSObject {
    private let group = "group.com.plastic-brains.app.progress"
    private let key = "progressTimeline"
    private var owner: String?
    @objc static func requiresMainQueueSetup() -> Bool { true }
    @objc var methodQueue: DispatchQueue { DispatchQueue.main }

    @objc func setOwner(_ next: String?) {
        let previous = UserDefaults.standard.string(forKey: "progressWidgetOwner")
        owner = next
        if previous != next || next == nil {
            UserDefaults(suiteName: group)?.removeObject(forKey: key)
            UserDefaults.standard.set(next, forKey: "progressWidgetOwner")
            WidgetCenter.shared.reloadTimelines(ofKind: "PlasticBrainsProgress")
        }
    }

    @objc func write(_ account: String, json: String,
                     resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        guard account == owner else { resolve(nil); return }
        guard let data = json.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              object["version"] as? Int == 1,
              let defaults = UserDefaults(suiteName: group) else {
            reject("WIDGET_DATA", "Invalid widget summary", nil); return
        }
        defaults.set(data, forKey: key)
        WidgetCenter.shared.reloadTimelines(ofKind: "PlasticBrainsProgress")
        resolve(nil)
    }
}
