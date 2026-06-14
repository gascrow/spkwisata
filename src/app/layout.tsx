import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/shared/AppContext";
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
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="h-full bg-slate-50 antialiased font-sans text-slate-800" suppressHydrationWarning>
        <AppProvider>
          {children}
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
