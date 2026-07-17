import type { Metadata } from "next";
import { Toaster } from "sonner";
import { DemoDataProvider } from "@/components/shared/demo-data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thread — One health story",
  description: "An evidence-backed longitudinal health story for people living with chronic conditions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoDataProvider>{children}</DemoDataProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-plum-100 !bg-white !text-plum-950 !shadow-soft",
            },
          }}
        />
      </body>
    </html>
  );
}
