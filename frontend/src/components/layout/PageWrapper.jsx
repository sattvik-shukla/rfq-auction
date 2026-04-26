import React from "react";
import Navbar from "./Navbar";

export default function PageWrapper({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-50 text-surface-900 font-sans">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-[-5rem] h-56 w-56 rounded-full bg-[#ffd8b2] opacity-70 blur-3xl" />
        <div className="absolute right-[-4rem] top-16 h-52 w-52 rounded-full bg-[#9ed9d5] opacity-55 blur-3xl" />
        <div className="absolute bottom-8 left-1/3 h-44 w-44 rounded-full bg-[#ffedd1] opacity-70 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Navbar />
      </div>
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
