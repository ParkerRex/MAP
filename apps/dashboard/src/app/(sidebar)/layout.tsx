import { AI } from "@/actions/ai/chat";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";

const AssistantModal = dynamic(
  () => import("@/components/assistant/assistant-modal").then((mod) => mod.AssistantModal),
  {
    ssr: false,
  },
);

const HotKeys = dynamic(() => import("@/components/hot-keys").then((mod) => mod.HotKeys), {
  ssr: false,
});

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <AI initialAIState={{ user: {}, messages: [], chatId: nanoid() }}>
        <Sidebar />
        <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
          <Header />
          {children}
        </div>
        <AssistantModal />
        <HotKeys />
      </AI>
    </div>
  );
}
