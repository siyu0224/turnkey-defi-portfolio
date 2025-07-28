import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TurnkeyWrapper from "@/components/TurnkeyWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turnkey Embedded Wallet POC",
  description: "Proof of concept for Turnkey embedded wallet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <WalletProvider>
            <TurnkeyWrapper
              apiBaseUrl={process.env.NEXT_PUBLIC_BASE_URL!}
              organizationId={process.env.NEXT_PUBLIC_ORGANIZATION_ID!}
            >
              {children}
            </TurnkeyWrapper>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
