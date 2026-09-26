import SwiftUI
import WidgetKit

// Shared by the simulator gallery and the actual WidgetKit extension.
// This fixture is deliberately separate from the production app's accounts.
struct ProgressDay: Identifiable, Decodable {
    let id: Int
    let label: String
    let complete: Bool
    let today: Bool
}

struct ProgressSample: Decodable {
    var days: [ProgressDay]
    var streak: Int
    var hasSchedule: Bool = true

    var streakLabel = "day streak"
    var emptyTitle = "Your next step"
    var emptyMessage = "Set your check-in schedule in Plastic Brains."
    var url = "plasticbrains-widget-preview://check-in"

}

struct ProgressWidgetView: View {
    let sample: ProgressSample
    var previewFamily: WidgetFamily? = nil
    @Environment(\.widgetFamily) private var widgetFamily
    private var family: WidgetFamily { previewFamily ?? widgetFamily }
    @Environment(\.widgetRenderingMode) private var renderingMode
    @Environment(\.colorScheme) private var scheme
    private var ink: Color { scheme == .dark ? Color(red: 0.94, green: 0.95, blue: 0.96) : Color(red: 0.12, green: 0.16, blue: 0.19) }
    private let orange = Color(red: 0.886, green: 0.427, blue: 0.192)

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if sample.hasSchedule && !sample.days.isEmpty && family == .systemSmall {
                smallContent
            } else if sample.hasSchedule && !sample.days.isEmpty {
                HStack(spacing: 0) {
                    ForEach(sample.days) { day in
                        VStack(spacing: 8) {
                            Text(day.label)
                                .font(.custom("GeneralSans-Medium", size: 12))
                                .foregroundStyle(ink.opacity(day.today ? 1 : 0.65))
                            SculptedDayMark(day: day, accented: renderingMode == .accented)
                                .frame(width: 34, height: 34)
                        }
                        .frame(maxWidth: .infinity)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel("\(day.label), \(day.complete ? "completed" : day.today ? "today, check-in pending" : "scheduled")")
                    }
                }
                Rectangle().fill(ink.opacity(0.07)).frame(height: 1)
                    .shadow(color: .white.opacity(scheme == .dark ? 0.08 : 0.95), radius: 0, y: 1)
                HStack(alignment: .firstTextBaseline, spacing: 7) {
                    Text("\(sample.streak)")
                        .font(.custom("GeneralSans-Regular", size: 39))
                        .tracking(-1.8)
                    Text(sample.streakLabel)
                        .font(.custom("GeneralSans-Regular", size: 14))
                        .foregroundStyle(ink.opacity(0.75))
                    Spacer()
                    SculptedDayMark(
                        day: ProgressDay(id: -1, label: "", complete: true, today: false),
                        accented: renderingMode == .accented,
                        positive: true
                    )
                    .frame(width: 34, height: 34)
                    .accessibilityHidden(true)
                }
                .accessibilityElement(children: .combine)
            } else if sample.hasSchedule {
                Text(sample.emptyTitle)
                    .font(.custom("GeneralSans-Medium", size: 13))
                    .foregroundStyle(ink.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 8)
                Text("\(sample.streak)")
                    .font(.custom("GeneralSans-Regular", size: 39))
                Text(sample.streakLabel)
                    .font(.custom("GeneralSans-Regular", size: 12))
                    .foregroundStyle(ink.opacity(0.75))
            } else {
                Image(systemName: "calendar.badge.plus").font(.system(size: family == .systemSmall ? 20 : 24)).foregroundStyle(orange)
                Text(sample.emptyTitle)
                    .font(.custom("DMSans-Bold", size: family == .systemSmall ? 16 : 22))
                    .fixedSize(horizontal: false, vertical: true)
                Text(sample.emptyMessage)
                    .font(.custom("GeneralSans-Regular", size: family == .systemSmall ? 12 : 14))
                    .fixedSize(horizontal: false, vertical: true)
                    .foregroundStyle(ink.opacity(0.7))
            }
        }
        .foregroundStyle(ink)
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetURL(URL(string: sample.url))
    }

    private var smallContent: some View {
        VStack(alignment: .leading, spacing: 9) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 5), count: min(sample.days.count, 4)), spacing: 7) {
                ForEach(sample.days) { day in
                    VStack(spacing: 4) {
                        Text(day.label)
                            .font(.custom("GeneralSans-Medium", size: 10))
                            .foregroundStyle(ink.opacity(day.today ? 1 : 0.65))
                        SculptedDayMark(day: day, accented: renderingMode == .accented, compact: true)
                            .frame(width: sample.days.count > 4 ? 20 : 27, height: sample.days.count > 4 ? 20 : 27)
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(day.label), \(day.complete ? "completed" : day.today ? "today, check-in pending" : "scheduled")")
                }
            }
            Spacer(minLength: 0)
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: -2) {
                    Text("\(sample.streak)")
                        .font(.custom("GeneralSans-Regular", size: sample.days.count > 4 ? 32 : 43))
                        .tracking(-1.5)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                    Text(sample.streakLabel)
                        .font(.custom("GeneralSans-Regular", size: 12))
                        .foregroundStyle(ink.opacity(0.75))
                }
                Spacer(minLength: 4)
                SculptedDayMark(day: ProgressDay(id: -1, label: "", complete: true, today: false), accented: renderingMode == .accented, positive: true)
                    .frame(width: 29, height: 29)
                    .accessibilityHidden(true)
            }
            .accessibilityElement(children: .combine)
        }
    }

}

