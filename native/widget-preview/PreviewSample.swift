import Foundation

extension ProgressSample {
    static func make(mode: Int = 0, completed: Bool = false) -> ProgressSample {
        let weekday = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
        let labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        let scheduled = mode == 1 ? [0, 1, 2, 4, 5] : mode == 2 ? Array(0...6) : [0, 2, 5]
        return ProgressSample(days: scheduled.map { day in
            ProgressDay(id: day, label: labels[day], complete: day < weekday || (day == weekday && completed), today: day == weekday)
        }, streak: mode == 3 ? 0 : (completed ? 13 : 12), hasSchedule: mode != 3)
    }
}
