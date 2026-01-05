import MapHealthCore
import SwiftUI

struct EventDetailSheet: View {
    let event: CalendarEvent
    @ObservedObject var calendarService: CalendarService
    let onDelete: () -> Void
    let onUpdate: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var isDeleting = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    summarySection

                    detailCard {
                        detailRow(
                            title: "Calendar",
                            value: calendarLabel,
                            trailingAccessory: calendarColorDot
                        )
                        cardDivider
                        detailRow(
                            title: "Color",
                            value: colorLabel,
                            trailingAccessory: colorIndicator
                        )
                        cardDivider
                        detailRow(title: "Alert", value: alertLabel)
                        cardDivider
                        detailRow(title: "Show As", value: availabilityLabel)
                    }

                    if let location = event.location, !location.isEmpty {
                        detailCard {
                            Button { openInMaps(location) } label: {
                                detailRow(
                                    title: "Location",
                                    value: location,
                                    showsChevron: false,
                                    trailingIcon: "arrow.up.right"
                                )
                            }
                        }
                    }

                    if let link = videoConferenceLink, let url = URL(string: link) {
                        detailCard {
                            Link(destination: url) {
                                detailRow(
                                    title: "Join Video Call",
                                    value: conferenceName,
                                    showsChevron: false,
                                    trailingIcon: "arrow.up.right"
                                )
                            }
                        }
                    }

                    if let urlString = event.htmlLink, let url = URL(string: urlString) {
                        detailCard {
                            Link(destination: url) {
                                detailRow(
                                    title: "URL",
                                    value: url.host ?? urlString,
                                    showsChevron: false,
                                    trailingIcon: "arrow.up.right"
                                )
                            }
                        }
                    }

