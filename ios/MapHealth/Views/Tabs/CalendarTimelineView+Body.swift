import MapHealthCore
import SwiftUI

extension CalendarTimelineView {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if !allDayEvents.isEmpty {
                allDaySection
            }

            if !timedEvents.isEmpty || allDayEvents.isEmpty {
                timelineSection
            }
        }
    }

    private var allDaySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text("All Day")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)

                Text("\(allDayEvents.count)")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .mapHealthGlassSurface(cornerRadius: 8, tint: .primary.opacity(0.03))
            }
            .padding(.leading, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    if allDayEvents.isEmpty {
                        AllDayAddChip(onTap: onCreateAllDay)
                    } else {
                        ForEach(allDayEvents) { event in
                            AllDayEventChip(
                                event: event,
                                calendarService: calendarService,
                                onTap: { onEventTap(event) },
                                onDelete: { onEventDelete(event) }
                            )
                        }
                    }
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 2)
            }
        }
    }

    private var timelineSection: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 12) {
                timelineHeader

                ScrollView(.vertical, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        timelineTapLayer
                        hourStripes
                        hourGrid

                        if calendar.isDateInToday(selectedDate) {
                            currentTimeIndicator
                        }

                        eventBlocks
                    }
                    .frame(height: hourHeight * 24)
                    .id("timeline")
                }
            }
            .onAppear {
                scrollToRelevantTime(proxy: proxy)
            }
            .onChange(of: selectedDate) { _, _ in
                scrollToRelevantTime(proxy: proxy)
            }
            .onChange(of: scrollRequest) { _, _ in
                scrollToRelevantTime(proxy: proxy)
            }
        }
    }

    private var timelineHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Timeline")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                Text(timelineSubtitle)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            if let freeSlot = nextAvailableSlot {
                Text("\(freeSlot)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .mapHealthGlassSurface(cornerRadius: 10, tint: .primary.opacity(0.03))
            }

            Button {
                lightFeedbackGenerator.impactOccurred()
                scrollRequest += 1
            } label: {
                Label(timelineFocusLabel, systemImage: "scope")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .mapHealthGlassSurface(cornerRadius: 10, tint: .primary.opacity(0.03))
            }
            .mapHealthPressable()
        }
        .padding(.horizontal, 4)
    }

    private var timelineSubtitle: String {
        if timedEvents.isEmpty {
            return "Tap the grid to add a time"
        }
        let totalMinutes = timedEvents.reduce(0) { partialResult, event in
            partialResult + Int(eventDuration(event))
        }
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours == 0 {
            return "\(minutes)m scheduled"
        }
        if minutes == 0 {
            return "\(hours)h scheduled"
        }
        return "\(hours)h \(minutes)m scheduled"
    }

    private var nextAvailableSlot: String? {
        guard !timedEvents.isEmpty else { return nil }
        let now = calendar.isDateInToday(selectedDate) ? Date() : startOfDay(for: selectedDate)
        let sorted = timedEvents.sorted { ($0.startDate ?? .distantPast) < ($1.startDate ?? .distantPast) }

        var cursor = now
        for event in sorted {
            guard let start = event.startDate else { continue }
            let end = eventEnd(event, fallbackStart: start)
            if cursor < start {
                let gapMinutes = Int(start.timeIntervalSince(cursor) / 60)
                if gapMinutes >= 30 {
                    return "Next free: \(cursor.formatted(.dateTime.hour().minute()))"
                }
            }
            if end > cursor {
                cursor = end
            }
        }

        let endOfDay = calendar.date(bySettingHour: 23, minute: 59, second: 0, of: selectedDate) ?? selectedDate
        let tailGap = Int(endOfDay.timeIntervalSince(cursor) / 60)
        if tailGap >= 30 {
            return "Next free: \(cursor.formatted(.dateTime.hour().minute()))"
        }

        return nil
    }

    private var timelineTapLayer: some View {
        Color.clear
            .contentShape(Rectangle())
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onEnded { value in
                        let distance = hypot(value.translation.width, value.translation.height)
                        guard distance < 6 else { return }
                        mediumFeedbackGenerator.impactOccurred()
                        onCreateEventAt(dateForTimelineOffset(value.location.y))
                    }
            )
    }

    private var timelineFocusLabel: String {
        calendar.isDateInToday(selectedDate) ? "Now" : "Focus"
    }

    private var hourGrid: some View {
        VStack(spacing: 0) {
            ForEach(0..<24, id: \.self) { hour in
                HStack(alignment: .top, spacing: 8) {
                    Text(hourLabel(for: hour))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .frame(width: 44, alignment: .trailing)

                    VStack {
                        Divider()
                            .background(Color.secondary.opacity(0.2))
                    }
                }
                .frame(height: hourHeight)
            }
        }
    }

    private var hourStripes: some View {
        let isToday = calendar.isDateInToday(selectedDate)
        let currentHour = calendar.component(.hour, from: Date())

        return VStack(spacing: 0) {
            ForEach(0..<24, id: \.self) { hour in
                ZStack(alignment: .top) {
                    Rectangle()
                        .fill(hour.isMultiple(of: 2) ? Color.secondary.opacity(0.04) : Color.clear)

                    Rectangle()
                        .fill(Color.secondary.opacity(0.12))
                        .frame(height: 1)
                        .offset(y: hourHeight / 2)

                    if isToday && hour == currentHour {
                        Rectangle()
                            .fill(Color.accentColor.opacity(0.06))
                    }
                }
                .frame(height: hourHeight)
                .padding(.leading, timelineLeadingInset - 4)
            }
        }
    }

    private var currentTimeIndicator: some View {
        let now = Date()
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        let offset = CGFloat(hour) * hourHeight + CGFloat(minute) / 60.0 * hourHeight

        return HStack(spacing: 8) {
            HStack(spacing: 6) {
                Text("NOW")
                    .font(.caption2.weight(.bold))
                Text(now.formatted(.dateTime.hour().minute()))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .foregroundStyle(.accentColor)
            .mapHealthGlassSurface(cornerRadius: 10, tint: .accentColor.opacity(0.08))

            Circle()
                .fill(.accentColor)
                .frame(width: 8, height: 8)

            Rectangle()
                .fill(.accentColor)
                .frame(height: 1.5)
        }
        .padding(.leading, 8)
        .offset(y: offset - 12)
    }

    private var eventBlocks: some View {
        GeometryReader { geometry in
            let layout = timedEventLayout
            let availableWidth = max(
                0,
                geometry.size.width - timelineLeadingInset - timelineTrailingInset
            )

            ForEach(layout) { item in
                if let startDate = item.event.startDate {
                    let topOffset = offsetForTime(startDate)
                    let duration = eventDuration(item.event)
                    let height = max(duration / 60.0 * hourHeight, 30)
                    let columnWidth = columnWidth(
                        availableWidth: availableWidth,
                        columns: item.columns
                    )
                    let xOffset = timelineLeadingInset + CGFloat(item.column) *
                        (columnWidth + timelineColumnSpacing)

                    TimelineEventCard(
                        event: item.event,
                        calendarService: calendarService,
                        isCompact: false,
                        onTap: { onEventTap(item.event) },
                        onDelete: { onEventDelete(item.event) }
                    )
                    .frame(width: columnWidth, height: height)
                    .offset(x: xOffset, y: topOffset)
                }
            }
        }
    }
}
