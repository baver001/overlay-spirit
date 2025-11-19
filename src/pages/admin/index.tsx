import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { DashboardPage } from "./routes/DashboardPage";
import { CategoriesPage } from "./routes/CategoriesPage";
import { SetsPage } from "./routes/SetsPage";
import { UsersPage } from "./routes/UsersPage";
import { PurchasesPage } from "./routes/PurchasesPage";
import { SettingsPage } from "./routes/SettingsPage";

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="sets" element={<SetsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;

