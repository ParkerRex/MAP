import MapHealthCore
import SwiftUI
import UIKit

struct MainTabView: View {
    @State private var selectedTab: Tab = .home
    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager
    private let mainTabs: [Tab] = [.home, .calendar, .todos, .notes, .health]

    enum Tab: String, CaseIterable {
        case home = "Home"
        case chat = "Chat"
        case calendar = "Cal"
        case todos = "Todos"
        case notes = "Notes"
        case health = "Health"

        var icon: String {
            switch self {
            case .home: "house"
            case .chat: "bubble.left.and.bubble.right"
            case .calendar: "calendar"
            case .todos: "checklist"
            case .notes: "note.text"
            case .health: "heart"
            }
        }
    }

    var body: some View {
        tabViewContent
            .background(OnboardingBackground())
            .safeAreaInset(edge: .bottom) {
                CustomTabBar(selectedTab: $selectedTab, mainTabs: mainTabs)
            }
    }

    @ViewBuilder
    private var tabViewContent: some View {
        if #available(iOS 26, *) {
            TabView(selection: $selectedTab) {
                ForEach(Tab.allCases, id: \.self) { tab in
                    tabContent(for: tab)
                        .tabItem {
                            Label(tab.rawValue, systemImage: tab.icon)
                        }
                        .tag(tab)
                }
            }
            .tabViewStyle(.sidebarAdaptable)
            .toolbar(.hidden, for: .tabBar)
        } else {
            TabView(selection: $selectedTab) {
                ForEach(Tab.allCases, id: \.self) { tab in
                    tabContent(for: tab)
                        .tabItem {
                            Label(tab.rawValue, systemImage: tab.icon)
                        }
                        .tag(tab)
                }
            }
            .toolbar(.hidden, for: .tabBar)
        }
    }

    @ViewBuilder
    private func tabContent(for tab: Tab) -> some View {
        switch tab {
        case .home:
            HomeView(navigateToTab: { selectedTab = $0 })
        case .chat:
            ChatView()
        case .calendar:
            CalendarView()
        case .todos:
            TodosView()
        case .notes:
            NotesView()
        case .health:
            HealthView()
        }
    }
}

private struct CustomTabBar: View {
    @Binding var selectedTab: MainTabView.Tab
    let mainTabs: [MainTabView.Tab]

    var body: some View {
        HStack(spacing: 12) {
            HStack(spacing: 4) {
                ForEach(mainTabs, id: \.self) { tab in
                    tabButton(for: tab)
                }
            }
            .padding(6)
            .mapHealthGlassSurface(cornerRadius: 22, tint: .primary.opacity(0.03), interactive: true)

            Button {
                selectedTab = .chat
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            } label: {
                Image(systemName: MainTabView.Tab.chat.icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 44, height: 44)
                    .mapHealthGlassSurface(cornerRadius: 22, tint: .primary.opacity(0.03), interactive: true)
            }
            .mapHealthPressable()
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private func tabButton(for tab: MainTabView.Tab) -> some View {
        Button {
            selectedTab = tab
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        } label: {
            VStack(spacing: 2) {
                Image(systemName: tab.icon)
                    .font(.subheadline.weight(.semibold))
                Text(tab.rawValue)
                    .font(.caption2.weight(.semibold))
            }
            .foregroundStyle(selectedTab == tab ? Color.accentColor : .secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background {
                if selectedTab == tab {
                    Capsule()
                        .fill(Color.accentColor.opacity(0.12))
                }
            }
        }
        .mapHealthPressable()
    }
}
