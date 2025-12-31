import { db } from "./index";
import { tasks, tags, tagTasks, type NewTask, type NewTag } from "./schema";
import { eq } from "drizzle-orm";

export const tasksDb = {
  // Tasks
  async getTasks() {
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
      })
      .from(tasks);

    // Get tags for each task
    const tasksWithTags = await Promise.all(
      result.map(async (task) => {
        const taskTags = await db
          .select({ id: tags.id, title: tags.title })
          .from(tagTasks)
          .innerJoin(tags, eq(tagTasks.tagId, tags.id))
          .where(eq(tagTasks.taskId, task.id));
        return { ...task, tags: taskTags };
      }),
    );

    return tasksWithTags;
  },

  async getTaskById(taskId: string) {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    return result[0] ?? null;
  },

  async createTask(data: NewTask) {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  },

  async updateTask(taskId: string, data: Partial<NewTask>) {
    const result = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    return result[0];
  },

  async deleteTask(taskId: string) {
    // Delete tag associations first
    await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning();
    return result[0];
  },

  async toggleTaskComplete(taskId: string, complete: boolean) {
    const result = await db
      .update(tasks)
      .set({
        completedAt: complete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();
    return result[0];
  },

  async updateTaskDueDate(taskId: string, dueAt: Date | null) {
    const result = await db
      .update(tasks)
      .set({ dueAt, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    return result[0];
  },

  // Tags
  async getTags() {
    return db.select().from(tags);
  },

  async getTagById(tagId: string) {
    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);
    return result[0] ?? null;
  },

  async createTag(data: NewTag) {
    const result = await db.insert(tags).values(data).returning();
    return result[0];
  },

  async updateTag(tagId: string, title: string) {
    const result = await db
      .update(tags)
      .set({ title })
      .where(eq(tags.id, tagId))
      .returning();
    return result[0];
  },

  async deleteTag(tagId: string) {
    // Delete tag associations first
    await db.delete(tagTasks).where(eq(tagTasks.tagId, tagId));
    const result = await db.delete(tags).where(eq(tags.id, tagId)).returning();
    return result[0];
  },

  // Tag-Task associations
  async updateTaskTags(taskId: string, tagIds: string[]) {
    // Delete existing associations
    await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));

    // Insert new associations
    if (tagIds.length > 0) {
      await db
        .insert(tagTasks)
        .values(tagIds.map((tagId) => ({ taskId, tagId })));
    }

    return this.getTaskById(taskId);
  },
};
