import HealthKit
import MapHealthCore
import SwiftUI

// swiftlint:disable:next type_body_length
struct HealthView: View {
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager
    @Environment(\.openURL) private var openURL

    // HealthKit State
    @State private var steps: Double?
    @State private var activeCalories: Double?
    @State private var exerciseMinutes: Double?
    @State private var standMinutes: Double?
    @State private var restingHR: Double?
    @State private var hrv: Double?
    @State private var sleepHours: Double?
    @State private var sleepStages: SleepStages?
    @State private var isLoading = true
    @State private var needsPermission = false
    @State private var permissionDenied = false
    @State private var errorMessage: String?
    @State private var lastUpdated: Date?
    @State private var stepsTrend: MetricTrend?
    @State private var caloriesTrend: MetricTrend?
    @State private var exerciseTrend: MetricTrend?
    @State private var standTrend: MetricTrend?
    @State private var restingHrTrend: MetricTrend?
    @State private var hrvTrend: MetricTrend?
    @State private var sleepTrend: MetricTrend?
    @State private var sleepAverage7d: Double?

    // WHOOP State
    @State private var whoopConnected = false
    @State private var whoopRecovery: WhoopRecovery?
    @State private var whoopCycle: WhoopCycle?
    @State private var whoopSleep: WhoopSleep?
    @State private var whoopWorkouts: [WhoopWorkout] = []
    @State private var isLoadingWhoop = false

    private let healthStore = HKHealthStore()
    private let healthDataFetcher = HealthDataFetcher()
    private let apiClient = MapAPIClient.shared

