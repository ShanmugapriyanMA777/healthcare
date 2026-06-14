import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AIAssistant from "@/components/AIAssistant";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NovaCare | Premium Futuristic Healthcare Center",
  description: "Experience premium, modern, and futuristic medical care at NovaCare. Secure online appointment booking, digital prescriptions, x-ray upload, and virtual telemedicine consultations.",
  keywords: "healthcare, hospital, telemedicine, doctor appointment, medical reports, electronic health records, online consultation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
