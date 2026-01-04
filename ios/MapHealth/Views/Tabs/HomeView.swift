// swiftlint:disable file_length
import CoreLocation
import HealthKit
import MapHealthCore
import SwiftUI

// swiftlint:disable:next type_body_length
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

    // Weather state
    @State private var weather: WeatherData?
    @StateObject private var locationManager = LocationManager()

    // Loading states - only true on initial load, not refresh
    @State private var isInitialLoad = true
    @State private var eventsError: String?
    @State private var tasksError: String?

    private let healthDataFetcher = HealthDataFetcher()

    var body: some View {
        NavigationStack {
            homeContent
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        settingsButton
                    }
                }
                .refreshable {
                    await refreshData()
                }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(modelSettingRefreshId: $modelSettingRefreshId)
        }
        .task(id: modelSettingRefreshId) {
            await loadAllData()
        }
        .task(id: locationManager.location) {
            guard let location = locationManager.location else { return }
            await loadWeather(location: location)
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
        VStack(spacing: 16) {
            headerSection
            scheduleWidget
            tasksWidget
            healthWidget
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(greetingText)
                    .font(.system(size: 28, weight: .bold, design: .rounded))

                Spacer()

                if let weather = weather {
                    weatherBadge(weather)
                }
            }

            Text(Date(), format: .dateTime.weekday(.wide).month(.wide).day())
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.bottom, 8)
    }

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<22: return "Good evening"
        default: return "Good night"
        }
    }

    private func weatherBadge(_ weather: WeatherData) -> some View {
        HStack(spacing: 6) {
            Image(systemName: weather.icon)
                .symbolRenderingMode(.multicolor)
            Text("\(weather.temperature)°")
                .fontWeight(.medium)
        }
        .font(.subheadline)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial, in: Capsule())
    }

    // MARK: - Schedule Widget

    private var scheduleWidget: some View {
        HomeWidgetButton(action: { navigateToTab(.calendar) }, content: {
            VStack(alignment: .leading, spacing: 12) {
                widgetHeader(
                    icon: "calendar",
                    iconColor: .blue,
                    title: "Schedule",
                    badge: todayEvents.isEmpty ? nil : "\(todayEvents.count)"
                )

                if isInitialLoad {
                    scheduleLoadingSkeleton
                } else if let error = eventsError {
                    widgetError(error, icon: "calendar.badge.exclamationmark")
                } else if todayEvents.isEmpty {
                    emptyScheduleState
                } else {
                    scheduleContent
                }
            }
        })
    }

    private var scheduleLoadingSkeleton: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(0..<2, id: \.self) { _ in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.secondary.opacity(0.2))
                        .frame(width: 3, height: 36)

                    VStack(alignment: .leading, spacing: 4) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.secondary.opacity(0.15))
                            .frame(width: .random(in: 120...180), height: 14)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.secondary.opacity(0.1))
                            .frame(width: 70, height: 12)
                    }
                }
            }
        }
        .shimmer()
    }

    private var emptyScheduleState: some View {
        HStack(spacing: 12) {
            Image(systemName: "sun.max")
                .font(.title2)
                .foregroundStyle(.blue.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("Your day is clear")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("Tap to add an event")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
    }

    private var scheduleContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(todayEvents.prefix(3)) { event in
                eventRow(event)
            }
            if todayEvents.count > 3 {
                Text("+\(todayEvents.count - 3) more")
                    .font(.caption)
                    .foregroundStyle(.blue)
                    .padding(.top, 2)
            }
        }
    }

    private func eventRow(_ event: CalendarEvent) -> some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 2)
                .fill(.blue)
                .frame(width: 3, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.summary ?? "Untitled")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                Text(event.timeString)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
    }

    // MARK: - Tasks Widget

    private var tasksWidget: some View {
        HomeWidgetButton(action: { navigateToTab(.todos) }, content: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    widgetHeader(
                        icon: "checkmark.circle",
                        iconColor: .orange,
                        title: "Tasks",
                        badge: nil
                    )

                    Spacer()

                    if !todayTasks.isEmpty {
                        taskProgressRing
                    }
                }

                if isInitialLoad {
                    tasksLoadingSkeleton
                } else if let error = tasksError {
                    widgetError(error, icon: "exclamationmark.triangle")
                } else if todayTasks.isEmpty {
                    emptyTasksState
                } else {
                    tasksContent
                }
            }
        })
    }

    private var taskProgressRing: some View {
        let total = todayTasks.count
        let completed = completedTasks.count
        let progress = total > 0 ? Double(completed) / Double(total) : 0

        return ZStack {
            Circle()
                .stroke(Color.orange.opacity(0.2), lineWidth: 3)
                .frame(width: 32, height: 32)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.orange, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .frame(width: 32, height: 32)
                .rotationEffect(.degrees(-90))

            Text("\(completed)/\(total)")
                .font(.system(size: 8, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
        }
    }

    private var tasksLoadingSkeleton: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(0..<3, id: \.self) { _ in
                HStack(spacing: 10) {
                    Circle()
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: 22, height: 22)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: .random(in: 100...200), height: 14)

                    Spacer()
                }
            }
        }
        .shimmer()
    }

    private var emptyTasksState: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.seal")
                .font(.title2)
                .foregroundStyle(.orange.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("All caught up!")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("Tap to add a task")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
    }

    private var tasksContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(incompleteTasks.prefix(3)) { task in
                taskRow(task)
            }

            if incompleteTasks.count > 3 {
                Text("+\(incompleteTasks.count - 3) more to do")
                    .font(.caption)
                    .foregroundStyle(.orange)
                    .padding(.top, 2)
            } else if !completedTasks.isEmpty && incompleteTasks.count < 3 {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark")
                        .font(.caption2)
                    Text("\(completedTasks.count) completed today")
                        .font(.caption)
                }
                .foregroundStyle(.green)
                .padding(.top, 2)
            }
        }
    }

    private var incompleteTasks: [MapTask] {
        todayTasks.filter { !$0.isCompleted }
    }

    private var completedTasks: [MapTask] {
        todayTasks.filter { $0.isCompleted }
    }

    private func taskRow(_ task: MapTask) -> some View {
        HStack(spacing: 10) {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isCompleted ? .green : Color.secondary.opacity(0.4))
                .font(.title3)

            Text(task.title)
                .font(.subheadline)
                .lineLimit(1)
                .strikethrough(task.isCompleted)
                .foregroundStyle(task.isCompleted ? .secondary : .primary)

            Spacer()

            if let dueAt = task.dueAt {
                Text(dueAt, format: .dateTime.hour().minute())
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Health Widget

    private var healthWidget: some View {
        HomeWidgetButton(action: { navigateToTab(.health) }, content: {
            VStack(alignment: .leading, spacing: 12) {
                widgetHeader(
                    icon: "heart.fill",
                    iconColor: .red,
                    title: "Health",
                    badge: nil
                )

                if isInitialLoad {
                    healthLoadingSkeleton
                } else if healthNeedsPermission {
                    healthPermissionState
                } else if steps != nil || sleepHours != nil || restingHeartRate != nil {
                    healthMetricsContent
                } else {
                    emptyHealthState
                }
            }
        })
    }

    private var healthLoadingSkeleton: some View {
        HStack(spacing: 0) {
            ForEach(0..<3, id: \.self) { _ in
                VStack(spacing: 6) {
                    Circle()
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: 24, height: 24)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: 40, height: 16)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.secondary.opacity(0.1))
                        .frame(width: 50, height: 10)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .shimmer()
    }

    private var healthPermissionState: some View {
        HStack(spacing: 12) {
            Image(systemName: "heart.text.square")
                .font(.title2)
                .foregroundStyle(.red.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("Connect HealthKit")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("Tap to sync your health data")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
    }

    private var emptyHealthState: some View {
        HStack(spacing: 12) {
            Image(systemName: "figure.walk.motion")
                .font(.title2)
                .foregroundStyle(.red.opacity(0.6))

            VStack(alignment: .leading, spacing: 2) {
                Text("No data yet")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("Tap to view health metrics")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
    }

    private var healthMetricsContent: some View {
        HStack(spacing: 0) {
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
                    color: .indigo
                )
            }

            if let heartRate = restingHeartRate {
                healthMetric(
                    icon: "heart.fill",
                    value: "\(Int(heartRate))",
                    label: "resting bpm",
                    color: .red
                )
            }
        }
    }

    private func healthMetric(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.callout)
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
                .fontDesign(.rounded)
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

    // MARK: - Shared Widget Components

    private func widgetHeader(icon: String, iconColor: Color, title: String, badge: String?) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(iconColor)
                .font(.body)

            Text(title)
                .font(.headline)

            if let badge = badge {
                Text(badge)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(iconColor.opacity(0.15))
                    .foregroundStyle(iconColor)
                    .clipShape(Capsule())
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.tertiary)
        }
    }

    private func widgetError(_ message: String, icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
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

    @MainActor
    private func loadAllData() async {
        async let eventsTask: () = loadTodayEvents()
        async let tasksTask: () = loadTodayTasks()
        async let healthTask: () = loadHealthData()

        _ = await (eventsTask, tasksTask, healthTask)

        if isInitialLoad {
            withAnimation(.easeOut(duration: 0.3)) {
                isInitialLoad = false
            }
        }
    }

    private func refreshData() async {
        // Use withCheckedContinuation to prevent SwiftUI from cancelling our requests
        await withCheckedContinuation { continuation in
            Task.detached {
                await self.performRefresh()
                continuation.resume()
            }
        }
    }

    @MainActor
    private func performRefresh() async {
        eventsError = nil
        tasksError = nil

        async let eventsTask: () = loadTodayEvents()
        async let tasksTask: () = loadTodayTasks()
        async let healthTask: () = loadHealthData()

        _ = await (eventsTask, tasksTask, healthTask)

        HapticFeedback.success()
    }

    @MainActor
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

    @MainActor
    private func loadTodayTasks() async {
        tasksError = nil
        do {
            let allTasks = try await MapAPIClient.shared.getTasks()
            let calendar = Calendar.current
            todayTasks = allTasks.filter { task in
                guard let dueAt = task.dueAt else { return false }
                return calendar.isDateInToday(dueAt)
            }
        } catch {
            tasksError = "Could not load tasks"
        }
    }

    @MainActor
    private func loadHealthData() async {
        do {
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
            healthNeedsPermission = true
        }
    }

    @MainActor
    private func loadWeather(location: CLLocation) async {
        do {
            weather = try await WeatherService.shared.getCurrentWeather(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
        } catch {
            // Silently fail - weather is optional
        }
    }
}

// MARK: - Home Widget Button

private struct HomeWidgetButton<Content: View>: View {
    let action: () -> Void
    @ViewBuilder let content: () -> Content

    var body: some View {
        Button(action: action) {
            content()
                .mapHealthGlassCard()
        }
        .buttonStyle(WidgetButtonStyle())
    }
}

private struct WidgetButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Location Manager

private class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var location: CLLocation?

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.first {
            self.location = location
            manager.stopUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Silently fail
    }
}
