import { db } from "@/db";
import { createSession, verifyPassword } from "@/lib/auth";
import {
  handleApiError,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      throw validationError("Invalid input", {
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!user || !user.passwordHash) {
      throw unauthorized("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw unauthorized("Invalid email or password");
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhotoUrl: user.profilePhotoUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
