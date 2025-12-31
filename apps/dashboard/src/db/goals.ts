import { db } from "./index";
import { goals, type NewGoal } from "./schema";
import { eq, and, sql } from "drizzle-orm";

export const goalsDb = {
  async getGoals(userId: string) {
    return db.select().from(goals).where(eq(goals.userId, userId));
  },

  async getGoalById(goalId: string) {
    const result = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
    return result[0] ?? null;
  },

  async createGoal(data: NewGoal) {
    const result = await db.insert(goals).values(data).returning();
    return result[0];
  },

  async updateGoal(goalId: string, data: Partial<NewGoal>) {
    const result = await db
      .update(goals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goals.id, goalId))
      .returning();
    return result[0];
  },

  async deleteGoal(goalId: string) {
    const result = await db.delete(goals).where(eq(goals.id, goalId)).returning();
    return result[0];
  },

  async toggleGoalComplete(goalId: string, completed: boolean) {
    const result = await db
      .update(goals)
      .set({ completed, updatedAt: new Date() })
      .where(eq(goals.id, goalId))
      .returning();
    return result[0];
  },

  async getCompletionStats(userId: string) {
    const allGoals = await db.select().from(goals).where(eq(goals.userId, userId));
    const completedGoals = allGoals.filter((g) => g.completed);

    const total = allGoals.length;
    const completed = completedGoals.length;
    const completionPercentage = total === 0 ? 0 : (completed / total) * 100;

    return { total, completed, completionPercentage };
  },

  async deleteUserGoals(userId: string) {
    // Only delete user-created goals (not system goals)
    const result = await db
      .delete(goals)
      .where(eq(goals.userId, userId))
      .returning();
    return result;
  },
};
