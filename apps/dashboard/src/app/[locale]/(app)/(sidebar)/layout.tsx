import { AI } from "@/actions/ai/chat";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { setupAnalytics } from "@map/events/server";
import { getCountryCode } from "@map/location";
import { uniqueCurrencies } from "@map/location/src/currencies";
import { getUser } from "@map/supabase/cached-queries";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

// Dynamically import components to improve initial load time
const AssistantModal = dynamic(
  () =>
    import("@/components/assistant/assistant-modal").then(
      (mod) => mod.AssistantModal,
    ),
  {
    ssr: false,
  },
);

// const SelectBankAccountsModal = dynamic(
//   () =>
//     import("@/components/modals/select-bank-accounts").then(
//       (mod) => mod.SelectBankAccountsModal,
//     ),
//   {
//     ssr: false,
//   },
// );

const HotKeys = dynamic(
  () => import("@/components/hot-keys").then((mod) => mod.HotKeys),
  {
    ssr: false,
  },
);

// const ConnectTransactionsModal = dynamic(
//   () =>
//     import("@/components/modals/connect-transactions-modal").then(
//       (mod) => mod.ConnectTransactionsModal,
//     ),
//   {
//     ssr: false,
//   },
// );

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user data and country code
  const user = await getUser();
  const countryCode = getCountryCode();

  // Setup analytics if user exists
  if (user) {
    await setupAnalytics({ userId: user.data.id });
  }

  // Render the layout with sidebar, header, and various modals
  return (
    <div className="relative">
      <AI initialAIState={{ user: user.data, messages: [], chatId: nanoid() }}>
        <Sidebar />

        <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
          <Header />
          {children}
        </div>

        <AssistantModal />
        {/* <ConnectTransactionsModal countryCode={countryCode} /> */}
        {/* <SelectBankAccountsModal /> */}
        {/* <ImportCSVModal
          currencies={uniqueCurrencies}
          defaultCurrency={uniqueCurrencies[countryCode]}
        />
        <ExportStatus /> */}
        <HotKeys />
      </AI>
    </div>
  );
}
