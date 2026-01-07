import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const integrationProvider = v.union(
  v.literal("google"),
  v.literal("whoop"),
  v.literal("openai"),
  v.literal("claude"),
  v.literal("github"),
);

const goalCategory = v.union(
  v.literal("health"),
  v.literal("work"),
  v.literal("personal"),
  v.literal("family"),
  v.literal("spiritual"),
);

const goalStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

const taskStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

const chatRole = v.union(
  v.literal("system"),
  v.literal("user"),
  v.literal("assistant"),
  v.literal("tool"),
);

const messageStatus = v.union(
  v.literal("streaming"),
  v.literal("complete"),
  v.literal("error"),
);

const filePurpose = v.union(
  v.literal("attachment"),
  v.literal("avatar"),
  v.literal("import"),
);

export default defineSchema({
  users: defineTable({
    authSubject: v.string(),
    authProvider: v.string(),
    email: v.optional(v.string()),
    googleId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    locale: v.optional(v.string()),
    profilePhotoUrl: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_auth_subject", ["authSubject"])
    .index("by_email", ["email"])
    .index("by_google_id", ["googleId"]),

  preferences: defineTable({
    userId: v.id("users"),
    primaryTimeZone: v.optional(v.string()),
    preferredLocale: v.optional(v.string()),
    showWeekNumbers: v.optional(v.boolean()),
    dismissedWelcomeDialog: v.optional(v.boolean()),
    dismissedWelcomeChecklist: v.optional(v.boolean()),
    dismissedReferralCard: v.optional(v.boolean()),
    shownWelcomeDialog: v.optional(v.boolean()),
    autoAddConferencingPromptViewed: v.optional(v.boolean()),
    autoChangeTimeZonesPromptEnabled: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  folders: defineTable({
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  notes: defineTable({
    userId: v.id("users"),
    folderId: v.optional(v.id("folders")),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "folderId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId", "folderId"],
    }),

  projects: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    position: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_position", ["userId", "position"]),

  headers: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_title", ["userId", "title"]),

  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    status: taskStatus,
    position: v.optional(v.number()),
    headerId: v.optional(v.id("headers")),
    projectId: v.optional(v.id("projects")),
    assignedTo: v.optional(v.id("users")),
    blockedBy: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
    scheduledFor: v.optional(v.number()),
    result: v.optional(v.string()),
    actualDurationSeconds: v.optional(v.number()),
    estimatedDurationSeconds: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_due", ["userId", "dueAt"])
    .index("by_project", ["projectId"])
    .index("by_header", ["headerId"]),

  tags: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_title", ["userId", "title"]),

  taskTags: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_tag", ["tagId"])
    .index("by_user", ["userId"]),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    category: goalCategory,
    status: goalStatus,
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_category", ["userId", "category"]),

  integrations: defineTable({
    userId: v.id("users"),
    provider: integrationProvider,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scopes: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    externalUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  calendarAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    email: v.string(),
    externalAccountId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider"]),

  calendars: defineTable({
    userId: v.id("users"),
    accountId: v.id("calendarAccounts"),
    provider: v.string(),
    externalId: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    foregroundColor: v.optional(v.string()),
    colorId: v.optional(v.string()),
    selected: v.optional(v.boolean()),
    isPrimary: v.optional(v.boolean()),
    accessRole: v.optional(v.string()),
    timeZone: v.optional(v.string()),
    etag: v.optional(v.string()),
    kind: v.optional(v.string()),
    emoji: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_account", ["accountId"])
    .index("by_user", ["userId"])
    .index("by_external_id", ["externalId"]),

  calendarEvents: defineTable({
    userId: v.id("users"),
    calendarId: v.id("calendars"),
    externalId: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    colorId: v.optional(v.string()),
    status: v.optional(v.string()),
    creatorEmail: v.optional(v.string()),
    organizerEmail: v.optional(v.string()),
    etag: v.optional(v.string()),
    iCalUid: v.optional(v.string()),
    visibility: v.optional(v.string()),
    transparency: v.optional(v.string()),
    sequence: v.optional(v.number()),
    recurringEventId: v.optional(v.string()),
    originalStartTime: v.optional(v.string()),
    recurrence: v.optional(v.array(v.string())),
    guestsCanInviteOthers: v.optional(v.boolean()),
    guestsCanModify: v.optional(v.boolean()),
    guestsCanSeeOtherGuests: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_calendar", ["calendarId"])
    .index("by_calendar_start", ["calendarId", "startTime"])
    .index("by_user_start", ["userId", "startTime"])
    .index("by_external_id", ["externalId"])
    .index("by_calendar_external", ["calendarId", "externalId"]),

  calendarEventAttendees: defineTable({
    calendarId: v.id("calendars"),
    eventId: v.id("calendarEvents"),
    email: v.string(),
    displayName: v.optional(v.string()),
    responseStatus: v.optional(v.string()),
    isOrganizer: v.optional(v.boolean()),
    isSelf: v.optional(v.boolean()),
    optional: v.optional(v.boolean()),
    contactId: v.optional(v.id("contacts")),
  })
    .index("by_event", ["eventId"])
    .index("by_calendar", ["calendarId"])
    .index("by_email", ["email"]),

  calendarSyncTokens: defineTable({
    calendarId: v.id("calendars"),
    syncToken: v.string(),
    updatedAt: v.optional(v.number()),
  }).index("by_calendar", ["calendarId"]),

  syncLogs: defineTable({
    userId: v.optional(v.id("users")),
    provider: v.optional(v.string()),
    status: v.string(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider"]),

  contacts: defineTable({
    userId: v.id("users"),
    accountId: v.optional(v.id("calendarAccounts")),
    resourceName: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    etag: v.optional(v.string()),
    type: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_email", ["email"]),

  whoopCycles: defineTable({
    userId: v.id("users"),
    whoopUserId: v.string(),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    scoreState: v.string(),
    strain: v.optional(v.string()),
    kilojoule: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_whoop_user", ["whoopUserId"])
    .index("by_user_start", ["userId", "start"]),

  whoopRecovery: defineTable({
    userId: v.id("users"),
    cycleId: v.id("whoopCycles"),
    sleepId: v.optional(v.string()),
    whoopUserId: v.string(),
    scoreState: v.string(),
    recoveryScore: v.optional(v.number()),
    restingHeartRate: v.optional(v.string()),
    hrvRmssd: v.optional(v.string()),
    spo2Percentage: v.optional(v.string()),
    skinTempCelsius: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_cycle", ["cycleId"])
    .index("by_whoop_user", ["whoopUserId"]),

  whoopSleep: defineTable({
    userId: v.id("users"),
    whoopUserId: v.string(),
    cycleId: v.optional(v.id("whoopCycles")),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    isNap: v.optional(v.boolean()),
    scoreState: v.string(),
    totalInBedTime: v.optional(v.number()),
    totalAwakeTime: v.optional(v.number()),
    totalNoDataTime: v.optional(v.number()),
    totalLightSleepTime: v.optional(v.number()),
    totalSlowWaveSleepTime: v.optional(v.number()),
    totalRemSleepTime: v.optional(v.number()),
    sleepCycleCount: v.optional(v.number()),
    disturbanceCount: v.optional(v.number()),
    sleepNeeded: v.optional(v.number()),
    respiratoryRate: v.optional(v.string()),
    sleepPerformancePercentage: v.optional(v.string()),
    sleepConsistencyPercentage: v.optional(v.string()),
    sleepEfficiencyPercentage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_whoop_user", ["whoopUserId"])
    .index("by_user_start", ["userId", "start"]),

  whoopWorkouts: defineTable({
    userId: v.id("users"),
    whoopUserId: v.string(),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    sportId: v.optional(v.number()),
    sportName: v.optional(v.string()),
    scoreState: v.string(),
    strain: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
    kilojoule: v.optional(v.string()),
    distanceMeters: v.optional(v.string()),
    altitudeGainMeters: v.optional(v.string()),
    altitudeLossMeters: v.optional(v.string()),
    zoneZeroMs: v.optional(v.number()),
    zoneOneMs: v.optional(v.number()),
    zoneTwoMs: v.optional(v.number()),
    zoneThreeMs: v.optional(v.number()),
    zoneFourMs: v.optional(v.number()),
    zoneFiveMs: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_whoop_user", ["whoopUserId"])
    .index("by_user_start", ["userId", "start"]),

  whoopProfiles: defineTable({
    userId: v.id("users"),
    whoopUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    heightMeter: v.optional(v.string()),
    weightKilogram: v.optional(v.string()),
    maxHeartRate: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_whoop_user", ["whoopUserId"]),

  appleHealthConnections: defineTable({
    userId: v.id("users"),
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  appleHealthData: defineTable({
    userId: v.id("users"),
    date: v.string(),
    steps: v.optional(v.number()),
    activeEnergy: v.optional(v.number()),
    basalEnergy: v.optional(v.number()),
    exerciseMinutes: v.optional(v.number()),
    standMinutes: v.optional(v.number()),
    distanceMiles: v.optional(v.number()),
    flightsClimbed: v.optional(v.number()),
    restingHeartRate: v.optional(v.number()),
    hrvSDNN: v.optional(v.number()),
    walkingHeartRate: v.optional(v.number()),
    vo2Max: v.optional(v.number()),
    oxygenSaturation: v.optional(v.number()),
    respiratoryRate: v.optional(v.number()),
    bodyWeight: v.optional(v.number()),
    bodyFatPercentage: v.optional(v.number()),
    leanBodyMass: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    sleepAwakeHours: v.optional(v.number()),
    sleepRemHours: v.optional(v.number()),
    sleepCoreHours: v.optional(v.number()),
    sleepDeepHours: v.optional(v.number()),
    sleepInBedHours: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  chatThreads: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_last_message", ["userId", "lastMessageAt"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    threadId: v.id("chatThreads"),
    role: chatRole,
    content: v.string(),
    status: messageStatus,
    model: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_thread", ["threadId"])
    .index("by_user", ["userId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "threadId"],
    }),

  chatFiles: defineTable({
    userId: v.id("users"),
    threadId: v.optional(v.id("chatThreads")),
    messageId: v.optional(v.id("chatMessages")),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
    purpose: filePurpose,
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"])
    .index("by_message", ["messageId"]),
});
