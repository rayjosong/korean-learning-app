import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korean Learning App",
  description: "Learn Korean through real Korean content."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
