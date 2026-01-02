import HealthKit
import MapHealthCore
import SwiftUI

struct HealthView: View {
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager
    @Environment(\.openURL) private var openURL

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

    private let healthStore = HKHealthStore()
    private let healthDataFetcher = HealthDataFetcher()

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
        } else {
            ScrollView {
                healthBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
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
                todaySection
                sleepSection
                activitySection
                heartSection
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
                    isLoading: isLoading
                )
                metricCard(
                    title: "Calories",
                    value: formatNumber(activeCalories, suffix: " kcal"),
                    icon: "flame.fill",
                    color: .orange,
                    isLoading: isLoading
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
                    ProgressView()
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    Text(formatSleepDuration(sleepHours))
                        .font(.title2)
                        .fontWeight(.semibold)

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
                    isLoading: isLoading
                )
                metricCard(
                    title: "Stand",
                    value: formatNumber(standMinutes.map { $0 / 60 }, suffix: " hr"),
                    icon: "figure.stand",
                    color: .blue,
                    isLoading: isLoading
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
                    isLoading: isLoading
                )
                metricCard(
                    title: "HRV",
                    value: formatNumber(hrv, suffix: " ms"),
                    icon: "waveform.path.ecg",
                    color: .pink,
                    isLoading: isLoading
                )
            }
        }
    }

    private func metricCard(
        title: String,
        value: String,
        icon: String,
        color: Color,
        isLoading: Bool
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
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text(value)
                    .font(.title3)
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }

    private var refreshButton: some View {
        Button {
            Task {
                await loadHealthData()
            }
        } label: {
            Image(systemName: "arrow.clockwise")
        }
        .mapHealthGlassButtonStyle()
        .disabled(isLoading)
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
            await loadHealthData()
        @unknown default:
            await loadHealthData()
        }
    }

    func requestPermission() async {
        do {
            try await healthKitManager.requestAuthorization()
            needsPermission = false
            permissionDenied = false
            await loadHealthData()
        } catch {
            permissionDenied = true
        }
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
