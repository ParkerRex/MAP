import { and, eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { type NewTag, type NewTask, tags, tagTasks, tasks } from "./schema";

export interface TaskWithTags {
  id: string;
  title: string;
  body: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  taskStatus: "pending" | "in_progress" | "completed" | null;
  taskPosition: number | null;
  headerId: string | null;
  projectId: string | null;
  assignedTo: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  blockedBy: string | null;
  contactId: string | null;
  scheduledFor: Date | null;
  result: string | null;
  actualDuration: string | null;
  estimatedDuration: string | null;
  tags: { id: string; title: string }[];
}

export const tasksDb = {
  async getTasks(userId: string): Promise<TaskWithTags[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        body: tasks.body,
        dueAt: tasks.dueAt,
        completedAt: tasks.completedAt,
        completedBy: tasks.completedBy,
        createdAt: tasks.createdAt,
        createdBy: tasks.createdBy,
        updatedAt: tasks.updatedAt,
        updatedBy: tasks.updatedBy,
        taskStatus: tasks.taskStatus,
        taskPosition: tasks.taskPosition,
        headerId: tasks.headerId,
        projectId: tasks.projectId,
        assignedTo: tasks.assignedTo,
        deletedAt: tasks.deletedAt,
        deletedBy: tasks.deletedBy,
        blockedBy: tasks.blockedBy,
        contactId: tasks.contactId,
        scheduledFor: tasks.scheduledFor,
        result: tasks.result,
        actualDuration: tasks.actualDuration,
        estimatedDuration: tasks.estimatedDuration,
        tagId: tags.id,
        tagTitle: tags.title,
      })
      .from(tasks)
      .leftJoin(tagTasks, eq(tasks.id, tagTasks.taskId))
      .leftJoin(tags, eq(tagTasks.tagId, tags.id))
      .where(and(eq(tasks.createdBy, userId), isNull(tasks.deletedAt)));

    const taskMap = new Map<string, TaskWithTags>();

    for (const row of result) {
      if (!taskMap.has(row.id)) {
        taskMap.set(row.id, {
          id: row.id,
          title: row.title,
          body: row.body,
          dueAt: row.dueAt,
          completedAt: row.completedAt,
          completedBy: row.completedBy,
          createdAt: row.createdAt,
          createdBy: row.createdBy,
          updatedAt: row.updatedAt,
          updatedBy: row.updatedBy,
          taskStatus: row.taskStatus,
          taskPosition: row.taskPosition,
          headerId: row.headerId,
          projectId: row.projectId,
          assignedTo: row.assignedTo,
          deletedAt: row.deletedAt,
          deletedBy: row.deletedBy,
          blockedBy: row.blockedBy,
          contactId: row.contactId,
          scheduledFor: row.scheduledFor,
          result: row.result,
          actualDuration: row.actualDuration,
          estimatedDuration: row.estimatedDuration,
          tags: [],
        });
      }

      if (row.tagId && row.tagTitle) {
        taskMap.get(row.id)!.tags.push({
          id: row.tagId,
          title: row.tagTitle,
        });
      }
    }

    return Array.from(taskMap.values());
  },

  async getTaskById(taskId: string, userId: string) {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async getTaskWithTags(taskId: string, userId: string): Promise<TaskWithTags | null> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        body: tasks.body,
        dueAt: tasks.dueAt,
        completedAt: tasks.completedAt,
        completedBy: tasks.completedBy,
        createdAt: tasks.createdAt,
        createdBy: tasks.createdBy,
        updatedAt: tasks.updatedAt,
        updatedBy: tasks.updatedBy,
        taskStatus: tasks.taskStatus,
        taskPosition: tasks.taskPosition,
        headerId: tasks.headerId,
        projectId: tasks.projectId,
        assignedTo: tasks.assignedTo,
        deletedAt: tasks.deletedAt,
        deletedBy: tasks.deletedBy,
        blockedBy: tasks.blockedBy,
        contactId: tasks.contactId,
        scheduledFor: tasks.scheduledFor,
        result: tasks.result,
        actualDuration: tasks.actualDuration,
        estimatedDuration: tasks.estimatedDuration,
        tagId: tags.id,
        tagTitle: tags.title,
      })
      .from(tasks)
      .leftJoin(tagTasks, eq(tasks.id, tagTasks.taskId))
      .leftJoin(tags, eq(tagTasks.tagId, tags.id))
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)));

    if (result.length === 0) return null;

    const task: TaskWithTags = {
      id: result[0].id,
      title: result[0].title,
      body: result[0].body,
      dueAt: result[0].dueAt,
      completedAt: result[0].completedAt,
      completedBy: result[0].completedBy,
      createdAt: result[0].createdAt,
      createdBy: result[0].createdBy,
      updatedAt: result[0].updatedAt,
      updatedBy: result[0].updatedBy,
      taskStatus: result[0].taskStatus,
      taskPosition: result[0].taskPosition,
      headerId: result[0].headerId,
      projectId: result[0].projectId,
      assignedTo: result[0].assignedTo,
      deletedAt: result[0].deletedAt,
      deletedBy: result[0].deletedBy,
      blockedBy: result[0].blockedBy,
      contactId: result[0].contactId,
      scheduledFor: result[0].scheduledFor,
      result: result[0].result,
      actualDuration: result[0].actualDuration,
      estimatedDuration: result[0].estimatedDuration,
      tags: [],
    };

    for (const row of result) {
      if (row.tagId && row.tagTitle) {
        task.tags.push({ id: row.tagId, title: row.tagTitle });
      }
    }

    return task;
  },

  async createTask(data: NewTask) {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  },

  async updateTask(taskId: string, userId: string, data: Partial<NewTask>) {
    const result = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)))
      .returning();
    return result[0] ?? null;
  },

  async deleteTask(taskId: string, userId: string) {
    // Verify ownership first
    const task = await this.getTaskById(taskId, userId);
    if (!task) return null;

    await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)))
      .returning();
    return result[0] ?? null;
  },

  async toggleTaskComplete(taskId: string, userId: string, complete: boolean) {
    const result = await db
      .update(tasks)
      .set({
        completedAt: complete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)))
      .returning();
    return result[0] ?? null;
  },

  async updateTaskDueDate(taskId: string, userId: string, dueAt: Date | null) {
    const result = await db
      .update(tasks)
      .set({ dueAt, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, userId)))
      .returning();
    return result[0] ?? null;
  },

  // Tags - user-scoped
  async getTags(userId: string) {
    return db.select().from(tags).where(eq(tags.userId, userId));
  },

  async getTagById(tagId: string, userId: string) {
    const result = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async createTag(data: NewTag) {
    const result = await db.insert(tags).values(data).returning();
    return result[0];
  },

  async updateTag(tagId: string, userId: string, title: string) {
    const result = await db
      .update(tags)
      .set({ title })
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async deleteTag(tagId: string, userId: string) {
    // Verify ownership first
    const tag = await this.getTagById(tagId, userId);
    if (!tag) return null;

    await db.delete(tagTasks).where(eq(tagTasks.tagId, tagId));
    const result = await db
      .delete(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async updateTaskTags(taskId: string, userId: string, tagIds: string[]) {
    // Verify task ownership first
    const task = await this.getTaskById(taskId, userId);
    if (!task) return null;

    await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));

    if (tagIds.length > 0) {
      await db.insert(tagTasks).values(tagIds.map((tagId) => ({ taskId, tagId })));
    }

    return this.getTaskWithTags(taskId, userId);
  },
};
