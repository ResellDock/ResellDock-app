import "./globals.css";
import Footer from "@/components/Footer";
import Tracker from "@/components/Tracker";

export const metadata = {
    title: "Reselldock — Wholesale Stock Marketplace",
    description: "Where businesses dock their stock and resellers come to connect.",
};

export default function RootLayout({ children }) {
    return (
          <html lang="en">
            <body className="bg-bg text-ink antialiased min-h-screen flex flex-col">
              <div className="flex-1">{children}</div>
          <Tracker />
          <Footer />
      </body>
      </html>
    );
}
