import { CopyInput } from "@/components/copy-input";
import { InboxList } from "./inbox-list";

// TODO: Implement getUser from @map/supabase/cached-queries
// import { getUser } from "@map/supabase/cached-queries";

// TODO: Implement getInboxQuery from @map/supabase/queries
// import { getInboxQuery } from "@map/supabase/queries";

// TODO: Implement createClient from @map/supabase/server
// import { createClient } from "@map/supabase/server";

export async function InboxWidget({ filter, disabled }) {
  // TODO: Implement actual user fetching
  // const user = await getUser();
  // const supabase = createClient();

  // Fake data for UI testing
  const fakeData = [
    {
      id: 1,
      display_name: "Invoice 1",
      amount: 100,
      currency: "USD",
      status: "pending",
      due_date: "2023-06-15",
    },
    {
      id: 2,
      display_name: "Invoice 2",
      amount: 200,
      currency: "USD",
      status: "handled",
      transaction_id: "tx123",
      due_date: "2023-06-20",
    },
    {
      id: 3,
      display_name: "Invoice 3",
      amount: 150,
      currency: "USD",
      status: "new",
      due_date: "2023-06-25",
    },
  ];

  const data = disabled
    ? []
    : fakeData.filter((item) => {
        if (filter === "done") return item.status === "handled";
        if (filter === "todo") return item.status !== "handled";
        return true;
      });

  if (!data.length) {
    return (
      <div className="flex flex-col space-y-4 items-center justify-center h-full text-center">
        <div>
          {/* TODO: Implement getInboxEmail function */}
          <CopyInput value="example@inbox.mapfinance.com" />
        </div>

        <p className="text-sm text-[#606060]">
          Use this email for online purchases to seamlessly
          <br />
          match invoices against transactions.
        </p>
      </div>
    );
  }

  return <InboxList data={data} />;
}
