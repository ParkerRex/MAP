export { api } from "./client";
export {
  ApiError,
  ErrorCodes,
  type ErrorCode,
  handleApiError,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  validationError,
  conflict,
} from "./errors";
export { queryKeys } from "./query-keys";
export type {
  // Response types
  TaskWithTags,
  TasksResponse,
  TaskResponse,
  TagsResponse,
  TagResponse,
  NotesResponse,
  NoteResponse,
  FoldersResponse,
  FolderResponse,
  GoalsResponse,
  GoalResponse,
  GoalStatsResponse,
  EventsResponse,
  CalendarsResponse,
  ColorsResponse,
  SyncResponse,
  // Input types
  CreateTaskInput,
  UpdateTaskInput,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateGoalInput,
  UpdateGoalInput,
  CreateTagInput,
  UpdateTagInput,
} from "./client";
