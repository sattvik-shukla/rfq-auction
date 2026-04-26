import React from "react";
import { Users } from "lucide-react";

export default function LiveBidderCount({ count }) {
  if (!count) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Users size={14} />
      <span>{`${count} viewing`}</span>
    </div>
  );
}