struct WidgetBackground: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        LinearGradient(colors: scheme == .dark
            ? [Color(red: 0.13, green: 0.17, blue: 0.20), Color(red: 0.08, green: 0.10, blue: 0.12)]
            : [Color(red: 0.94, green: 0.95, blue: 0.96), Color(red: 0.87, green: 0.89, blue: 0.91)],
            startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

// Soft raised completed discs and inset pending wells, inspired by the reference.
// In Clear mode the system owns the material, so use translucent marks instead.
private struct SculptedDayMark: View {
    let day: ProgressDay
    let accented: Bool
    var positive: Bool = false
    var compact: Bool = false
    @Environment(\.colorScheme) private var scheme
    private var dark: Bool { scheme == .dark }
    private var completionColor: Color { dark ? Color(red: 0.57, green: 0.82, blue: 0.65) : Color(red: 0.30, green: 0.46, blue: 0.65) }
    private let orange = Color(red: 0.89, green: 0.40, blue: 0.06)
    private var surface: Color { dark ? Color(red: 0.16, green: 0.20, blue: 0.23) : Color(red: 0.90, green: 0.92, blue: 0.93) }
    var body: some View {
        ZStack {
            if accented {
                Circle().fill(.white.opacity(day.complete ? 0.18 : 0.04))
                Circle().strokeBorder(.white.opacity(day.today ? 0.8 : 0.25), lineWidth: 1)
            } else if day.complete {
                Circle().fill(LinearGradient(colors: positive
                    ? [Color(red: 0.48, green: 0.73, blue: 0.55), Color(red: 0.22, green: 0.49, blue: 0.32)]
                    : [dark ? surface : .white, surface], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .shadow(color: .white.opacity(dark ? 0.08 : 0.95), radius: 3, x: -3, y: -3)
                    .shadow(color: Color(red: 0.35, green: 0.43, blue: 0.51).opacity(dark ? 0.15 : 0.32), radius: 3, x: 3, y: 3)
                Circle().strokeBorder(.white.opacity(dark ? 0.12 : 0.7), lineWidth: 0.7)
            } else {
                Circle().fill(surface.shadow(.inner(color: .black.opacity(dark ? 0.35 : 0.17), radius: 3, x: 2, y: 2)).shadow(.inner(color: .white.opacity(dark ? 0.08 : 0.9), radius: 2, x: -2, y: -2)))
                Circle().strokeBorder(.white.opacity(dark ? 0.1 : 0.6), lineWidth: 0.7)
            }
            if day.complete {
                Image(systemName: "checkmark")
                    .font(.system(size: compact ? 10 : 14, weight: .semibold))
                    .foregroundStyle(accented ? .white : (positive ? .white : completionColor))
            } else if day.today {
                Circle().fill(accented ? .white : orange).frame(width: 7, height: 7)
                    .shadow(color: orange.opacity(accented ? 0 : 0.25), radius: 3, y: 1)
            }
        }
    }
}
