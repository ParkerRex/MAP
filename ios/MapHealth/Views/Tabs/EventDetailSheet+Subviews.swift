import MapHealthCore
import SwiftUI

extension EventDetailSheet {
    var summarySection: some View {
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

    var deleteButton: some View {
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

    var colorIndicator: AnyView {
        if calendarService.colorForEvent(event) != nil {
            return calendarColorDot
        }
        return AnyView(
            Image(systemName: "circle.slash")
                .font(.caption)
                .foregroundStyle(.tertiary)
        )
    }

    var calendarColorDot: AnyView {
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

    var cardDivider: some View {
        Divider()
            .padding(.leading, 16)
    }

    func detailCard(@ViewBuilder content: () -> some View) -> some View {
        VStack(spacing: 0) {
            content()
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    func detailRow(
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
}

struct AttendeeRow: View {
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
