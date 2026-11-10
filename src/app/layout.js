import "./globals.css";

export const metadata = {
  title: "Mess Manager (MessMate)",
  description: "A mobile-first, multi-tenant bachelor-mess management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
