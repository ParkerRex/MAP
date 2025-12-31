import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Sidebar />
      <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
        <Header />
        {children}
      </div>
    </div>
  );
}
