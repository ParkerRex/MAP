import MapHealthCore
import SwiftUI

// MARK: - Quick Add Bar

struct QuickAddBar: View {
    @Binding var text: String
    @Binding var date: Date?
    let onSubmit: () -> Void
    let onCancel: () -> Void
    var focused: FocusState<Bool>.Binding

    var body: some View {
        VStack(spacing: 0) {
            Divider()

            VStack(spacing: 12) {
                quickDateButtons
                textFieldRow
            }
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private var quickDateButtons: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                QuickDateButton(title: "Today", icon: "sun.max.fill", color: .orange) {
                    date = Calendar.current.startOfDay(for: Date())
                    HapticFeedback.light()
                }
                .opacity(isToday(date) ? 1 : 0.7)

                QuickDateButton(title: "Tomorrow", icon: "sunrise.fill", color: .orange) {
                    date = tomorrow()
                    HapticFeedback.light()
                }
                .opacity(isTomorrow(date) ? 1 : 0.7)

                QuickDateButton(title: "This Weekend", icon: "figure.walk", color: .purple) {
                    date = DateHelpers.nextWeekend()
                    HapticFeedback.light()
                }

                QuickDateButton(title: "Next Week", icon: "calendar.badge.clock", color: .blue) {
                    date = DateHelpers.nextMonday()
                    HapticFeedback.light()
                }

                if date != nil {
                    Button {
                        date = nil
                        HapticFeedback.light()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var textFieldRow: some View {
        HStack(spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "circle")
                    .foregroundStyle(.secondary)
                    .font(.title3)

                TextField("New task...", text: $text)
                    .focused(focused)
                    .submitLabel(.done)
                    .onSubmit(onSubmit)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Button(action: onCancel) {
                Text("Cancel")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
    }

    private func isToday(_ date: Date?) -> Bool {
        date.map { Calendar.current.isDateInToday($0) } == true
    }

    private func isTomorrow(_ date: Date?) -> Bool {
        date.map { Calendar.current.isDateInTomorrow($0) } == true
    }

    private func tomorrow() -> Date {
        Calendar.current.date(
            byAdding: .day,
            value: 1,
            to: Calendar.current.startOfDay(for: Date())
        )!
    }
}