    var body: some View {
        NavigationStack {
            healthContent
                .navigationTitle("Health")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        if !needsPermission {
                            refreshButton
                        }
                    }
                }
        }
        .task {
            await checkPermissionAndLoad()
        }
    }

    @ViewBuilder
    private var healthContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                healthBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
            .refreshable {
                await loadAllData()
            }
        } else {
            ScrollView {
                healthBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
            .refreshable {
                await loadAllData()
            }
        }
    }

    private var healthBody: some View {
        LazyVStack(spacing: 20) {
            if needsPermission {
                permissionView
            } else if let error = errorMessage {
                errorView(error)
            } else {
                headerSection
                dataSourcesSection
                highlightsSection

                // WHOOP Recovery & Strain (if connected)
                if whoopConnected {
                    WhoopRecoverySection(
                        recovery: whoopRecovery,
                        cycle: whoopCycle,
                        isLoading: isLoadingWhoop
                    )
                }

                todaySection
                sleepSection

                // WHOOP Sleep Quality (if connected)
                if whoopConnected, whoopSleep != nil {
                    WhoopSleepQualitySection(sleep: whoopSleep)
                }

                activitySection

                // WHOOP Workouts (if connected)
                if whoopConnected, !whoopWorkouts.isEmpty {
                    WhoopWorkoutsSection(workouts: whoopWorkouts)
                }

                heartSection

                // WHOOP Vitals (if connected)
                if whoopConnected {
                    WhoopVitalsSection(recovery: whoopRecovery)
                }
            }
        }
    }

    private var permissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "heart.text.square.fill")
                .font(.system(size: 80))
                .foregroundStyle(.red)

            Text("Access Your Health Data")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Grant access to HealthKit to see your steps, sleep, heart rate, and more.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if permissionDenied {
                VStack(spacing: 12) {
                    Text("Permission was denied. Please enable HealthKit access in Settings.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            openURL(url)
                        }
                    } label: {
                        Label("Open Settings", systemImage: "gear")
                    }
                    .mapHealthGlassButtonStyle(prominent: true)
                }
            } else {
                Button {
                    Task {
                        await requestPermission()
                    }
                } label: {
                    Label("Grant Access", systemImage: "heart.fill")
                }
                .mapHealthGlassButtonStyle(prominent: true)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 24, tint: .red.opacity(0.08))
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .orange.opacity(0.1))
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Steps",
                    value: formatNumber(steps),
                    icon: "figure.walk",
                    color: .green,
                    isLoading: isLoading,
                    trend: stepsTrend
                )
                metricCard(
                    title: "Calories",
                    value: formatNumber(activeCalories, suffix: " kcal"),
                    icon: "flame.fill",
                    color: .orange,
                    isLoading: isLoading,
                    trend: caloriesTrend
                )
            }
        }
    }

    private var sleepSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sleep")
                .font(.headline)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(.indigo)
                    Text("Last Night")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if isLoading {
                    VStack(alignment: .leading, spacing: 12) {
                        SkeletonText(width: 120, height: 24)
                        SkeletonRectangle(cornerRadius: 4)
                            .frame(height: 8)
                        HStack(spacing: 16) {
                            ForEach(0..<3, id: \.self) { _ in
                                HStack(spacing: 4) {
                                    SkeletonCircle(size: 8)
                                    SkeletonText(width: 50, height: 12)
                                }
                            }
                        }
                    }
                } else {
                    Text(formatSleepDuration(sleepHours))
                        .font(.title2)
                        .fontWeight(.semibold)

                    if let sleepAverage7d {
                        Text("7d avg \(formatHoursMinutes(sleepAverage7d))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if let trend = sleepTrend {
                        trendChip(trend)
                    }

                    if let stages = sleepStages, stages.totalAsleep > 0 {
                        sleepStagesBar(stages)
                    }
                }
            }
            .mapHealthGlassCard()
        }
    }

    @ViewBuilder
    private func sleepStagesBar(_ stages: SleepStages) -> some View {
        let total = stages.totalAsleep

        if total > 0 {
            VStack(alignment: .leading, spacing: 8) {
            GeometryReader { geometry in
                HStack(spacing: 2) {
                    Rectangle()
                        .fill(Color.cyan.opacity(0.7))
                        .frame(width: geometry.size.width * (stages.core / total))
                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: geometry.size.width * (stages.deep / total))
                    Rectangle()
                        .fill(Color.purple)
                        .frame(width: geometry.size.width * (stages.rem / total))
                }
                .clipShape(RoundedRectangle(cornerRadius: 4))
            }
            .frame(height: 8)

            HStack(spacing: 16) {
                sleepStageLegend(color: .cyan.opacity(0.7), label: "Core", hours: stages.core)
                sleepStageLegend(color: .blue, label: "Deep", hours: stages.deep)
                sleepStageLegend(color: .purple, label: "REM", hours: stages.rem)
            }
            .font(.caption)
            }
        }
    }

    private func sleepStageLegend(color: Color, label: String, hours: Double) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(label) \(formatHoursMinutes(hours))")
                .foregroundStyle(.secondary)
        }
    }

    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Exercise",
                    value: formatNumber(exerciseMinutes, suffix: " min"),
                    icon: "figure.run",
                    color: .cyan,
                    isLoading: isLoading,
                    trend: exerciseTrend
                )
                metricCard(
                    title: "Stand",
                    value: formatNumber(standMinutes.map { $0 / 60 }, suffix: " hr"),
                    icon: "figure.stand",
                    color: .blue,
                    isLoading: isLoading,
                    trend: standTrend
                )
            }
        }
    }

    private var heartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Heart")
                .font(.headline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                metricCard(
                    title: "Resting HR",
                    value: formatNumber(restingHR, suffix: " bpm"),
                    icon: "heart.fill",
                    color: .red,
                    isLoading: isLoading,
                    trend: restingHrTrend
                )
                metricCard(
                    title: "HRV",
                    value: formatNumber(hrv, suffix: " ms"),
                    icon: "waveform.path.ecg",
                    color: .pink,
                    isLoading: isLoading,
                    trend: hrvTrend
                )
            }
        }
    }

    private func metricCard(
        title: String,
        value: String,
        icon: String,
        color: Color,
        isLoading: Bool,
        trend: MetricTrend? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if isLoading {
                SkeletonText(width: 80, height: 22)
            } else {
                Text(value)
                    .font(.title3)
                    .fontWeight(.semibold)
                if let trend {
                    trendChip(trend)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: color.opacity(0.04))
        .animation(.easeInOut(duration: 0.25), value: isLoading)
    }

    private var refreshButton: some View {
        Button {
            Task {
                await loadAllData()
            }
        } label: {
            Image(systemName: "arrow.clockwise")
        }
        .mapHealthGlassButtonStyle()
        .disabled(isLoading || isLoadingWhoop)
    }
}

// MARK: - Data Loading

