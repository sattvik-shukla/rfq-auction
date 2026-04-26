import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CreateRFQForm from "../components/forms/CreateRFQForm";
import PageWrapper from "../components/layout/PageWrapper";
import useAuctionStore from "../store/useAuctionStore";

export default function CreateRFQPage() {
  const navigate = useNavigate();
  const createRFQ = useAuctionStore((state) => state.createRFQ);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload) {
    setError(null);
    setIsSubmitting(true);

    try {
      await createRFQ(payload);
      navigate("/auctions");
    } catch (submissionError) {
      setError(submissionError?.error || "Unable to create auction");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl animate-fade-in space-y-5">
        <button
          type="button"
          onClick={() => navigate("/auctions")}
          className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-all hover:bg-white/80 hover:text-surface-900"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Auctions
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">Create Auction</h1>
          <p className="mt-1 text-sm text-surface-600">
            Configure a British Auction RFQ with trigger windows, extension rules, and
            procurement timing.
          </p>
        </div>
        <CreateRFQForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
      </div>
    </PageWrapper>
  );
}
