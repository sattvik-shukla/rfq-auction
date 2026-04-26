import React, { useState } from "react";

const initialState = {
  name: "",
  pickupDate: "",
  bidStartTime: "",
  bidCloseTime: "",
  forcedBidCloseTime: "",
  britishAuctionConfig: {
    triggerWindowMinutes: 10,
    extensionDurationMinutes: 5,
    extensionTrigger: "L1_RANK_CHANGE",
    minimumDecrementType: "PERCENTAGE",
    minimumDecrementValue: 2,
    maxExtensions: 5,
  },
};

function toISOStringValue(value) {
  return new Date(value).toISOString();
}

const inputClasses =
  "w-full rounded-xl border border-surface-200 bg-white/85 px-3 py-2.5 text-surface-900 placeholder-surface-400 shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const labelClasses = "mb-1.5 block text-sm font-semibold text-surface-700";

export default function CreateRFQForm({ onSubmit, isSubmitting, error }) {
  const [formState, setFormState] = useState(initialState);
  const [validationError, setValidationError] = useState(null);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  function handleConfigChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      britishAuctionConfig: {
        ...currentState.britishAuctionConfig,
        [name]:
          name === "extensionTrigger" || name === "minimumDecrementType"
            ? value
            : Number(value),
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError(null);

    if (new Date(formState.forcedBidCloseTime) <= new Date(formState.bidCloseTime)) {
      setValidationError("forcedBidCloseTime must be later than bidCloseTime");
      return;
    }

    await onSubmit({
      name: formState.name.trim(),
      pickupDate: toISOStringValue(formState.pickupDate),
      bidStartTime: toISOStringValue(formState.bidStartTime),
      bidCloseTime: toISOStringValue(formState.bidCloseTime),
      forcedBidCloseTime: toISOStringValue(formState.forcedBidCloseTime),
      britishAuctionConfig: {
        ...formState.britishAuctionConfig,
        minimumDecrementValue:
          formState.britishAuctionConfig.minimumDecrementType === "NONE"
            ? 0
            : Number(formState.britishAuctionConfig.minimumDecrementValue),
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-8 rounded-2xl p-6">
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">RFQ Details</h2>
          <p className="mt-1 text-sm text-surface-600">
            Set the route name and pickup date for the shipment.
          </p>
          <div className="gradient-line mt-3" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="rfq-name" className={labelClasses}>
              RFQ Name
            </label>
            <input
              id="rfq-name"
              name="name"
              value={formState.name}
              onChange={handleFieldChange}
              placeholder="e.g. Mumbai to Delhi Freight Q2"
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label htmlFor="pickup-date" className={labelClasses}>
              Pickup Date
            </label>
            <input
              id="pickup-date"
              name="pickupDate"
              type="datetime-local"
              value={formState.pickupDate}
              onChange={handleFieldChange}
              className={inputClasses}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">Auction Timing</h2>
          <p className="mt-1 text-sm text-surface-600">
            Define the bidding window and forced close deadline.
          </p>
          <div className="gradient-line mt-3" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="bid-start" className={labelClasses}>
              Bid Start Time
            </label>
            <input
              id="bid-start"
              name="bidStartTime"
              type="datetime-local"
              value={formState.bidStartTime}
              onChange={handleFieldChange}
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">When suppliers can begin bidding</p>
          </div>
          <div>
            <label htmlFor="bid-close" className={labelClasses}>
              Bid Close Time
            </label>
            <input
              id="bid-close"
              name="bidCloseTime"
              type="datetime-local"
              value={formState.bidCloseTime}
              onChange={handleFieldChange}
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">Original planned close time</p>
          </div>
          <div>
            <label htmlFor="forced-close" className={labelClasses}>
              Forced Close Time
            </label>
            <input
              id="forced-close"
              name="forcedBidCloseTime"
              type="datetime-local"
              value={formState.forcedBidCloseTime}
              onChange={handleFieldChange}
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">
              Hard deadline, extensions cannot exceed this
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">
            British Auction Configuration
          </h2>
          <p className="mt-1 text-sm text-surface-600">
            Configure trigger windows, extension behavior, and decrement rules.
          </p>
          <div className="gradient-line mt-3" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="trigger-window" className={labelClasses}>
              Trigger Window (minutes)
            </label>
            <input
              id="trigger-window"
              name="triggerWindowMinutes"
              type="number"
              min="1"
              value={formState.britishAuctionConfig.triggerWindowMinutes}
              onChange={handleConfigChange}
              placeholder="e.g. 10"
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">
              Monitor last X minutes before close for activity
            </p>
          </div>
          <div>
            <label htmlFor="extension-duration" className={labelClasses}>
              Extension Duration (minutes)
            </label>
            <input
              id="extension-duration"
              name="extensionDurationMinutes"
              type="number"
              min="1"
              value={formState.britishAuctionConfig.extensionDurationMinutes}
              onChange={handleConfigChange}
              placeholder="e.g. 5"
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">
              How many minutes to extend when triggered
            </p>
          </div>
          <div>
            <label htmlFor="extension-trigger" className={labelClasses}>
              Extension Trigger
            </label>
            <select
              id="extension-trigger"
              name="extensionTrigger"
              value={formState.britishAuctionConfig.extensionTrigger}
              onChange={handleConfigChange}
              className={inputClasses}
            >
              <option value="BID_RECEIVED">Bid Received</option>
              <option value="ANY_RANK_CHANGE">Any Rank Change</option>
              <option value="L1_RANK_CHANGE">L1 Rank Change</option>
            </select>
            <p className="mt-1 text-xs text-surface-500">What event triggers an extension</p>
          </div>
          <div>
            <label htmlFor="decrement-type" className={labelClasses}>
              Minimum Decrement Type
            </label>
            <select
              id="decrement-type"
              name="minimumDecrementType"
              value={formState.britishAuctionConfig.minimumDecrementType}
              onChange={handleConfigChange}
              className={inputClasses}
            >
              <option value="NONE">None</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount (INR)</option>
            </select>
            <p className="mt-1 text-xs text-surface-500">
              Enforce minimum bid reduction rule
            </p>
          </div>
          {formState.britishAuctionConfig.minimumDecrementType !== "NONE" ? (
            <div>
              <label htmlFor="decrement-value" className={labelClasses}>
                {formState.britishAuctionConfig.minimumDecrementType === "PERCENTAGE"
                  ? "Minimum Decrement (%)"
                  : "Minimum Decrement (INR)"}
              </label>
              <input
                id="decrement-value"
                name="minimumDecrementValue"
                type="number"
                min="0"
                value={formState.britishAuctionConfig.minimumDecrementValue}
                onChange={handleConfigChange}
                placeholder={
                  formState.britishAuctionConfig.minimumDecrementType === "PERCENTAGE"
                    ? "e.g. 2"
                    : "e.g. 1000"
                }
                className={inputClasses}
                required
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="max-extensions" className={labelClasses}>
              Max Extensions
            </label>
            <input
              id="max-extensions"
              name="maxExtensions"
              type="number"
              min="0"
              value={formState.britishAuctionConfig.maxExtensions}
              onChange={handleConfigChange}
              placeholder="0 = unlimited"
              className={inputClasses}
              required
            />
            <p className="mt-1 text-xs text-surface-500">Set to 0 for unlimited extensions</p>
          </div>
        </div>
      </section>

      {validationError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {validationError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-glow disabled:cursor-not-allowed disabled:bg-surface-300 disabled:text-surface-500"
        >
          {isSubmitting ? "Creating..." : "Create Auction"}
        </button>
      </div>
    </form>
  );
}
