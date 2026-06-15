import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import MainLayoutContent from "@/app/MainLayoutContent";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <MainLayoutContent>
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </MainLayoutContent>
    </div>
  );
}
