import "./globals.css";

export const metadata = {
  title: "Reselldock — Wholesale Stock Marketplace",
  description: "Where businesses dock their stock and resellers come to connect.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
