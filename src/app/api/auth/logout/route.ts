import { deleteSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
