// // src/app/health/actions.ts

// import { CalendarClient } from "@/lib/integrations/calendar";
// import { WhoopClient } from "@/lib/integrations/whoop";
// import { AuthManager } from "@/lib/integrations/auth";

// export async function syncHealthData(userId: string): Promise<void> {
//   try {
//     const authManager = new AuthManager();
//     const googleAccessToken = await authManager.getAccessToken(
//       "GOOGLE",
//       userId,
//     );
//     const whoopAccessToken = await authManager.getAccessToken("WHOOP", userId);

//     // const calendarClient = new CalendarClient(googleAccessToken, "UTC", userId);
//     // const whoopClient = new WhoopClient(whoopAccessToken);

//     // const sleepCalendarId =
//     //   await calendarClient.getOrCreateHealthCalendar("sleep");
//     // const workoutCalendarId =
//     //   await calendarClient.getOrCreateHealthCalendar("workout");

//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - 30); // Fetch last 30 days of data
//     const endDate = new Date();

//     // const sleepData = await whoopClient.getSleep(
//     //   startDate.toISOString(),
//     //   endDate.toISOString(),
//     // );
//     // const workoutData = await whoopClient.getWorkouts(
//     //   startDate.toISOString(),
//   endDate.toISOString(),
// );

// for (const sleep of sleepData.records) {
//     //   await calendarClient.addSleepEvent(sleepCalendarId, sleep);
//     // }

//     // for (const workout of workoutData.records) {
//     //   await calendarClient.addWorkoutEvent(workoutCalendarId, workout);
//     // }

//     console.log("Health data synced successfully");
//   } catch (error) {
//     console.error("Error syncing health data:", error);
//     throw error;
//   }
// }
