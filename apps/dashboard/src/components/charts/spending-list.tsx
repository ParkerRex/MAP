import { Cookies } from "@/utils/constants";
// TODO: Implement getBankAccountsCurrencies and getSpending in @map/supabase/cached-queries
// import {
//   getBankAccountsCurrencies,
//   getSpending,
// } from "@map/supabase/cached-queries";
import { Skeleton } from "@map/ui/skeleton";
import { cookies } from "next/headers";
import { spendingData } from "./data";
import { SpendingCategoryList } from "./spending-category-list";

export function SpendingListSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {[...Array(16)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center"
        >
          <div className="w-[70%] flex space-x-4 pr-8 items-center">
            <Skeleton className="rounded-[2px] size-[12px]" />
            <Skeleton className="h-[6px] w-full rounded-none" />
          </div>
          <div className="w-full ml-auto">
            <Skeleton className="w-full align-start h-[6px] rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function SpendingList({ initialPeriod, disabled }) {
  // TODO: Replace with actual implementation once getBankAccountsCurrencies is available
  const currency = cookies().has(Cookies.ChartCurrency)
    ? cookies().get(Cookies.ChartCurrency)?.value
    : "USD";

  // TODO: Replace with actual implementation once getSpending is available
  const spending = spendingData;

  if (!spending?.data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060]">
          No transactions have been categorized yet.
        </p>
      </div>
    );
  }

  return (
    <SpendingCategoryList categories={spending?.data} period={initialPeriod} />
  );
}
