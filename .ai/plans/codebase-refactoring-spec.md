# Codebase Refactoring Specification

> Generated: 2025-12-30
> Status: Draft
> Scope: Full codebase refactoring opportunities

## Overview

This document outlines refactoring opportunities identified through comprehensive codebase analysis. The current architecture uses Next.js App Router with TanStack Query, Drizzle ORM, and PostgreSQL - a solid foundation that can be improved in several areas.

---

## Table of Contents

1. [Type System](#1-type-system-fragmentation)
2. [State Management](#2-duplicate-local-state-anti-pattern)
3. [Query Hooks](#3-redundant-mutation-hooks)
4. [Optimistic Updates](#4-missing-optimistic-updates)
5. [Database Performance](#5-n1-query-in-database-layer)
6. [Calendar Context](#6-calendar-context-wrapper-is-unnecessary)
7. [Error Handling](#7-inconsistent-error-handling)
8. [Input Validation](#8-no-input-validation-on-api-routes)
9. [Authentication](#9-authentication-is-stubbed)
10. [UI Components](#10-massive-ui-component-library)
11. [Loading States](#11-no-loadingerror-boundaries)
12. [Dependencies](#12-unused-dependencies)
13. [Naming Conventions](#13-mixed-naming-conventions)
14. [API Client](#14-no-api-client-abstraction)
15. [Prop Drilling](#15-prop-drilling-in-task-components)
16. [Pagination](#16-no-paginationvirtualization)
17. [Database Indexes](#17-missing-database-indexes)
18. [Soft Delete](#18-no-soft-delete-consistency)
19. [Calendar Sync](#19-calendar-sync-is-synchronous)
20. [Query Keys](#20-no-query-key-factory)
21. [Dead Code](#21-dead-code-from-previous-architecture)
22. [Request Batching](#22-no-request-deduplication)
23. [Zustand Usage](#23-zustand-stores-are-underutilized)
24. [DevTools](#24-no-react-query-devtools)
25. [Server Imports](#25-server-only-import-pattern-could-be-cleaner)

---

## Refactoring Items

### 1. Type System Fragmentation

**Priority:** High
**Effort:** Medium
**Files Affected:**
- `src/db/schema.ts`
- `src/types/tasks.ts`
- `src/types/*.ts`
- `src/hooks/use-tasks.ts`

**Problem:**

Types are defined in 3 different places with inconsistencies:

```typescript
// src/db/schema.ts - Drizzle inferred types
export type Task = typeof tasks.$inferSelect;
// Fields: createdAt, dueAt (camelCase)

// src/types/tasks.ts - Zod schemas
export const TaskSchema = z.object({
  created_at: z.string().datetime(),
  due_at: z.string().datetime().optional(),
  // Fields: snake_case
});

// src/hooks/use-tasks.ts - Interface definitions
interface TaskWithTags extends Task {
  tags: { id: string; title: string }[];
}
```

**Impact:**
- Type mismatches between layers
- Confusion about source of truth
- Potential runtime errors from serialization

**Solution:**

1. Use Drizzle's `$inferSelect` as the single source of truth
2. Create extended types in one location (`src/types/index.ts`)
3. Use Zod only at API boundaries for runtime validation
4. Remove duplicate type definitions

```typescript
// src/types/index.ts
import type { Task as DrizzleTask, Tag as DrizzleTag } from "@/db/schema";

export type Task = DrizzleTask & {
  tags?: Pick<DrizzleTag, "id" | "title">[];
};

// src/lib/validations/tasks.ts (for API input validation only)
export const createTaskSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});
```

---

### 2. Duplicate Local State Anti-Pattern

**Priority:** High
**Effort:** Low
**Files Affected:**
- `src/components/tasks/task-list.tsx`

**Problem:**

Component copies TanStack Query data into local useState, then manually updates on mutations:

```typescript
// src/components/tasks/task-list.tsx:34-35
const [tasks, setTasks] = useState(initialTasks);
const [tags, setTags] = useState(initialTags);

// Then manually syncs on mutations (lines 55-67, 78-85)
const handleToggleTask = async (task: Task) => {
  toggleTask.mutate({ taskId: task.id, completed: newCompleted });
  setTasks((prev) =>
    prev.map((t) =>
      t.id === task.id
        ? { ...t, completedAt: newCompleted ? new Date().toISOString() : null }
        : t
    )
  );
};
```

**Impact:**
- Data gets out of sync between local state and query cache
- Defeats TanStack Query's cache management
- Double source of truth leads to bugs

**Solution:**

Remove local state, use query data directly, implement proper optimistic updates:

```typescript
const TaskList: React.FC = () => {
  const { data: tasksData } = useTasks();
  const { data: tagsData } = useTags();
  const toggleTask = useToggleTask();

  const tasks = tasksData?.tasks ?? [];
  const tags = tagsData?.tags ?? [];

  const handleToggleTask = (task: Task) => {
    toggleTask.mutate({ taskId: task.id, completed: !task.completedAt });
    // Optimistic update handled in hook's onMutate
  };

  // ... rest of component
};
```

---

### 3. Redundant Mutation Hooks

**Priority:** Medium
**Effort:** Low
**Files Affected:**
- `src/hooks/use-tasks.ts`

**Problem:**

Four separate hooks that all do the same thing - PUT to `/api/tasks/[taskId]`:

```typescript
export function useUpdateTask() { ... }      // lines 58-75
export function useToggleTask() { ... }      // lines 94-111
export function useUpdateTaskDueDate() { ... } // lines 113-130
export function useUpdateTaskTags() { ... }  // lines 132-149
```

**Impact:**
- Code duplication (~80 lines)
- Maintenance burden
- Inconsistent patterns

**Solution:**

Single `useUpdateTask` hook with proper typing:

```typescript
type TaskUpdate = {
  taskId: string;
  title?: string;
  body?: string;
  dueAt?: string | null;
  completed?: boolean;
  tags?: string[];
};

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<TaskResponse, Error, TaskUpdate>({
    mutationFn: async ({ taskId, ...data }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onMutate: async (update) => {
      // Optimistic update logic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
```

---

### 4. Missing Optimistic Updates

**Priority:** High
**Effort:** Medium
**Files Affected:**
- `src/hooks/use-tasks.ts`
- `src/hooks/use-notes.ts`
- `src/hooks/use-calendar.ts`
- `src/hooks/use-goals.ts`

**Problem:**

All mutations wait for server response before updating UI:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
}
```

**Impact:**
- Sluggish UX (user waits for network round-trip)
- Unnecessary loading states
- Poor perceived performance

**Solution:**

Add `onMutate` for optimistic updates with rollback in `onError`:

```typescript
export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, completed }) => { ... },

    onMutate: async ({ taskId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<TasksResponse>(["tasks"]);

      // Optimistically update
      queryClient.setQueryData<TasksResponse>(["tasks"], (old) => ({
        tasks: old?.tasks.map((t) =>
          t.id === taskId
            ? { ...t, completedAt: completed ? new Date().toISOString() : null }
            : t
        ) ?? [],
      }));

      return { previousTasks };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

---

### 5. N+1 Query in Database Layer

**Priority:** High
**Effort:** Medium
**Files Affected:**
- `src/db/tasks.ts`

**Problem:**

Fetches tags with N+1 queries:

```typescript
// src/db/tasks.ts:29-40
const tasksWithTags = await Promise.all(
  result.map(async (task) => {
    const taskTags = await db
      .select({ id: tags.id, title: tags.title })
      .from(tagTasks)
      .innerJoin(tags, eq(tagTasks.tagId, tags.id))
      .where(eq(tagTasks.taskId, task.id));
    return { ...task, tags: taskTags };
  })
);
```

**Impact:**
- Poor performance at scale (100 tasks = 101 queries)
- Unnecessary database load
- Slow page loads

**Solution:**

Use a single query with proper JOINs:

```typescript
async getTasks() {
  const result = await db
    .select({
      task: tasks,
      tag: {
        id: tags.id,
        title: tags.title,
      },
    })
    .from(tasks)
    .leftJoin(tagTasks, eq(tasks.id, tagTasks.taskId))
    .leftJoin(tags, eq(tagTasks.tagId, tags.id))
    .where(isNull(tasks.deletedAt));

  // Group tags by task
  const taskMap = new Map<string, TaskWithTags>();
  for (const row of result) {
    if (!taskMap.has(row.task.id)) {
      taskMap.set(row.task.id, { ...row.task, tags: [] });
    }
    if (row.tag?.id) {
      taskMap.get(row.task.id)!.tags.push(row.tag);
    }
  }

  return Array.from(taskMap.values());
}
```

Or use Drizzle's relational queries:

```typescript
async getTasks() {
  return db.query.tasks.findMany({
    with: {
      tagTasks: {
        with: {
          tag: true,
        },
      },
    },
    where: isNull(tasks.deletedAt),
  });
}
```

---

### 6. Calendar Context Wrapper is Unnecessary

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/store/calendar-context.tsx`
- `src/components/calendar/*.tsx`

**Problem:**

`calendar-context.tsx` wraps TanStack Query hooks in React Context:

```typescript
export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: calendarsData } = useCalendars();
  const { data: events = [] } = useMultiCalendarEvents(...);

  const createEvent = useCallback(async (...) => {
    await createEventMutation.mutateAsync(...);
  }, [createEventMutation]);

  // ... wraps everything in context
};
```

**Impact:**
- Extra re-renders when any context value changes
- Duplicate abstraction layer over TanStack Query
- Tight coupling between calendar components
- Harder to test

**Solution:**

1. Use TanStack Query hooks directly in components
2. Move UI state to Zustand or component state
3. Remove the context wrapper

```typescript
// src/store/calendar.ts (Zustand for UI state only)
export const useCalendarStore = create<CalendarUIState>((set) => ({
  selectedEvent: null,
  visibleCalendars: new Set<string>(),
  currentWeekStartDate: new Date(),

  setSelectedEvent: (event) => set({ selectedEvent: event }),
  toggleCalendarVisibility: (id) => set((state) => {
    const next = new Set(state.visibleCalendars);
    next.has(id) ? next.delete(id) : next.add(id);
    return { visibleCalendars: next };
  }),
}));

// Components use hooks directly
function CalendarGrid() {
  const { visibleCalendars, currentWeekStartDate } = useCalendarStore();
  const { data: events } = useMultiCalendarEvents(
    Array.from(visibleCalendars),
    timeMin,
    timeMax
  );
  // ...
}
```

---

### 7. Inconsistent Error Handling

**Priority:** High
**Effort:** Medium
**Files Affected:**
- `src/app/api/**/*.ts` (all API routes)

**Problem:**

API routes catch errors but return generic messages:

```typescript
catch (error) {
  console.error("Failed to fetch tasks:", error);
  return NextResponse.json(
    { error: "Failed to fetch tasks" },
    { status: 500 }
  );
}
```

No error details, no error codes, no structured error responses.

**Impact:**
- Poor debugging experience
- Bad user experience (no actionable error info)
- No error recovery strategies

**Solution:**

Create error handling utility with structured responses:

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        }
      },
      { status: error.status }
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}

// Usage in API route
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    const tasks = await tasksDb.getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 8. No Input Validation on API Routes

**Priority:** High
**Effort:** Medium
**Files Affected:**
- `src/app/api/**/*.ts`

**Problem:**

API routes trust client input without validation:

```typescript
const body = await request.json();
const { title, body: taskBody, dueAt } = body;

if (!title || title.trim() === "") {
  return NextResponse.json({ error: "Title is required" }, { status: 400 });
}
```

Manual validation is incomplete and inconsistent.

**Impact:**
- Security vulnerabilities (injection, invalid data)
- Data integrity issues
- Runtime errors from malformed input

**Solution:**

Use Zod schemas at API boundaries:

```typescript
// src/lib/validations/tasks.ts
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  body: z.string().max(10000).optional(),
  dueAt: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(10000).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string().uuid()).optional(),
});

// src/app/api/tasks/route.ts
import { createTaskSchema } from "@/lib/validations/tasks";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Invalid input",
        400,
        { errors: parsed.error.flatten() }
      );
    }

    const task = await tasksDb.createTask({
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 9. Authentication is Stubbed

**Priority:** High
**Effort:** High
**Files Affected:**
- `src/lib/auth.ts`
- `src/lib/auth-constants.ts`
- `src/middleware.ts`
- All API routes

**Problem:**

Authentication always returns a dev user:

```typescript
// src/lib/auth.ts
export async function getUser(): Promise<User | null> {
  return DEV_USER; // Always returns dev user
}
```

**Impact:**
- No real authentication
- Security vulnerability if deployed
- No multi-user support

**Solution:**

Implement proper authentication using a proven library:

**Option A: NextAuth.js (Auth.js)**
```typescript
// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
```

**Option B: Clerk**
```typescript
// src/lib/auth.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
}
```

**Option C: Lucia Auth (lightweight)**
```typescript
// src/lib/auth.ts
import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";

export async function getUser() {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value;
  if (!sessionId) return null;

  const { user } = await lucia.validateSession(sessionId);
  return user;
}
```

---

### 10. Massive UI Component Library

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `src/components/ui/*.tsx` (70+ files)

**Problem:**

70+ UI components, many likely unused:
- `carousel.tsx`, `menubar.tsx`, `navigation-menu.tsx`
- `month-range-picker.tsx`, `chart-currency.tsx`
- 7 magicui components
- Various form components

**Impact:**
- Bundle size increase
- Maintenance overhead
- Unused code complexity

**Solution:**

1. Audit component usage:
```bash
# Find unused components
for file in src/components/ui/*.tsx; do
  name=$(basename "$file" .tsx)
  count=$(grep -r "from.*ui/$name" src --include="*.tsx" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "Unused: $file"
  fi
done
```

2. Remove unused components
3. Ensure proper tree-shaking in build config
4. Consider lazy loading for heavy components (chart, carousel)

---

### 11. No Loading/Error Boundaries

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/app/(sidebar)/tasks/page.tsx`
- `src/app/(sidebar)/notes/page.tsx`
- `src/app/(sidebar)/calendar/page.tsx`
- `src/app/(sidebar)/layout.tsx`

**Problem:**

Pages have basic inline loading states:

```typescript
if (tasksLoading || tagsLoading) {
  return (
    <div className="flex items-center justify-center h-full">
      Loading...
    </div>
  );
}
```

No Suspense boundaries, no error boundaries, no skeleton states.

**Impact:**
- Poor UX during loading
- No graceful error recovery
- Content layout shift

**Solution:**

1. Add Error Boundary component:
```typescript
// src/components/error-boundary.tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-red-500">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

2. Add Skeleton components:
```typescript
// src/components/skeletons/task-list-skeleton.tsx
export function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}
```

3. Use in pages:
```typescript
// src/app/(sidebar)/tasks/page.tsx
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";

export default function TasksPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

### 12. Unused Dependencies

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `package.json`

**Problem:**

Several dependencies appear unused based on codebase analysis:

| Package | Purpose | Status |
|---------|---------|--------|
| `@novu/headless` | Notifications | Not found in code |
| `@team-plain/typescript-sdk` | Support tool | Not found in code |
| `loops` | Email marketing | Not found in code |
| `resend` | Email API | Not found in code |
| `dub` | Link shortener | Minimal usage |
| `ai` + `@ai-sdk/openai` | AI features | Not found in code |
| `tus-js-client` | File uploads | Not found in code |
| `react-pdf` | PDF rendering | Not found in code |

**Impact:**
- Larger bundle size
- Increased security surface area
- Dependency update burden

**Solution:**

1. Verify usage with search:
```bash
bun why @novu/headless
grep -r "@novu" src/
```

2. Remove unused packages:
```bash
bun remove @novu/headless @team-plain/typescript-sdk loops resend tus-js-client react-pdf
```

3. Audit remaining packages periodically

---

### 13. Mixed Naming Conventions

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/db/schema.ts`
- `src/types/*.ts`
- All API routes and components

**Problem:**

Inconsistent casing across layers:

| Layer | Convention | Example |
|-------|------------|---------|
| Database columns | snake_case | `created_at` |
| Drizzle schema | camelCase | `createdAt` |
| Types file | snake_case | `created_at` |
| API responses | camelCase | `createdAt` |
| Frontend | camelCase | `createdAt` |

**Impact:**
- Confusion when working across layers
- Mapping bugs
- Serialization inconsistencies

**Solution:**

Standardize on camelCase throughout, use Drizzle's column mapping:

```typescript
// src/db/schema.ts
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Drizzle automatically maps createdAt <-> created_at
});
```

Remove snake_case from types files, ensure all types use camelCase.

---

### 14. No API Client Abstraction

**Priority:** Medium
**Effort:** Low
**Files Affected:**
- `src/hooks/use-tasks.ts`
- `src/hooks/use-notes.ts`
- `src/hooks/use-calendar.ts`
- `src/hooks/use-goals.ts`

**Problem:**

Every hook duplicates fetch logic:

```typescript
const response = await fetch("/api/tasks");
if (!response.ok) throw new Error("Failed to fetch tasks");
return response.json();
```

**Impact:**
- Code duplication across 15+ hooks
- No centralized error handling
- No request interceptors (auth headers, logging)
- No response interceptors

**Solution:**

Create typed API client:

```typescript
// src/lib/api/client.ts
class ApiClient {
  private baseUrl = "/api";

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error?.code ?? "REQUEST_FAILED",
        error.error?.message ?? `Request failed: ${response.status}`,
        response.status
      );
    }

    return response.json();
  }

  // Tasks
  tasks = {
    list: () => this.request<TasksResponse>("/tasks"),
    get: (id: string) => this.request<TaskResponse>(`/tasks/${id}`),
    create: (data: CreateTaskInput) =>
      this.request<TaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTaskInput) =>
      this.request<TaskResponse>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  };

  // Notes, Calendar, etc...
}

export const api = new ApiClient();

// Usage in hooks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => api.tasks.list(),
  });
}
```

---

### 15. Prop Drilling in Task Components

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/components/tasks/task-list.tsx`
- `src/components/tasks/task-header.tsx`
- `src/components/tasks/task-list-container.tsx`

**Problem:**

`TaskList` passes 15+ props through multiple component layers:

```typescript
<TaskListHeader
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  handleTaskCreated={handleCreateTask}
  tags={tags}
  selectedTags={selectedTags}
  handleTagSelect={handleTagSelect}
  newTagTitle={newTagTitle}
  setNewTagTitle={setNewTagTitle}
  handleCreateTag={handleCreateTag}
  handleDeleteTag={handleDeleteTag}
  handleEditTag={handleEditTag}
  handleSaveTag={handleSaveTag}
  isEditingTag={isEditingTag}
  editTagTitle={editTagTitle}
  setEditTagTitle={setEditTagTitle}
/>
```

**Impact:**
- Tight coupling between components
- Refactoring difficulty
- Testing complexity

**Solution:**

1. Use Zustand for shared UI state:
```typescript
// src/store/task-ui.ts
interface TaskUIState {
  searchQuery: string;
  selectedTags: string[];
  editingTagId: string | null;

  setSearchQuery: (query: string) => void;
  toggleTag: (tagId: string) => void;
  setEditingTag: (id: string | null) => void;
}

export const useTaskUIStore = create<TaskUIState>((set) => ({
  searchQuery: "",
  selectedTags: [],
  editingTagId: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleTag: (tagId) => set((state) => ({
    selectedTags: state.selectedTags.includes(tagId)
      ? state.selectedTags.filter((id) => id !== tagId)
      : [...state.selectedTags, tagId],
  })),
  setEditingTag: (editingTagId) => set({ editingTagId }),
}));
```

2. Components access store directly:
```typescript
function TaskListHeader() {
  const { searchQuery, setSearchQuery } = useTaskUIStore();
  const { data: tagsData } = useTags();
  const createTag = useCreateTag();

  // Component logic without prop drilling
}
```

---

### 16. No Pagination/Virtualization

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/db/tasks.ts`
- `src/app/api/tasks/route.ts`
- `src/hooks/use-tasks.ts`
- `src/components/tasks/task-list.tsx`

**Problem:**

`getTasks()` fetches all tasks, renders in a list without virtualization.

**Impact:**
- Performance degradation with large datasets
- Memory issues with 1000+ tasks
- Slow initial page load

**Solution:**

1. Add cursor-based pagination to API:
```typescript
// src/db/tasks.ts
async getTasks(options: { cursor?: string; limit?: number } = {}) {
  const { cursor, limit = 50 } = options;

  let query = db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))
    .limit(limit + 1); // Fetch one extra to check for next page

  if (cursor) {
    query = query.where(lt(tasks.createdAt, new Date(cursor)));
  }

  const results = await query;
  const hasNextPage = results.length > limit;
  const items = hasNextPage ? results.slice(0, -1) : results;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].createdAt.toISOString() : null,
  };
}
```

2. Use infinite query:
```typescript
export function useTasks() {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: ({ pageParam }) => api.tasks.list({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}
```

3. Add virtualization:
```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function TaskList({ tasks }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <TaskItem
            key={tasks[virtualRow.index].id}
            task={tasks[virtualRow.index]}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 17. Missing Database Indexes

**Priority:** Medium
**Effort:** Low
**Files Affected:**
- `src/db/schema.ts`

**Problem:**

Schema has no explicit indexes on commonly queried fields:
- `tasks.createdBy` - fetching user's tasks
- `tasks.completedAt` - filtering incomplete tasks
- `notes.folderId` - notes in a folder
- `calendarEvents.calendarId` + time range

**Impact:**
- Slow queries at scale
- Full table scans
- Database performance degradation

**Solution:**

Add indexes to schema:

```typescript
import { index } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  // ... columns
}, (table) => ({
  createdByIdx: index("tasks_created_by_idx").on(table.createdBy),
  completedAtIdx: index("tasks_completed_at_idx").on(table.completedAt),
  dueDateIdx: index("tasks_due_at_idx").on(table.dueAt),
}));

export const notes = pgTable("notes", {
  // ... columns
}, (table) => ({
  folderIdIdx: index("notes_folder_id_idx").on(table.folderId),
  userIdIdx: index("notes_user_id_idx").on(table.userId),
}));

export const calendarEvents = pgTable("calendar_events", {
  // ... columns
}, (table) => ({
  calendarTimeIdx: index("calendar_events_calendar_time_idx")
    .on(table.calendarId, table.startTime),
}));
```

Then run migration:
```bash
bun run db:generate
bun run db:migrate
```

---

### 18. No Soft Delete Consistency

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `src/db/schema.ts`
- `src/db/tasks.ts`

**Problem:**

`tasks` table has `deletedAt`/`deletedBy` columns, but:
- `deleteTask()` performs hard delete
- No filtering of deleted items in queries
- Pattern is inconsistent across tables

```typescript
// Hard delete despite having deletedAt column
async deleteTask(taskId: string) {
  await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));
  const result = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
  return result[0];
}
```

**Impact:**
- Data loss (no recovery)
- Missing audit trail
- Inconsistent behavior

**Solution:**

Either implement soft delete consistently:

```typescript
async deleteTask(taskId: string, userId: string) {
  const result = await db
    .update(tasks)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
    })
    .where(eq(tasks.id, taskId))
    .returning();
  return result[0];
}

async getTasks() {
  return db
    .select()
    .from(tasks)
    .where(isNull(tasks.deletedAt)); // Filter deleted
}
```

Or remove the unused columns:

```typescript
// Remove from schema
export const tasks = pgTable("tasks", {
  // Remove: deletedAt, deletedBy
});
```

---

### 19. Calendar Sync is Synchronous

**Priority:** Medium
**Effort:** High
**Files Affected:**
- `src/app/api/calendar/sync/route.ts`
- `src/db/calendar.ts`

**Problem:**

`/api/calendar/sync` does full sync in the request handler:

```typescript
export async function POST() {
  // Fetches all calendars
  // Fetches all events for each calendar
  // Inserts/updates everything
  // All in one request
}
```

**Impact:**
- Request timeouts for large calendars
- Poor UX (user waits)
- Blocks server resources

**Solution:**

Move to background job using Inngest or similar:

```typescript
// src/lib/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "map-ai" });

// src/lib/inngest/functions.ts
export const syncCalendars = inngest.createFunction(
  { id: "sync-calendars" },
  { event: "calendar/sync.requested" },
  async ({ event, step }) => {
    const { userId } = event.data;

    const calendars = await step.run("fetch-calendars", async () => {
      return calendarDb.getCalendarAccounts(userId);
    });

    for (const calendar of calendars) {
      await step.run(`sync-calendar-${calendar.id}`, async () => {
        return syncSingleCalendar(calendar);
      });
    }

    return { synced: calendars.length };
  }
);

// src/app/api/calendar/sync/route.ts
export async function POST() {
  const user = await requireUser();

  // Trigger background job
  await inngest.send({
    name: "calendar/sync.requested",
    data: { userId: user.id },
  });

  return NextResponse.json({ status: "sync_started" });
}
```

---

### 20. No Query Key Factory

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `src/hooks/use-tasks.ts`
- `src/hooks/use-notes.ts`
- `src/hooks/use-calendar.ts`
- `src/hooks/use-goals.ts`

**Problem:**

Query keys are scattered strings:

```typescript
queryKey: ["tasks"]
queryKey: ["tags"]
queryKey: ["events", calendarId, timeMin, timeMax]
queryKey: ["notes", noteId]
```

**Impact:**
- Typo risk
- Refactoring difficulty
- Inconsistent invalidation patterns

**Solution:**

Create query key factory:

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    detail: (id: string) => ["tasks", id] as const,
  },
  tags: {
    all: ["tags"] as const,
    detail: (id: string) => ["tags", id] as const,
  },
  notes: {
    all: ["notes"] as const,
    detail: (id: string) => ["notes", id] as const,
    byFolder: (folderId: string) => ["notes", "folder", folderId] as const,
  },
  folders: {
    all: ["folders"] as const,
  },
  calendars: {
    all: ["calendars"] as const,
    colors: ["calendar-colors"] as const,
  },
  events: {
    all: ["events"] as const,
    byCalendar: (calendarId: string, timeMin: string, timeMax: string) =>
      ["events", calendarId, timeMin, timeMax] as const,
    multi: (calendarIds: string[], timeMin: string, timeMax: string) =>
      ["events", "multi", calendarIds.sort().join(","), timeMin, timeMax] as const,
  },
  goals: {
    all: ["goals"] as const,
    stats: ["goals", "stats"] as const,
  },
} as const;

// Usage
useQuery({
  queryKey: queryKeys.tasks.all,
  queryFn: () => api.tasks.list(),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
```

---

### 21. Dead Code from Previous Architecture

**Priority:** Low
**Effort:** Low
**Files Affected:**
- Various files with stale imports

**Problem:**

Git status shows many deleted files from previous architecture:
- Whoop integration (`/api/whoop/`)
- Insights widget
- Desktop command menu
- Various unused components

**Impact:**
- Confusion about what's active
- Potential import errors
- Stale references

**Solution:**

1. Search for references to deleted files:
```bash
grep -r "whoop" src/
grep -r "insights" src/
grep -r "desktop-command" src/
```

2. Clean up any remaining references
3. Verify build succeeds
4. Commit clean state

---

### 22. No Request Deduplication

**Priority:** Medium
**Effort:** Medium
**Files Affected:**
- `src/hooks/use-calendar.ts`

**Problem:**

`useMultiCalendarEvents` fires parallel requests for each calendar:

```typescript
await Promise.all(
  calendarIds.map(async (calendarId) => {
    const response = await fetch(`/api/calendar/events?${params}`);
    // ...
  })
);
```

**Impact:**
- Excessive API calls (10 calendars = 10 requests)
- Rate limiting issues with Google Calendar API
- Network overhead

**Solution:**

Create batch endpoint:

```typescript
// src/app/api/calendar/events/batch/route.ts
export async function POST(request: NextRequest) {
  const { calendarIds, timeMin, timeMax } = await request.json();

  const allEvents = await Promise.all(
    calendarIds.map((id) => calendarDb.getEvents(id, timeMin, timeMax))
  );

  return NextResponse.json({
    events: allEvents.flat(),
  });
}

// Update hook
export function useMultiCalendarEvents(calendarIds: string[], timeMin: string, timeMax: string) {
  return useQuery({
    queryKey: queryKeys.events.multi(calendarIds, timeMin, timeMax),
    queryFn: async () => {
      const response = await fetch("/api/calendar/events/batch", {
        method: "POST",
        body: JSON.stringify({ calendarIds, timeMin, timeMax }),
      });
      return response.json();
    },
    enabled: calendarIds.length > 0,
  });
}
```

---

### 23. Zustand Stores are Underutilized

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `src/store/assistant.ts`
- `src/store/menu.ts`
- `src/store/tracker.ts`
- Various components using local state

**Problem:**

Project has Zustand but uses minimal stores while relying heavily on:
- Component local state
- React Context (calendar-context.tsx)
- Prop drilling

**Impact:**
- Inconsistent state management patterns
- Extra dependency if not used
- Missed opportunities for shared state

**Solution:**

Either:

**A. Commit to Zustand:**
- Move calendar UI state to Zustand (see #6)
- Move task UI state to Zustand (see #15)
- Keep TanStack Query for server state only

**B. Remove Zustand:**
- If stores are truly unused, remove dependency
- Use TanStack Query + component state only

---

### 24. No React Query DevTools

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `package.json`
- `src/app/providers.tsx`

**Problem:**

No `@tanstack/react-query-devtools` installed.

**Impact:**
- Harder debugging of cache state
- Can't inspect queries/mutations
- Difficult to diagnose stale data issues

**Solution:**

```bash
bun add -D @tanstack/react-query-devtools
```

```typescript
// src/app/providers.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

### 25. Server-Only Import Pattern Could be Cleaner

**Priority:** Low
**Effort:** Low
**Files Affected:**
- `src/lib/auth.ts`
- `src/lib/auth-constants.ts`

**Problem:**

Current pattern:
```typescript
// auth.ts
import "server-only";
export { DEV_USER_ID, DEV_USER, type User } from "./auth-constants";
```

Re-exporting from auth-constants could lead to accidental client imports.

**Impact:**
- Potential for importing server code on client
- Confusion about what's safe to import

**Solution:**

Separate server and shared exports clearly:

```typescript
// src/lib/auth/types.ts (shared - no server-only)
export interface User {
  id: string;
  email: string;
  // ...
}

// src/lib/auth/server.ts (server only)
import "server-only";
import type { User } from "./types";

export async function getUser(): Promise<User | null> { ... }
export async function requireUser(): Promise<User> { ... }

// src/lib/auth/index.ts (re-export for convenience)
export * from "./types";
export * from "./server";
```

---

## Priority Matrix

| Priority | Items | Focus Area |
|----------|-------|------------|
| **High** | #2, #4, #5, #7, #8, #9 | Data integrity, security, performance |
| **Medium** | #1, #3, #6, #11, #14, #15, #16, #17, #19, #22 | DX, maintainability, UX |
| **Low** | #10, #12, #13, #18, #20, #21, #23, #24, #25 | Cleanup, optimization |

## Recommended Implementation Order

### Phase 1: Critical Fixes
1. #9 - Authentication (security blocker)
2. #8 - Input validation (security)
3. #7 - Error handling (debugging)
4. #5 - N+1 queries (performance)

### Phase 2: Data Layer
5. #1 - Type consolidation
6. #2 - Remove duplicate state
7. #4 - Optimistic updates
8. #14 - API client

### Phase 3: UX Improvements
9. #11 - Loading/error boundaries
10. #4 - Optimistic updates
11. #16 - Pagination/virtualization

### Phase 4: Cleanup
12. #3 - Consolidate mutation hooks
13. #6 - Remove calendar context
14. #10, #12 - Remove unused code
15. #20 - Query key factory

---

## Notes

- Each item can be implemented independently
- Prioritize based on current pain points
- Some items have dependencies (e.g., #14 API client helps with #7 error handling)
- Consider feature flags for gradual rollout of breaking changes
