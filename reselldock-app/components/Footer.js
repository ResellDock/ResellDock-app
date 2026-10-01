import Link from "next/link";

export default function Footer() {
    return (
          <footer className="border-t border-line mt-16">
            <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted">
                <span className="font-extrabold text-ink">
                  Resell<span className="text-brand">dock</span>
      </span>
            <span className="ml-2">&copy; {new Date().getFullYear()} Reselldock. All rights reserved.</span>
      </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-muted">
                <Link href="/#how-it-works" className="hover:text-ink">How it works</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <a href="mailto:hello@reselldock.com" className="hover:text-ink">Contact</a>
      </nav>
      </div>
      </footer>
    );
}
