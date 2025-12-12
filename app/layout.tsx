import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Chia đội cầu lông",
  description: "Webapp chia đội và quản lý session cầu lông"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

