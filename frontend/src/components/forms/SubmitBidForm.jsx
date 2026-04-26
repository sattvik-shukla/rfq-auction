import React, { useState } from "react";
import { Send } from "lucide-react";
import useAuctionStore from "../../store/useAuctionStore";
import { formatCurrency } from "../../utils/formatters";

const initialFormState = {
  supplierName: "",
  carrierName: "",
  charges: {
    freight: "",
    origin: "",
    destination: "",
  },
  transitDays: "",
  quoteValidity: "",
};

const inputClasses =
  "w-full rounded-xl border border-surface-200 bg-white/85 px-3 py-2.5 text-surface-900 placeholder-surface-400 shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

const labelClasses = "mb-1.5 block text-sm font-semibold text-surface-700";

function toNumber(value) {
  return Number(value || 0);
}

function canSubmit(status) {
  return status === "active" || status === "extended";
}

export default function SubmitBidForm({ rfqId, bids, status }) {
  const submitBid = useAuctionStore((state) => state.submitBid);
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total =
    toNumber(formState.charges.freight) +
    toNumber(formState.charges.origin) +
    toNumber(formState.charges.destination);
  const currentL1 = bids.length ? bids[0].totalAmount : null;
  const isDisabled = !canSubmit(status) || isSubmitting;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  function handleChargeChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      charges: {
        ...currentState.charges,
        [name]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await submitBid(rfqId, {
        supplierName: formState.supplierName.trim(),
        carrierName: formState.carrierName.trim(),
        charges: {
          freight: toNumber(formState.charges.freight),
          origin: toNumber(formState.charges.origin),
          destination: toNumber(formState.charges.destination),
        },
        transitDays: toNumber(formState.transitDays),
        quoteValidity: new Date(formState.quoteValidity).toISOString(),
      });

      setFormState(initialFormState);
    } catch (submissionError) {
      setError(submissionError?.error || "Unable to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Send size={16} className="text-accent-dark" />
            <h2 className="text-base font-semibold text-surface-900">Submit Bid</h2>
          </div>
          <p className="mt-1 text-sm text-surface-600">
            Enter supplier pricing and quote details below.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-right">
          <div className="text-xs font-medium uppercase tracking-wider text-emerald-700/80">
            Live Total
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatCurrency(total)}</div>
        </div>
      </div>

      <div className="gradient-line my-5" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bid-supplier" className={labelClasses}>
            Supplier Name
          </label>
          <input
            id="bid-supplier"
            name="supplierName"
            value={formState.supplierName}
            onChange={handleChange}
            placeholder="e.g. Supplier A"
            className={inputClasses}
            disabled={isDisabled}
            required
          />
        </div>
        <div>
          <label htmlFor="bid-carrier" className={labelClasses}>
            Carrier Name
          </label>
          <input
            id="bid-carrier"
            name="carrierName"
            value={formState.carrierName}
            onChange={handleChange}
            placeholder="e.g. DHL Express"
            className={inputClasses}
            disabled={isDisabled}
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-3 text-sm font-semibold text-surface-700">Charges Breakdown (INR)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="bid-freight" className={labelClasses}>
              Freight Charge
            </label>
            <input
              id="bid-freight"
              name="freight"
              type="number"
              min="1"
              value={formState.charges.freight}
              onChange={handleChargeChange}
              placeholder="e.g. 45000"
              className={inputClasses}
              disabled={isDisabled}
              required
            />
          </div>
          <div>
            <label htmlFor="bid-origin" className={labelClasses}>
              Origin Charge
            </label>
            <input
              id="bid-origin"
              name="origin"
              type="number"
              min="1"
              value={formState.charges.origin}
              onChange={handleChargeChange}
              placeholder="e.g. 3200"
              className={inputClasses}
              disabled={isDisabled}
              required
            />
          </div>
          <div>
            <label htmlFor="bid-destination" className={labelClasses}>
              Destination Charge
            </label>
            <input
              id="bid-destination"
              name="destination"
              type="number"
              min="1"
              value={formState.charges.destination}
              onChange={handleChargeChange}
              placeholder="e.g. 2800"
              className={inputClasses}
              disabled={isDisabled}
              required
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bid-transit" className={labelClasses}>
            Transit Days
          </label>
          <input
            id="bid-transit"
            name="transitDays"
            type="number"
            min="1"
            value={formState.transitDays}
            onChange={handleChange}
            placeholder="e.g. 3"
            className={inputClasses}
            disabled={isDisabled}
            required
          />
        </div>
        <div>
          <label htmlFor="bid-validity" className={labelClasses}>
            Quote Validity
          </label>
          <input
            id="bid-validity"
            name="quoteValidity"
            type="datetime-local"
            value={formState.quoteValidity}
            onChange={handleChange}
            className={inputClasses}
            disabled={isDisabled}
            required
          />
          <p className="mt-1 text-xs text-surface-500">Must be a future date</p>
        </div>
      </div>

      {currentL1 !== null && total > currentL1 ? (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          {`Your total is above the current L1 bid of ${formatCurrency(currentL1)}.`}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-surface-500">
          {canSubmit(status)
            ? "Bid table updates in real-time."
            : "Bidding is disabled because the auction is no longer active."}
        </div>
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-glow disabled:cursor-not-allowed disabled:bg-surface-300 disabled:text-surface-500"
        >
          {isSubmitting ? "Submitting..." : "Submit Bid"}
        </button>
      </div>
    </form>
  );
}
