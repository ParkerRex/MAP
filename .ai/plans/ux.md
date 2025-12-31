# UX Improvements Spec

## Navigation & Layout

### 1. Add missing navigation links in sidebar
**Status:** Done
**Priority:** High

Tasks, Notes, and Health pages aren't linked in the sidebar. Users can't discover them.

**Implementation:**
- Add navigation items for `/tasks`, `/notes`, `/health` to sidebar
- Include appropriate icons (CheckSquare, FileText, Heart)
- Highlight active route

**Changes:**
- Updated `src/components/sidebar.tsx` with full navigation (Calendar, Tasks, Notes, Health, Settings)
- Added active route highlighting using `usePathname`
- Changed to fixed positioning with proper responsive behavior

### 2. Add user menu with logout
**Status:** Done
**Priority:** High

No visible way to log out or access account settings from the main dashboard.

**Implementation:**
- Add user avatar/menu in sidebar or header
- Include logout action that clears session
- Optionally show user email/name

**Changes:**
- Added user dropdown menu at bottom of sidebar
- Shows user's name/email and logout option
- Created `src/hooks/use-auth.ts` hook for user data and logout
- Added auth endpoints to API client (`src/lib/api/client.ts`)

### 3. Fix mobile calendar layout
**Status:** Done
**Priority:** High

Calendar uses fixed full-screen layout that completely breaks on mobile devices.

**Implementation:**
- Make calendar grid horizontally scrollable on mobile
- Consider day view for mobile instead of week view
- Ensure toolbar and navigation are touch-friendly

**Changes:**
- Updated `src/app/calendar/page.tsx` to hide side panels on mobile (lg/xl breakpoints)
- Made calendar grid horizontally scrollable with min-width constraint
- Updated toolbar to be responsive (smaller text, wrapped layout)
- Updated CalendarMenu and ContextPanel with proper flex styling and theme colors

---

## Calendar

### 4. Add event creation UI
**Status:** Pending
**Priority:** Medium

No way to create new calendar events from the dashboard (only Google Calendar sync exists).

**Implementation:**
- Add "New Event" button to calendar toolbar
- Create event form modal/dialog
- Wire to existing `useCreateEvent` mutation

### 5. Implement delete event functionality
**Status:** Pending
**Priority:** Medium

Context menu shows "Delete Event" but `onSelect` is empty in `src/components/calendar/calendar-event.tsx`.

**Implementation:**
- Wire up `useDeleteEvent` mutation to context menu
- Add confirmation dialog before deletion
- Show toast on success/failure

### 6. Format event times properly
**Status:** Pending
**Priority:** Medium

Event times display as raw ISO strings (e.g., "2025-01-15T10:30:00...") instead of human-readable format.

**Implementation:**
- Use date-fns or similar to format times
- Show "10:30 AM - 11:30 AM" format
- Consider relative times for context panel ("in 30 minutes")

### 7. Add visual indicators for overlapping events
**Status:** Pending
**Priority:** Low

Events that overlap timewise stack without clear visual separation.

**Implementation:**
- Detect overlapping events in same time slot
- Reduce width and offset overlapping events
- Show count badge if too many to display

---

## Tasks

### 8. Persist task notes/body field
**Status:** Pending
**Priority:** High

The body/description input in expanded task view isn't wired to save (`src/components/tasks/task-item.tsx:180`).

**Implementation:**
- Add `body` field to task update mutation
- Debounce input changes before saving
- Show save indicator

### 9. Add debounce to search
**Status:** Pending
**Priority:** Medium

Task search filters on every keystroke without debouncing, causing unnecessary re-renders.

**Implementation:**
- Add 300ms debounce to search input
- Show loading indicator while debouncing
- Use `useDeferredValue` or custom debounce hook

### 10. Show active tag filter state
**Status:** Pending
**Priority:** Medium

Tag filter dropdown doesn't visually indicate which tags are currently selected.

**Implementation:**
- Show selected tag count in filter button
- Display selected tags as chips/badges
- Add "Clear filters" action

### 11. Add bulk task actions
**Status:** Pending
**Priority:** Low

No way to complete, delete, or tag multiple tasks at once.

**Implementation:**
- Add multi-select mode with checkboxes
- Show bulk action toolbar when items selected
- Support complete all, delete all, tag all

---

## Notes

### 12. Wire up note editing
**Status:** Pending
**Priority:** High

Title and content inputs in NoteDisplay aren't connected to mutations - changes don't save.

**Implementation:**
- Connect inputs to `useUpdateNote` mutation
- Debounce changes (500ms) before saving
- Show "Saving..." / "Saved" indicator

### 13. Add rich text or markdown support
**Status:** Pending
**Priority:** Low

Notes are plain textarea only; no formatting, markdown preview, or rich text.

**Implementation:**
- Add markdown preview toggle
- Or integrate lightweight rich text editor
- Support basic formatting (bold, italic, lists)

### 14. Implement sort options
**Status:** Pending
**Priority:** Medium

Sort options appear in context menu but are non-functional.

**Implementation:**
- Wire up sort by date, title, modified
- Persist sort preference
- Show current sort in UI

### 15. Show helpful empty state
**Status:** Pending
**Priority:** Low

"You've got no notes" could suggest creating a folder first or provide a getting-started guide.

**Implementation:**
- Add illustration or icon
- Show actionable suggestion ("Create your first folder")
- Include keyboard shortcut hints

---

## Health Dashboard

### 16. Add interactive tooltips to sleep stages
**Status:** Pending
**Priority:** Low

Sleep stages bar shows percentages but lacks hover tooltips for exact values.

**Implementation:**
- Add Tooltip component on hover
- Show exact duration and percentage
- Include comparison to baseline if available

### 17. Add confirmation for Disconnect
**Status:** Pending
**Priority:** Medium

WHOOP disconnect button has no confirmation dialog; users could accidentally wipe data.

**Implementation:**
- Add AlertDialog confirmation
- Explain data will be deleted
- Require explicit "Disconnect" confirmation

### 18. Add historical data beyond 7 days
**Status:** Pending
**Priority:** Low

7-day trend section is the only historical view; add weekly/monthly options.

**Implementation:**
- Add time range selector (7d, 30d, 90d)
- Fetch additional data based on selection
- Update trend calculations

---

## Error Handling & Feedback

### 19. Show contextual error messages
**Status:** Pending
**Priority:** Medium

Errors use generic messages. Show specific details like "Failed to create task: title required".

**Implementation:**
- Update API error responses with details
- Display field-specific errors in forms
- Show actionable error messages in toasts

### 20. Add empty search state
**Status:** Pending
**Priority:** Low

Task search shows "Can't find your task!" but doesn't suggest clearing filters or creating a new task.

**Implementation:**
- Show "No results for [query]" with clear button
- Suggest creating new task with search term as title
- Show recent tasks as alternative