                    if let description = event.description, !description.isEmpty {
                        detailCard {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Notes")
                                    .font(.subheadline.weight(.semibold))
                                Text(description)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    if let attendees = event.attendees, !attendees.isEmpty {
                        detailCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Attendees")
                                    .font(.subheadline.weight(.semibold))
                                ForEach(attendees, id: \.email) { attendee in
                                    AttendeeRow(attendee: attendee)
                                }
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    deleteButton
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "chevron.left")
                                .font(.caption.weight(.semibold))
                            Text(backButtonTitle)
                                .font(.subheadline.weight(.semibold))
                        }
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .mapHealthGlassSurface(cornerRadius: 16, tint: .primary.opacity(0.03))
                    }
                    .mapHealthPressable()
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 8) {
                        Button {
                        } label: {
                            Image(systemName: "ellipsis")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.primary)
                                .padding(10)
                                .mapHealthGlassSurface(cornerRadius: 14, tint: .primary.opacity(0.03))
                        }
                        .mapHealthPressable()

                        Button {
                            showingEditSheet = true
                        } label: {
                            Text("Edit")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.primary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .mapHealthGlassSurface(cornerRadius: 16, tint: .primary.opacity(0.03))
                        }
                        .mapHealthPressable()
                    }
                }
            }
            .sheet(isPresented: $showingEditSheet) {
                EventFormSheet(
                    calendarService: calendarService,
                    selectedDate: event.startDate ?? Date(),
                    editingEvent: event
                )
            }
            .alert("Delete Event", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task { await deleteEvent() }
                }
            } message: {
                Text("Are you sure you want to delete this event? This action cannot be undone.")
            }
            .onChange(of: showingEditSheet) { _, isPresented in
                if !isPresented { onUpdate() }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var summarySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(event.summary ?? "Untitled Event")
                .font(.title3.weight(.semibold))

            if let startDate = event.startDate {
                Text(startDate, format: .dateTime.weekday(.wide).month(.wide).day().year())
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Text(event.timeString)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let repeatsDescription {
                Text(repeatsDescription)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, 4)
    }

    private var deleteButton: some View {
        Button(role: .destructive) { showingDeleteAlert = true } label: {
            HStack {
                Spacer()
                if isDeleting {
                    ProgressView()
                } else {
                    Text("Delete Event")
                        .font(.subheadline.weight(.semibold))
                }
                Spacer()
            }
            .padding(.vertical, 12)
        }
        .disabled(isDeleting)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(Capsule())
        .padding(.top, 4)
    }

    private var videoConferenceLink: String? {
        if let link = event.hangoutLink { return link }
        return event.conferenceData?.entryPoints?.first(where: { $0.entryPointType == "video" })?.uri
    }

    private var conferenceName: String {
        event.conferenceData?.conferenceSolution?.name ?? "Google Meet"
    }

    private func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    private var alertLabel: String {
        "None"
    }

    private var calendarLabel: String {
        if let organizer = event.organizer?.displayName, !organizer.isEmpty {
            return organizer
        }
        if let organizerEmail = event.organizer?.email, !organizerEmail.isEmpty {
            return organizerEmail
        }
        if let primary = calendarService.primaryCalendar?.summary, !primary.isEmpty {
            return primary
        }
        return "Primary"
    }

    private var colorLabel: String {
        calendarService.colorForEvent(event) == nil ? "None" : "Custom"
    }

    private var colorIndicator: AnyView {
        if calendarService.colorForEvent(event) != nil {
            return calendarColorDot
        }
        return AnyView(
            Image(systemName: "circle.slash")
                .font(.caption)
                .foregroundStyle(.tertiary)
        )
    }

    private var availabilityLabel: String {
        switch event.transparency {
        case "transparent": return "Free"
        case "opaque": return "Busy"
        default: return "Busy"
        }
    }

    private var repeatsDescription: String? {
        guard let rule = recurrenceRule else { return nil }
        return formatRecurrence(rule)
    }

    private var calendarColorDot: AnyView {
        let fallback = Color.secondary.opacity(0.2)
        if let colors = calendarService.colorForEvent(event) {
            return AnyView(
                Circle()
                    .fill(Color(hex: colors.background) ?? fallback)
                    .frame(width: 10, height: 10)
            )
        }
        return AnyView(
            Circle()
                .fill(fallback)
                .frame(width: 10, height: 10)
        )
    }

    private var cardDivider: some View {
        Divider()
            .padding(.leading, 16)
    }

    private func detailCard(@ViewBuilder content: () -> some View) -> some View {
        VStack(spacing: 0) {
            content()
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func detailRow(
        title: String,
        value: String,
        trailingAccessory: AnyView? = nil,
        showsChevron: Bool = true,
        trailingIcon: String? = nil
    ) -> some View {
        HStack {
            Text(title)

            Spacer()

            HStack(spacing: 6) {
                if let trailingAccessory {
                    trailingAccessory
                }
                Text(value)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            if let trailingIcon {
                Image(systemName: trailingIcon)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .contentShape(Rectangle())
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
    }

    private var backButtonTitle: String {
        guard let startDate = event.startDate else { return "Back" }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: startDate)
    }

    private var recurrenceRule: String? {
        event.recurrence?.first(where: { $0.contains("RRULE") })
    }

    private func formatRecurrence(_ rule: String) -> String {
        let cleaned = rule.replacingOccurrences(of: "RRULE:", with: "")
        let parts = cleaned.split(separator: ";")
        var values: [String: String] = [:]
        for part in parts {
            let pair = part.split(separator: "=", maxSplits: 1)
            if pair.count == 2 {
                values[String(pair[0]).uppercased()] = String(pair[1]).uppercased()
            }
        }

        let freq = values["FREQ"] ?? "DAILY"
        let interval = Int(values["INTERVAL"] ?? "1") ?? 1
        let days = values["BYDAY"]?.split(separator: ",").map { $0 } ?? []

        let frequencyLabel: String
        switch freq {
        case "WEEKLY": frequencyLabel = interval == 1 ? "every week" : "every \(interval) weeks"
        case "MONTHLY": frequencyLabel = interval == 1 ? "every month" : "every \(interval) months"
        case "YEARLY": frequencyLabel = interval == 1 ? "every year" : "every \(interval) years"
        default: frequencyLabel = interval == 1 ? "every day" : "every \(interval) days"
        }

        if !days.isEmpty {
            let dayNames = days.compactMap(mapWeekday)
            return "Repeats \(frequencyLabel) on \(dayNames.joined(separator: ", "))"
        }
        return "Repeats \(frequencyLabel)"
    }

    private func mapWeekday(_ code: Substring) -> String? {
        switch code {
        case "MO": return "Mon"
        case "TU": return "Tue"
        case "WE": return "Wed"
        case "TH": return "Thu"
        case "FR": return "Fri"
        case "SA": return "Sat"
        case "SU": return "Sun"
        default: return nil
        }
    }

    private func deleteEvent() async {
        isDeleting = true
        do {
            try await calendarService.deleteEvent(event)
            dismiss()
            onDelete()
        } catch {
            // Error handled by calendarService
        }
        isDeleting = false
    }
}

private struct AttendeeRow: View {
    let attendee: EventAttendee

    var body: some View {
        HStack {
            Image(systemName: responseIcon).foregroundStyle(responseColor)

            VStack(alignment: .leading) {
                Text(attendee.displayName ?? attendee.email ?? "Unknown")
                if attendee.organizer == true {
                    Text("Organizer")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Spacer()

            if attendee.optional == true {
                Text("Optional")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private var responseIcon: String {
        switch attendee.responseStatus {
        case "accepted": return "checkmark.circle.fill"
        case "declined": return "xmark.circle.fill"
        case "tentative": return "questionmark.circle.fill"
        default: return "circle"
        }
    }

    private var responseColor: Color {
        switch attendee.responseStatus {
        case "accepted": return .green
        case "declined": return .red
        case "tentative": return .orange
        default: return .secondary
        }
    }
}
