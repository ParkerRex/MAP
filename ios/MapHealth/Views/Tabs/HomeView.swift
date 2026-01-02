import MapHealthCore
import SwiftUI

struct HomeView: View {
    let navigateToTab: (MainTabView.Tab) -> Void
    @State private var showSettings = false
    @State private var modelSettingRefreshId = UUID()

    var body: some View {
        NavigationStack {
            homeContent
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        settingsButton
                    }
                }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(modelSettingRefreshId: $modelSettingRefreshId)
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

                Text("No events today")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

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
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.secondary)
                }

                Text("No tasks for today")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

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

                Text("View your health metrics")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .mapHealthGlassCard()
        }
        .buttonStyle(.plain)
    }

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
}
