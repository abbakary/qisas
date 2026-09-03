import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import { RequireAuth, RequireAdmin, RedirectRoot } from "./components/AuthGuards";

// Pages
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import IdentifierCheckPage from "./pages/IdentifierCheckPage";
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryDetailPage from "./pages/CategoryDetailPage";
import SeriesDetailPage from "./pages/SeriesDetailPage";
import PlayerPage from "./pages/PlayerPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import CategoriesAdminPage from "./pages/admin/CategoriesAdminPage";
import NewCategoryPage from "./pages/admin/NewCategoryPage";
import SeriesAdminPage from "./pages/admin/SeriesAdminPage";
import NewSeriesPage from "./pages/admin/NewSeriesPage";
import ManageSeriesEpisodesPage from "./pages/admin/ManageSeriesEpisodesPage";
import EpisodesAdminPage from "./pages/admin/EpisodesAdminPage";
import NewEpisodePage from "./pages/admin/NewEpisodePage";
import ContentRulesAuditPage from "./pages/admin/ContentRulesAuditPage";
import AiContentGeneratorPage from "./pages/admin/AiContentGeneratorPage";
import VideosPage from "./pages/admin/VideosPage";
import NewVideoPage from "./pages/admin/NewVideoPage";
import VideoJobEditorPage from "./pages/admin/VideoJobEditorPage";
import CommunityAdminPage from "./pages/admin/CommunityAdminPage";
import CommentsAdminPage from "./pages/admin/CommentsAdminPage";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import SubscriptionsAdminPage from "./pages/admin/SubscriptionsAdminPage";
import NotificationsAdminPage from "./pages/admin/NotificationsAdminPage";
import SystemAdminPage from "./pages/admin/SystemAdminPage";

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RedirectRoot />} />

      {/* Auth & Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/identifier-check" element={<IdentifierCheckPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Standalone Player */}
      <Route
        path="/player/:episodeId"
        element={
          <RequireAuth>
            <PlayerPage />
          </RequireAuth>
        }
      />

      {/* Main App Layout */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<CategoryDetailPage />} />
        <Route path="/series/:slug" element={<SeriesDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Layout */}
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/categories" element={<CategoriesAdminPage />} />
        <Route path="/admin/categories/new" element={<NewCategoryPage />} />
        <Route path="/admin/series" element={<SeriesAdminPage />} />
        <Route path="/admin/series/new" element={<NewSeriesPage />} />
        <Route path="/admin/series/:slug" element={<ManageSeriesEpisodesPage />} />
        <Route path="/admin/episodes" element={<EpisodesAdminPage />} />
        <Route path="/admin/episodes/new" element={<NewEpisodePage />} />
        <Route path="/admin/content-rules" element={<ContentRulesAuditPage />} />
        <Route path="/admin/ai-studio" element={<AiContentGeneratorPage />} />
        <Route path="/admin/videos" element={<VideosPage />} />
        <Route path="/admin/videos/new" element={<NewVideoPage />} />
        <Route path="/admin/videos/:id" element={<VideoJobEditorPage />} />
        <Route path="/admin/community" element={<CommunityAdminPage />} />
        <Route path="/admin/comments" element={<CommentsAdminPage />} />
        <Route path="/admin/users" element={<UsersAdminPage />} />
        <Route path="/admin/subscriptions" element={<SubscriptionsAdminPage />} />
        <Route path="/admin/notifications" element={<NotificationsAdminPage />} />
        <Route path="/admin/system" element={<SystemAdminPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
