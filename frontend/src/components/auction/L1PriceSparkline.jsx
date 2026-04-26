import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

function SparklineTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0];

  return (
    <div className="rounded-lg border border-surface-200 bg-white/95 px-3 py-2 text-xs text-surface-900 shadow-lg">
      <div className="font-semibold">{formatCurrency(point.value)}</div>
      <div className="mt-1 text-surface-500">{formatDateTime(point.payload.timestamp)}</div>
    </div>
  );
}

export default function L1PriceSparkline({ l1PriceHistory }) {
  if (!l1PriceHistory || l1PriceHistory.length < 2) {
    return <div className="text-sm text-surface-500">Price history unavailable</div>;
  }

  return (
    <div className="h-[60px] w-full min-w-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={l1PriceHistory}>
          <Tooltip content={<SparklineTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#5bbec0"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
