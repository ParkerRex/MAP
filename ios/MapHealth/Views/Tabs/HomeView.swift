import HealthKit
import MapHealthCore
import SwiftUI

struct HomeView: View {
    let navigateToTab: (MainTabView.Tab) -> Void

    @State private var showSettings = false
    @State private var modelSettingRefreshId = UUID()

    // Data state
    @State private var todayEvents: [CalendarEvent] = []
    @State private var todayTasks: [MapTask] = []
    @State private var steps: Double?
    @State private var sleepHours: Double?
    @State private var restingHeartRate: Double?
    @State private var healthNeedsPermission = false

    @State private var isLoading = true
    @State private var eventsError: String?
    @State private var tasksError: String?

    private let healthDataFetcher = HealthDataFetcher()

    var body: some View {
        NavigationStack {
            homeContent
                .navigationTitle("Today")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        settingsButton
                    }
                }
                .refreshable {
                    await loadAllData()
                }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(modelSettingRefreshId: $modelSettingRefreshId)
        }
        .task {
            await loadAllData()
        }
    }

    @ViewBuilder
    private var homeContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                homeScrollContent
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                homeScrollContent
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var homeScrollContent: some View {
        LazyVStack(spacing: 20) {
            todayHeader
            calendarWidget
            todosWidget
            healthSummaryWidget
        }
    }

    private var todayHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(Date(), format: .dateTime.weekday(.wide))
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(Date(), format: .dateTime.month().day())
                .font(.system(size: 32, weight: .bold, design: .rounded))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Calendar Widget

    private var calendarWidget: some View {
        Button {
            navigateToTab(.calendar)
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundStyle(.blue)
                    Text("Today's Schedule")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary)
                }

                if let error = eventsError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                } else if todayEvents.isEmpty {
                    Text("No events today")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(todayEvents.prefix(3)) { event in
                            eventRow(event)
                        }
                        if todayEvents.count > 3 {
                            Text("+\(todayEvents.count - 3) more")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

    private func eventRow(_ event: CalendarEvent) -> some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(.blue)
                .frame(width: 3, height: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.summary ?? "Untitled")
                    .font(.subheadline)
                    .lineLimit(1)
                Text(event.timeString)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Todos Widget

    private var todosWidget: some View {
        Button {
            navigateToTab(.todos)
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "checklist")
                        .foregroundStyle(.orange)
                    Text("Today's Tasks")
                        .font(.headline)
                    Spacer()
                    if !todayTasks.isEmpty {
                        Text("\(incompleteTasks.count)")
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.orange.opacity(0.2))
                            .clipShape(Capsule())
                    }
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary)
                }

                if let error = tasksError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                } else if todayTasks.isEmpty {
                    Text("No tasks for today")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(incompleteTasks.prefix(3)) { task in
                            taskRow(task)
                        }
                        if incompleteTasks.count > 3 {
                            Text("+\(incompleteTasks.count - 3) more")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else if !completedTasks.isEmpty {
                            Text("\(completedTasks.count) completed")
                                .font(.caption)
                                .foregroundStyle(.green)
                        }
                    }
                }
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

    private var incompleteTasks: [MapTask] {
        todayTasks.filter { !$0.isCompleted }
    }

    private var completedTasks: [MapTask] {
        todayTasks.filter { $0.isCompleted }
    }

    private func taskRow(_ task: MapTask) -> some View {
        HStack(spacing: 8) {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isCompleted ? .green : .secondary)
                .font(.body)

            Text(task.title)
                .font(.subheadline)
                .lineLimit(1)
                .strikethrough(task.isCompleted)
                .foregroundStyle(task.isCompleted ? .secondary : .primary)
        }
    }

    // MARK: - Health Widget

    private var healthSummaryWidget: some View {
        Button {
            navigateToTab(.health)
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)
                    Text("Health")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary)
                }

                if healthNeedsPermission {
                    Text("Tap to connect HealthKit")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else if steps != nil || sleepHours != nil || restingHeartRate != nil {
                    HStack(spacing: 16) {
                        if let steps = steps {
                            healthMetric(
                                icon: "figure.walk",
                                value: formatNumber(steps),
                                label: "steps",
                                color: .green
                            )
                        }

                        if let sleep = sleepHours {
                            healthMetric(
                                icon: "bed.double.fill",
                                value: String(format: "%.1f", sleep),
                                label: "hrs sleep",
                                color: .purple
                            )
                        }

                        if let heartRate = restingHeartRate {
                            healthMetric(
                                icon: "heart.fill",
                                value: "\(Int(heartRate))",
                                label: "bpm",
                                color: .red
                            )
                        }
                    }
                } else {
                    Text("View your health metrics")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

    private func healthMetric(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.caption)
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func formatNumber(_ number: Double) -> String {
        if number >= 1000 {
            return String(format: "%.1fk", number / 1000)
        }
        return "\(Int(number))"
    }

    // MARK: - Settings

    private var settingsButton: some View {
        Button {
            showSettings = true
        } label: {
            Image(systemName: "gearshape")
                .accessibilityLabel(Text("SETTINGS_TITLE"))
        }
        .mapHealthGlassButtonStyle()
        .accessibilityIdentifier("settingsButton")
    }

    // MARK: - Data Loading

    private func loadAllData() async {
        isLoading = true

        async let eventsTask: () = loadTodayEvents()
        async let tasksTask: () = loadTodayTasks()
        async let healthTask: () = loadHealthData()

        _ = await (eventsTask, tasksTask, healthTask)

        isLoading = false
    }

    private func loadTodayEvents() async {
        eventsError = nil
        do {
            let response = try await MapAPIClient.shared.getEvents(
                timeMin: Date().startOfDay,
                timeMax: Date().endOfDay
            )
            todayEvents = response.events
        } catch {
            eventsError = "Could not load events"
        }
    }

    private func loadTodayTasks() async {
        tasksError = nil
        do {
            let allTasks = try await MapAPIClient.shared.getTasks()
            // Filter to tasks due today or with no due date
            let calendar = Calendar.current
            todayTasks = allTasks.filter { task in
                guard let dueAt = task.dueAt else { return false }
                return calendar.isDateInToday(dueAt)
            }
        } catch {
            tasksError = "Could not load tasks"
        }
    }

    private func loadHealthData() async {
        do {
            // Fetch today's data (last entry in the 14-day array)
            let stepsData = try await healthDataFetcher.fetchLastTwoWeeksStepCount()
            if let todaySteps = stepsData.last, todaySteps > 0 {
                steps = todaySteps
            }

            let sleepData = try await healthDataFetcher.fetchLastTwoWeeksSleep()
            if let todaySleep = sleepData.last, todaySleep > 0 {
                sleepHours = todaySleep
            }

            let heartRateData = try await healthDataFetcher.fetchLastTwoWeeksRestingHeartRate()
            if let todayHR = heartRateData.last, todayHR > 0 {
                restingHeartRate = todayHR
            }

            healthNeedsPermission = false
        } catch {
            // If we can't fetch, assume we need permission
            healthNeedsPermission = true
        }
    }
}
