import { db } from "./index";
import { users, preferences, type NewUser, type Preference } from "./schema";
import { eq } from "drizzle-orm";

export const usersDb = {
  async getUserById(userId: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result[0] ?? null;
  },

  async getUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] ?? null;
  },

  async createUser(data: NewUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  async updateUser(
    userId: string,
    data: Partial<Omit<NewUser, "id" | "createdAt">>,
  ) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  async deleteUser(userId: string) {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  // Preferences
  async getPreferences(userId: string) {
    const result = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId))
      .limit(1);
    return result[0] ?? null;
  },

  async upsertPreferences(userId: string, data: Partial<Preference>) {
    const existing = await this.getPreferences(userId);
    if (existing) {
      const result = await db
        .update(preferences)
        .set(data)
        .where(eq(preferences.userId, userId))
        .returning();
      return result[0];
    }
    const result = await db
      .insert(preferences)
      .values({ userId, ...data })
      .returning();
    return result[0];
  },
};
