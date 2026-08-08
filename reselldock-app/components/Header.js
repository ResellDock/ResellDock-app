import Link from "next/link";

export default function Header({ profile, msgBadge }) {
  const isBusiness = profile?.role === "business";
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-bg/90 border-b border-line">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-5">
        <Link href={isBusiness ? "/dashboard" : "/feed"} className="font-extrabold text-lg tracking-tight">
          Resell<span className="text-brand">dock</span>
        </Link>
        <nav className="flex bg-[#EDEBE5] rounded-lg p-1">
          <Link
            href="/feed"
            className={`px-4 py-1.5 rounded-md text-sm font-bold ${!isBusiness ? "bg-white shadow-sm" : "text-muted"}`}
          >
            Reseller
          </Link>
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-md text-sm font-bold ${isBusiness ? "bg-white shadow-sm" : "text-muted"}`}
          >
            Business
          </Link>
        </nav>
        <div className="flex-1" />
        <Link href="/messages" className="relative p-2 rounded-lg hover:bg-[#EDEBE5] text-lg" title="Messages">
          ✉️
          {msgBadge ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warn border-2 border-bg" /> : null}
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span>{profile?.name?.split(" ")[0] || "User"}</span>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-muted hover:text-ink ml-2" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
