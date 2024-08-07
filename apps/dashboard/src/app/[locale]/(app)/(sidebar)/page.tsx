// Import necessary components and utilities
import { ChartSelectors } from "@/components/charts/chart-selectors";
import { Charts } from "@/components/charts/charts";
import { OverviewModal } from "@/components/modals/overview-modal";
import { Widgets } from "@/components/widgets";
import { Cookies } from "@/utils/constants";
// import {
//   getBankAccountsCurrencies,
//   getTeamBankAccounts,
// } from "@map/supabase/cached-queries";
import { cn } from "@map/ui/cn";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import type { Metadata } from "next";
import { cookies } from "next/headers";

// Set maximum duration for the page to 30 seconds
// This is needed for GoCardLess serverAction which can take up to 20s
export const maxDuration = 30;

// Set metadata for the page
export const metadata: Metadata = {
  title: "Overview | map",
};

// Define default values for the chart period
const defaultValue = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
  period: "monthly",
};

// Main component for the Overview page
export default async function Overview({
  searchParams,
}: { searchParams: any }) {
  // TODO: Implement getTeamBankAccounts
  // const accounts = await getTeamBankAccounts();
  const accounts = { data: [{ id: "fake-account" }] }; // Stub data

  // Get chart type from cookies or use default "profit"
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  // TODO: Implement getBankAccountsCurrencies
  // const currency = cookies().has(Cookies.ChartCurrency)
  //   ? cookies().get(Cookies.ChartCurrency)?.value
  //   : (await getBankAccountsCurrencies())?.data?.at(0)?.currency || "USD";
  const currency = cookies().get(Cookies.ChartCurrency)?.value ?? "USD"; // Fallback to USD

  // Get initial period from cookies or use default
  const initialPeriod = cookies().has(Cookies.SpendingPeriod)
    ? JSON.parse(cookies().get(Cookies.SpendingPeriod)?.value ?? "{}")
    : {
        id: "this_year",
        from: startOfMonth(new Date()).toISOString(),
        to: new Date().toISOString(),
      };

  // Create value object from search params
  const value = {
    ...(searchParams.from && { from: searchParams.from }),
    ...(searchParams.to && { to: searchParams.to }),
    period: searchParams.period,
  };

  // Determine if modal should be open
  const isOpen = Boolean(searchParams.step) && !searchParams.error;

  // Check if the page is in an empty state
  const empty =
    !accounts?.data?.length ||
    (Boolean(searchParams.error) && Boolean(searchParams.step));

  return (
    <>
      {/* Main content div, opacity reduced when empty and modal not open */}
      <div className={cn(empty && !isOpen && "opacity-20 pointer-events-none")}>
        <div className="h-[520px]">
          {/* Chart selector component */}
          <ChartSelectors defaultValue={defaultValue} currency={currency} />
          {/* Charts component */}
          <Charts
            value={value}
            defaultValue={defaultValue}
            disabled={empty}
            currency={currency}
            type={chartType}
          />
        </div>

        {/* Widgets component */}
        <Widgets
          initialPeriod={initialPeriod}
          disabled={empty}
          searchParams={searchParams}
        />
      </div>
      {/* Show OverviewModal when page is empty and modal is not open */}
      {!isOpen && empty && <OverviewModal />}
    </>
  );
}
