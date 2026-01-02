import MapHealthCore
import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .home
    @EnvironmentObject private var healthDataInterpreter: HealthDataInterpreter
    @EnvironmentObject private var healthKitManager: HealthKitAuthorizationManager

    enum Tab: String, CaseIterable {
        case home = "Home"
        case chat = "Chat"
        case calendar = "Cal"
        case todos = "Todos"
        case health = "Health"

        var icon: String {
            switch self {
            case .home: "house"
            case .chat: "bubble.left.and.bubble.right"
            case .calendar: "calendar"
            case .todos: "checklist"
            case .health: "heart"
            }
        }
    }

    var body: some View {
        tabViewContent
            .background(OnboardingBackground())
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
        case .health:
            HealthView()
        }
    }
}
