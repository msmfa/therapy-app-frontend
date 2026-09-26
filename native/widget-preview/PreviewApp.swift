import SwiftUI
import WidgetKit

@main
struct WidgetPreviewApp: App {
    var body: some Scene { WindowGroup { PreviewScreen().task {
        if ProcessInfo.processInfo.arguments.contains("--export-widget-images") { exportWidgetImages() }
    } } }
}
struct PreviewScreen: View {
    @AppStorage("mode", store: UserDefaults(suiteName: "group.com.plastic-brains.widgetpreview")) private var mode = 0
    @AppStorage("completed", store: UserDefaults(suiteName: "group.com.plastic-brains.widgetpreview")) private var completed = false
    @State private var dark = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 26) {
                HStack {
                    Image(systemName: "brain").font(.system(size: 23))
                    Text("PLASTIC BRAINS").font(.custom("GeneralSans-Semibold", size: 12)).tracking(2)
                }.padding(.top, 30)
                VStack(alignment: .leading, spacing: 9) {
                    Text("A little progress.\nEvery check-in.")
                        .font(.custom("DMSans-Bold", size: 35))
                    Text("Your scheduled days. Your own pace.")
                        .font(.custom("GeneralSans-Regular", size: 16)).foregroundStyle(.secondary)
                }
                VStack(spacing: 10) {
                    ProgressWidgetView(sample: .make(mode: mode, completed: completed), previewFamily: .systemMedium)
                        .padding(16)
                        .frame(height: 170)
                        .background { WidgetBackground() }
                        .clipShape(RoundedRectangle(cornerRadius: 25))
                        .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
                    Text("HOME SCREEN WIDGET · SAMPLE PROGRESS")
                        .font(.system(size: 9, weight: .medium)).tracking(1.2).foregroundStyle(.secondary)
                }.padding(.vertical, 8)
                VStack(alignment: .leading, spacing: 16) {
                    Text("Try the design").font(.custom("GeneralSans-Semibold", size: 17))
                    Picker("Scheduled days", selection: $mode) {
                        Text("3 days").tag(0)
                        Text("5 days").tag(1)
                        Text("7 days").tag(2)
                        Text("No plan").tag(3)
                    }.pickerStyle(.segmented)
                    Toggle("Today’s check-in complete", isOn: $completed)
                    Toggle("Dark appearance", isOn: $dark)
                }.font(.custom("GeneralSans-Regular", size: 15))
                VStack(alignment: .leading, spacing: 8) {
                    Text("Add it to your Home Screen")
                        .font(.custom("GeneralSans-Semibold", size: 15))
                    Text("Touch and hold the Home Screen, tap Edit → Add Widget, then search for “Streak Preview”.")
                        .font(.custom("GeneralSans-Regular", size: 14)).foregroundStyle(.secondary)
                }
                Text("Design preview only. These example ticks and streak are not connected to your account yet.")
                    .font(.custom("GeneralSans-Regular", size: 12)).foregroundStyle(.secondary)
            }.padding(.horizontal, 25).padding(.bottom, 30)
        }
        .background(dark ? Color(red: 0.08, green: 0.10, blue: 0.12) : Color(red: 0.94, green: 0.96, blue: 0.97))
        .tint(Color(red: 0.8, green: 0.27, blue: 0.05))
        .preferredColorScheme(dark ? .dark : .light)
        .onChange(of: mode) { _, _ in WidgetCenter.shared.reloadAllTimelines() }
        .onChange(of: completed) { _, _ in WidgetCenter.shared.reloadAllTimelines() }
    }
}

// Capture the shared native widget view for the in-app setup guide.
@MainActor
private func exportWidgetImages() {
    let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let translations = [
        "en": (["Mon", "Wed", "Sat"], "day streak"),
        "de": (["Mo", "Mi", "Sa"], "Tage in Folge"),
        "fr": (["lun.", "mer.", "sam."], "jours de suite"),
        "es": (["lun", "mié", "sáb"], "días seguidos")
    ]
    for (language, copy) in translations {
        for dark in [false, true] {
            for small in [false, true] {
                var sample = ProgressSample(days: copy.0.enumerated().map { index, label in
                    ProgressDay(id: index, label: label, complete: index < 2, today: index == 2)
                }, streak: 12)
                sample.streakLabel = copy.1
                let view = ProgressWidgetView(sample: sample, previewFamily: small ? .systemSmall : .systemMedium)
                    .padding(16)
                    .frame(width: small ? 170 : 364, height: 170)
                    .background { WidgetBackground() }
                    .clipShape(RoundedRectangle(cornerRadius: 25))
                    .environment(\.colorScheme, dark ? .dark : .light)
                let renderer = ImageRenderer(content: view)
                renderer.scale = 3
                if let png = renderer.uiImage?.pngData() {
                    try? png.write(to: folder.appendingPathComponent("widget-\(language)-\(small ? "small" : "medium")-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }
}
