import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/shared/AppContext";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import MainLayoutContent from "./MainLayoutContent";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SPK Pariwisata Kota Balikpapan",
  description: "Sistem Pendukung Keputusan Pemilihan Prioritas Pengembangan Pariwisata Kota Balikpapan Menggunakan Metode AHP-TOPSIS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-slate-50 antialiased font-sans text-slate-800">
        <AppProvider>
          <div className="flex h-full w-full overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Content Container */}
            <MainLayoutContent>
              {/* Sticky Top Header */}
              <Header />

              {/* Main Content Area */}
              <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                {children}
              </main>
            </MainLayoutContent>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: "13px",
                borderRadius: "8px",
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
