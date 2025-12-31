import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

const getColorsFromGoogle = unstable_cache(
  async () => {
    const calendar = await getGoogleCalendarClient();
    const response = await calendar.colors.get();
    return response.data;
  },
  ["calendar-colors"],
  { revalidate: 600 }, // 10 minutes
);

export async function GET() {
  try {
    const colors = await getColorsFromGoogle();
    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Failed to fetch colors:", error);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}
