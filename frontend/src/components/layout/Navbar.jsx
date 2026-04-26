import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

function getLinkClasses(isActive) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-accent/15 text-accent-dark shadow-sm"
      : "text-surface-600 hover:bg-white/70 hover:text-surface-900",
  ].join(" ");
}

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/auctions"
          className="flex items-center gap-3 text-lg font-bold tracking-tight text-surface-900"
        >
          <img
            src="/logo.png"
            alt="RFQ Auction"
            className="h-9 w-9 rounded-xl border border-white/70 object-cover shadow-sm"
          />
          <div className="flex flex-col">
            <span>RFQ Auction</span>
            <span className="text-xs font-medium uppercase tracking-[0.24em] text-surface-500">
              Live Procurement
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            to="/auctions"
            className={getLinkClasses(
              location.pathname === "/auctions" || location.pathname === "/"
            )}
          >
            Auctions
          </Link>
          <Link
            to="/create"
            className={getLinkClasses(location.pathname === "/create")}
          >
            Create Auction
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-surface-600 transition hover:bg-white/80 hover:text-surface-900"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="animate-slide-in border-t border-surface-200/70 px-4 pb-4 sm:hidden">
          <Link
            to="/auctions"
            onClick={() => setMobileOpen(false)}
            className={`block ${getLinkClasses(
              location.pathname === "/auctions" || location.pathname === "/"
            )}`}
          >
            Auctions
          </Link>
          <Link
            to="/create"
            onClick={() => setMobileOpen(false)}
            className={`mt-1 block ${getLinkClasses(location.pathname === "/create")}`}
          >
            Create Auction
          </Link>
        </nav>
      )}
    </header>
  );
}
