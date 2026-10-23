import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Platform — Development",
  description: "Windows-first private LLM platform development environment",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