private extension HealthView {
    func checkPermissionAndLoad() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit is not available on this device."
            isLoading = false
            return
        }

        let stepType = HKQuantityType(.stepCount)
        let status = healthStore.authorizationStatus(for: stepType)

        switch status {
        case .notDetermined:
            needsPermission = true
            isLoading = false
        case .sharingDenied, .sharingAuthorized:
            await loadAllData()
        @unknown default:
            await loadAllData()
        }
    }

    func requestPermission() async {
        do {
            try await healthKitManager.requestAuthorization()
            needsPermission = false
            permissionDenied = false
            await loadAllData()
        } catch {
            permissionDenied = true
        }
    }

    func loadAllData() async {
        // Load HealthKit and WHOOP data in parallel
        async let healthKitTask: () = loadHealthData()
        async let whoopTask: () = loadWhoopData()
        _ = await (healthKitTask, whoopTask)
        lastUpdated = Date()
    }

    func loadHealthData() async {
        isLoading = true
        errorMessage = nil
        needsPermission = false

        do {
            async let stepsData = healthDataFetcher.fetchLastTwoWeeksStepCount()
            async let caloriesData = healthDataFetcher.fetchLastTwoWeeksActiveEnergy()
            async let exerciseData = healthDataFetcher.fetchLastTwoWeeksExerciseTime()
            async let standData = healthDataFetcher.fetchLastTwoWeeksStandTime()
            async let restingHRData = healthDataFetcher.fetchLastTwoWeeksRestingHeartRate()
            async let hrvData = healthDataFetcher.fetchLastTwoWeeksHRV()
            async let sleepData = healthDataFetcher.fetchLastTwoWeeksSleep()
            async let sleepStagesData = healthDataFetcher.fetchLastTwoWeeksSleepStages()

            let (stepsArr, caloriesArr, exerciseArr, standArr, restingHRArr, hrvArr, sleepArr, sleepStagesArr) =
                try await (stepsData, caloriesData, exerciseData, standData, restingHRData, hrvData, sleepData, sleepStagesData)

            let hasAnyData = [stepsArr, caloriesArr, exerciseArr, standArr, restingHRArr, hrvArr, sleepArr]
                .flatMap { $0 }
                .contains { $0 > 0 }

            if !hasAnyData {
                needsPermission = true
                isLoading = false
                return
            }

            steps = stepsArr.last.flatMap { $0 > 0 ? $0 : nil }
            activeCalories = caloriesArr.last.flatMap { $0 > 0 ? $0 : nil }
            exerciseMinutes = exerciseArr.last.flatMap { $0 > 0 ? $0 : nil }
            standMinutes = standArr.last.flatMap { $0 > 0 ? $0 : nil }
            restingHR = restingHRArr.last.flatMap { $0 > 0 ? $0 : nil }
            hrv = hrvArr.last.flatMap { $0 > 0 ? $0 : nil }
            sleepHours = sleepArr.last.flatMap { $0 > 0 ? $0 : nil }
            stepsTrend = makeTrend(current: steps, history: stepsArr)
            caloriesTrend = makeTrend(current: activeCalories, history: caloriesArr)
            exerciseTrend = makeTrend(current: exerciseMinutes, history: exerciseArr)
            standTrend = makeTrend(current: standMinutes, history: standArr)
            restingHrTrend = makeTrend(current: restingHR, history: restingHRArr, higherIsBetter: false)
            hrvTrend = makeTrend(current: hrv, history: hrvArr)
            sleepTrend = makeTrend(current: sleepHours, history: sleepArr)
            sleepAverage7d = averageRecent(sleepArr, count: 7)

            if let lastStages = sleepStagesArr.last, !lastStages.isEmpty {
                sleepStages = SleepStages(
                    awake: lastStages["awake"] ?? 0,
                    rem: lastStages["rem"] ?? 0,
                    core: lastStages["core"] ?? 0,
                    deep: lastStages["deep"] ?? 0,
                    inBed: lastStages["inBed"] ?? 0
                )
            }
        } catch {
            needsPermission = true
        }

        isLoading = false
    }

    func loadWhoopData() async {
        guard apiClient.isAuthenticated else { return }

        isLoadingWhoop = true

        do {
            // Check WHOOP connection status
            let profileResponse = try await apiClient.getWhoopProfile()
            whoopConnected = profileResponse.connected

            guard whoopConnected else {
                isLoadingWhoop = false
                return
            }

            // Fetch WHOOP data in parallel
            async let recoveryTask = apiClient.getWhoopRecovery()
            async let sleepTask = apiClient.getWhoopSleep()
            async let workoutsTask = apiClient.getWhoopWorkouts(limit: 5)

            let (recoveryResponse, sleepResponse, workoutsResponse) =
                try await (recoveryTask, sleepTask, workoutsTask)

            whoopRecovery = recoveryResponse.latest
            whoopCycle = recoveryResponse.latestCycle
            whoopSleep = sleepResponse.latest
            whoopWorkouts = workoutsResponse.workouts
        } catch {
            // Silently fail - WHOOP data is optional
            whoopConnected = false
        }

        isLoadingWhoop = false
    }
}

