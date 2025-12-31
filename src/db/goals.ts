import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { goals, type NewGoal } from "./schema";

export const goalsDb = {
  async getGoals(userId: string) {
    return db.select().from(goals).where(eq(goals.userId, userId));
  },

  async getGoalById(goalId: string, userId: string) {
    const result = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async createGoal(data: NewGoal) {
    const result = await db.insert(goals).values(data).returning();
    return result[0];
  },

  async updateGoal(goalId: string, userId: string, data: Partial<NewGoal>) {
    const result = await db
      .update(goals)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async deleteGoal(goalId: string, userId: string) {
    const result = await db
      .delete(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async toggleGoalComplete(goalId: string, userId: string, completed: boolean) {
    const result = await db
      .update(goals)
      .set({ completed, updatedAt: new Date() })
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async getCompletionStats(userId: string) {
    const allGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));
    const completedGoals = allGoals.filter((g) => g.completed);

    const total = allGoals.length;
    const completed = completedGoals.length;
    const completionPercentage = total === 0 ? 0 : (completed / total) * 100;

    return { total, completed, completionPercentage };
  },

  async deleteUserGoals(userId: string) {
    const result = await db
      .delete(goals)
      .where(eq(goals.userId, userId))
      .returning();
    return result;
  },
};
