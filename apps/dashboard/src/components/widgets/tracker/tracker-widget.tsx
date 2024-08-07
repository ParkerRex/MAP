// TODO: Add in cached queries once theyre written.
import { getCountryInfo } from "@map/location";
// import { getTrackerRecordsByRange } from "@map/supabase/cached-queries";
import { getUser } from "@map/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import { TrackerHeader } from "./tracker-header";
import { TrackerWrapper } from "./tracker-wrapper";

export function TrackerWidgetSkeleton() {
  return <TrackerHeader />;
}

export async function TrackerWidget({
  date,
  hideDaysIndicators,
}: { date: string | Date; hideDaysIndicators: boolean }) {
  const currentDate = date ?? new Date();
  const userData = await getUser();
  const { currencyCode } = getCountryInfo();

  // Commented out the actual getTrackerRecordsByRange call
  // const trackerData = await getTrackerRecordsByRange({
  //   from: formatISO(startOfMonth(new Date(currentDate)), {
  //     representation: "date",
  //   }),
  //   to: formatISO(endOfMonth(new Date(currentDate)), {
  //     representation: "date",
  //   }),
  // });

  // Dummy call to get fake values
  const trackerData = {
    data: [
      { id: 1, date: "2023-05-01", duration: 3600 },
      { id: 2, date: "2023-05-02", duration: 7200 },
      { id: 3, date: "2023-05-03", duration: 5400 },
    ],
    meta: {
      total_duration: 16200,
      average_duration: 5400,
    },
  };

  return (
    <TrackerWrapper
      hideDaysIndicators={hideDaysIndicators}
      data={trackerData.data}
      meta={trackerData.meta}
      date={currentDate}
      user={userData?.data}
      currencyCode={currencyCode}
    />
  );
}
