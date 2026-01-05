import MapHealthCore
import SwiftUI

struct EventDetailSheet: View {
    let event: CalendarEvent
    @ObservedObject var calendarService: CalendarService
    let onDelete: () -> Void
    let onUpdate: () -> Void

    @Environment(\.dismiss) var dismiss
    @State private var showingEditSheet = false
    @State var showingDeleteAlert = false
    @State var isDeleting = false

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
}
