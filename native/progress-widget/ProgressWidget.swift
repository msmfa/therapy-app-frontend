import SwiftUI
import WidgetKit

struct StoredEntry: Decodable {
    let date: Double
    let progress: ProgressSample
}
struct StoredTimeline: Decodable {
    let version: Int
    let entries: [StoredEntry]
}
struct ProgressEntry: TimelineEntry {
    let date: Date
    let progress: ProgressSample
}
struct ProgressProvider: TimelineProvider {
    private func empty() -> ProgressSample {
        ProgressSample(days: [], streak: 0, hasSchedule: false,
                       emptyMessage: "Open Plastic Brains to see your check-ins.", url: "therapyapp:///(tabs)/notes")
    }
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry(date: Date(), progress: empty())
    }
    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(entries().first ?? placeholder(in: context))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        let result = entries()
        completion(Timeline(entries: result.isEmpty ? [placeholder(in: context)] : result,
                            policy: .after(Date().addingTimeInterval(6 * 3600))))
    }
    private func entries() -> [ProgressEntry] {
        guard let data = UserDefaults(suiteName: "group.com.plastic-brains.app.progress")?.data(forKey: "progressTimeline"),
              let timeline = try? JSONDecoder().decode(StoredTimeline.self, from: data), timeline.version == 1 else { return [] }
        let now = Date().timeIntervalSince1970
        let sorted = timeline.entries.sorted { $0.date < $1.date }
        guard let current = sorted.last(where: { $0.date <= now }),
              let last = sorted.last, now < last.date + 86400 else { return [] }
        let future = sorted.filter { $0.date > now }
        var entries = [ProgressEntry(date: Date(), progress: current.progress)]
        entries += future.map { ProgressEntry(date: Date(timeIntervalSince1970: $0.date), progress: $0.progress) }
        // An exhausted offline snapshot must not show stale dates indefinitely.
        entries.append(ProgressEntry(date: Date(timeIntervalSince1970: last.date + 86400), progress: empty()))
        return entries
    }
}
@main
struct CheckInWidget: Widget {
    let kind = "PlasticBrainsProgress"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProgressProvider()) { entry in
            ProgressWidgetView(sample: entry.progress)
                .containerBackground(for: .widget) { WidgetBackground() }
        }
        .configurationDisplayName("Check-in streak")
        .description("Your scheduled check-ins and day streak.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
