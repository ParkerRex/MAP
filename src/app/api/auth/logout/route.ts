import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
