import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smoozy Admin",
  description: "Smoozy backend and admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased min-h-screen bg-[#0a0a0b]">
        {/* Global background gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgba(59,130,246,0.03) 0%, transparent 40%)
            `,
          }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
