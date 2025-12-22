import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AccountLayout } from "./layout/AccountLayout";
import { AccountDashboard } from "./routes/AccountDashboard";
import { AccountPurchases } from "./routes/AccountPurchases";
import { AccountProfile } from "./routes/AccountProfile";

export const AccountRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AccountLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AccountDashboard />} />
        <Route path="purchases" element={<AccountPurchases />} />
        <Route path="profile" element={<AccountProfile />} />
      </Route>
    </Routes>
  );
};

export default AccountRoutes;

