import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleApiError, validationError } from "@/lib/api/errors";
import { createSession, hashPassword } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      throw validationError("Invalid input", {
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email, password, firstName, lastName } = result.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      throw validationError("Email already in use");
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profilePhotoUrl: users.profilePhotoUrl,
      });

    // Create session
    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