// MARK: - Formatting

private extension HealthView {
    func formatNumber(_ value: Double?, suffix: String = "") -> String {
        guard let value, value > 0 else { return "--" }
        if value >= 1000 {
            return String(format: "%.1fk%@", value / 1000, suffix)
        }
        return String(format: "%.0f%@", value, suffix)
    }

    func formatSleepDuration(_ hours: Double?) -> String {
        guard let hours, hours > 0 else { return "No data" }
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        return "\(wholeHours) hr \(minutes) min"
    }

    func formatHoursMinutes(_ hours: Double) -> String {
        let wholeHours = Int(hours)
        let minutes = Int((hours - Double(wholeHours)) * 60)
        if wholeHours > 0 {
            return "\(wholeHours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

// MARK: - Summary UI

private extension HealthView {
    var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Health Summary")
                .font(.title2)
                .fontWeight(.semibold)

            HStack(spacing: 8) {
                Text(Date(), format: .dateTime.weekday(.wide).month(.abbreviated).day())
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let lastUpdated {
                    Text("• Updated")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(lastUpdated, style: .relative)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    var dataSourcesSection: some View {
        HStack(spacing: 8) {
            statusChip(
                title: "Apple Health",
                status: healthKitStatus.title,
                color: healthKitStatus.color,
                icon: "heart.text.square"
            )
            statusChip(
                title: "WHOOP",
                status: whoopStatus.title,
                color: whoopStatus.color,
                icon: "bolt.heart"
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    var highlightsSection: some View {
        let highlights = makeHighlights()
        return Group {
            if !highlights.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Highlights")
                        .font(.headline)
                        .foregroundStyle(.secondary)

                    VStack(spacing: 10) {
                        ForEach(highlights) { highlight in
                            highlightRow(highlight)
                        }
                    }
                    .padding(16)
                    .mapHealthGlassSurface(cornerRadius: 18, tint: .accentColor.opacity(0.06))
                }
            }
        }
    }

    var healthKitStatus: StatusChip {
        if permissionDenied {
            return StatusChip(title: "Denied", color: .orange)
        }
        if needsPermission {
            return StatusChip(title: "Needs Access", color: .orange)
        }
        if isLoading {
            return StatusChip(title: "Loading", color: .secondary)
        }
        return StatusChip(title: "Connected", color: .green)
    }

    var whoopStatus: StatusChip {
        if !apiClient.isAuthenticated {
            return StatusChip(title: "Not Linked", color: .secondary)
        }
        if isLoadingWhoop {
            return StatusChip(title: "Syncing", color: .secondary)
        }
        if whoopConnected {
            return StatusChip(title: "Connected", color: .green)
        }
        return StatusChip(title: "Not Connected", color: .orange)
    }

    func statusChip(title: String, status: String, color: Color, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(color)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(status)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .mapHealthGlassSurface(cornerRadius: 12, tint: color.opacity(0.08))
    }
}

// MARK: - Trends

private extension HealthView {
    struct StatusChip {
        let title: String
        let color: Color
    }

    struct MetricTrend {
        let label: String
        let isPositive: Bool
        let delta: Double
    }

    struct Highlight: Identifiable {
        let id = UUID()
        let title: String
        let detail: String
        let icon: String
        let color: Color
    }

    func makeTrend(current: Double?, history: [Double], higherIsBetter: Bool = true) -> MetricTrend? {
        guard let current, current > 0 else { return nil }
        let valid = history.filter { $0 > 0 }
        guard valid.count >= 4 else { return nil }
        let previous = Array(valid.dropLast()).suffix(7)
        guard !previous.isEmpty else { return nil }
        let avg = previous.reduce(0, +) / Double(previous.count)
        guard avg > 0 else { return nil }
        let delta = (current - avg) / avg
        let magnitude = Swift.abs(delta)
        if magnitude < 0.02 {
            return MetricTrend(label: "On 7d avg", isPositive: true, delta: 0)
        }
        let percent = Int((magnitude * 100).rounded())
        let label = "\(percent)% \(delta >= 0 ? "above" : "below") 7d avg"
        let isPositive = higherIsBetter ? delta >= 0 : delta <= 0
        return MetricTrend(label: label, isPositive: isPositive, delta: delta)
    }

    func trendChip(_ trend: MetricTrend) -> some View {
        HStack(spacing: 4) {
            Image(systemName: trend.isPositive ? "arrow.up.right" : "arrow.down.right")
            Text(trend.label)
        }
        .font(.caption2)
        .fontWeight(.semibold)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .foregroundStyle(trend.isPositive ? .green : .orange)
        .mapHealthGlassSurface(
            cornerRadius: 10,
            tint: (trend.isPositive ? Color.green : Color.orange).opacity(0.12)
        )
        .accessibilityLabel(trend.label)
    }

    func averageRecent(_ history: [Double], count: Int) -> Double? {
        let valid = history.filter { $0 > 0 }
        guard !valid.isEmpty else { return nil }
        let slice = valid.suffix(count)
        guard !slice.isEmpty else { return nil }
        let total = slice.reduce(0, +)
        return total / Double(slice.count)
    }

    func makeHighlights() -> [Highlight] {
        struct HighlightCandidate {
            let name: String
            let trend: MetricTrend
            let icon: String
            let color: Color
        }

        struct HighlightEntry {
            let name: String
            let trend: MetricTrend?
            let icon: String
            let color: Color
        }

        let entries: [HighlightEntry] = [
            HighlightEntry(name: "Steps", trend: stepsTrend, icon: "figure.walk", color: .green),
            HighlightEntry(name: "Calories", trend: caloriesTrend, icon: "flame.fill", color: .orange),
            HighlightEntry(name: "Exercise", trend: exerciseTrend, icon: "figure.run", color: .cyan),
            HighlightEntry(name: "Stand", trend: standTrend, icon: "figure.stand", color: .blue),
            HighlightEntry(name: "Resting HR", trend: restingHrTrend, icon: "heart.fill", color: .red),
            HighlightEntry(name: "HRV", trend: hrvTrend, icon: "waveform.path.ecg", color: .pink),
            HighlightEntry(name: "Sleep", trend: sleepTrend, icon: "moon.fill", color: .indigo)
        ]

        let trends = entries.compactMap { entry -> HighlightCandidate? in
            guard let trend = entry.trend else { return nil }
            return HighlightCandidate(name: entry.name, trend: trend, icon: entry.icon, color: entry.color)
        }

        guard !trends.isEmpty else { return [] }

        let best = trends.max { $0.trend.delta < $1.trend.delta }
        let worst = trends.min { $0.trend.delta < $1.trend.delta }

        var highlights: [Highlight] = []
        if let best, best.trend.delta > 0.02 {
            highlights.append(
                Highlight(
                    title: "Up today",
                    detail: "\(best.name) • \(best.trend.label)",
                    icon: best.icon,
                    color: best.color
                )
            )
        }
        if let worst, worst.trend.delta < -0.02 {
            highlights.append(
                Highlight(
                    title: "Needs attention",
                    detail: "\(worst.name) • \(worst.trend.label)",
                    icon: worst.icon,
                    color: .orange
                )
            )
        }

        return highlights
    }

    func highlightRow(_ highlight: Highlight) -> some View {
        HStack(spacing: 12) {
            Image(systemName: highlight.icon)
                .font(.subheadline)
                .foregroundStyle(highlight.color)
            VStack(alignment: .leading, spacing: 4) {
                Text(highlight.title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(highlight.detail)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}
