import CoreLocation
import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @StateObject var calendarService = CalendarService.shared
    @State var selectedDate = Date()
    @State var viewMode: CalendarViewMode = .day
    @State var showingCalendarPicker = false
    @State var showingCreateEvent = false
    @State var createEventStartDate: Date?
    @State var createEventIsAllDay = false
    @State var selectedEvent: CalendarEvent?
    @State var eventToDelete: CalendarEvent?
    @State var showingDeleteConfirmation = false
    @State var showingDatePicker = false
    @GestureState var dayDragOffset: CGFloat = 0
    @State var hasLoadedInitialData = false
    @State var weather: WeatherData?
    @StateObject var locationManager = LocationManager()
    @State var showWeekStrip = true

    let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
    let lightFeedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    let calendar = Calendar.current

    @Namespace var viewModeNamespace
}
