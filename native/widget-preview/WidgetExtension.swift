import SwiftUI
import WidgetKit

struct ProgressEntry: TimelineEntry {
    let date: Date
    let sample: ProgressSample
}
struct ProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry(date: Date(), sample: .make())
    }
    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(entry())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        let midnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        completion(Timeline(entries: [entry()], policy: .after(midnight)))
    }
    private func entry() -> ProgressEntry {
        let defaults = UserDefaults(suiteName: "group.com.plastic-brains.widgetpreview")!
        return ProgressEntry(date: Date(), sample: .make(mode: defaults.integer(forKey: "mode"), completed: defaults.bool(forKey: "completed")))
    }
}
@main
struct CheckInWidget: Widget {
    let kind = "PlasticBrainsProgressPreview"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProgressProvider()) { entry in
            ProgressWidgetView(sample: entry.sample)
                .containerBackground(for: .widget) { WidgetBackground() }
        }
        .configurationDisplayName("Check-in streak")
        .description("Design preview with sample scheduled days and progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
