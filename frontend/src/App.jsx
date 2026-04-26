import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuctionDetailPage from "./pages/AuctionDetailPage";
import AuctionListPage from "./pages/AuctionListPage";
import CreateRFQPage from "./pages/CreateRFQPage";

/**
 * Defines the application routing tree.
 *
 * @returns {JSX.Element} The root application component.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auctions" replace />} />
        <Route path="/auctions" element={<AuctionListPage />} />
        <Route path="/auctions/:id" element={<AuctionDetailPage />} />
        <Route path="/create" element={<CreateRFQPage />} />
      </Routes>
    </BrowserRouter>
  );
}
