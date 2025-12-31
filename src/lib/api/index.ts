export type {
  CalendarsResponse,
  ColorsResponse,
  CreateTagInput,
  // Input types
  CreateTaskInput,
  EventsResponse,
  FolderResponse,
  FoldersResponse,
  GoalResponse,
  GoalStatsResponse,
  GoalsResponse,
  NoteResponse,
  NotesResponse,
  SyncResponse,
  TagResponse,
  TagsResponse,
  TaskResponse,
  TasksResponse,
  // Response types
  TaskWithTags,
  UpdateTagInput,
  UpdateTaskInput,
} from "./client";
export { api } from "./client";
export {
  ApiError,
  badRequest,
  conflict,
  type ErrorCode,
  ErrorCodes,
  forbidden,
  handleApiError,
  notFound,
  unauthorized,
  validationError,
} from "./errors";
export { useOptimisticMutation, useSimpleMutation } from "./mutation-factory";
export { queryKeys } from "./query-keys";
