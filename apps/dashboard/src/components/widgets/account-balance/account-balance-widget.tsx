// TODO: Implement cached queries for getTeamBankAccounts
// import { getTeamBankAccounts } from "@map/supabase/cached-queries";
import { AccountBalance } from "./account-balance";

export function AccountBalanceSkeleton() {
  return null;
}

export async function AccountBalanceWidget() {
  // TODO: Replace this with actual data from getTeamBankAccounts when implemented
  const accountsData = {
    data: [
      { id: 1, name: "Checking Account", balance: 5000, currency: "USD" },
      { id: 2, name: "Savings Account", balance: 10000, currency: "USD" },
      { id: 3, name: "Investment Account", balance: 25000, currency: "USD" },
    ],
  };

  return (
    <div className="h-full">
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg">Account balance</h2>
        </div>
      </div>

      <AccountBalance data={accountsData.data} />
    </div>
  );
}
