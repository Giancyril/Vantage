import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AskVantageButton } from "@/components/AskVantageButton";
import { ChatProvider } from "@/components/ChatProvider";
import { AudioProvider } from "@/components/AudioProvider";

export const metadata: Metadata = {
  title: "VANTAGE — Personalized AI News Intelligence",
  description: "Reads hundreds of articles, learns your interests, and explains why each story matters to you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F7F4] text-[#181715] selection:bg-[#E8B499]/30">
        <ChatProvider>
          <AudioProvider>
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            {children}
          </main>
          <AskVantageButton variant="floating" />
        </AudioProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
