import { redirect } from "next/navigation";
import HomePageClient from "./HomePageClient";
import { getUserId } from "./actions";

export default async function HomePage({
  searchParams: { currentDate },
}: {
  searchParams: { currentDate?: string };
}) {
  const userId = await getUserId();
  if (!userId) {
    return redirect("/login");
  }

  const parsedDate = currentDate ? new Date(currentDate) : new Date();

  return (
    <HomePageClient
      userId={userId}
      initialDate={parsedDate}
      // Removed initialSyncStatus prop as it's no longer needed
    />
  );
}
