import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import StaticPage from "./pages/StaticPage";
import AuthorPage from "./pages/AuthorPage";
import TagPage from "./pages/TagPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import { AdminGuard } from "./components/admin/AdminGuard";
import { lazy, Suspense } from "react";
import SavedArticlesPage from "./pages/SavedArticlesPage";

// ── Lazy-loaded admin pages (code splitting — faster initial load) ──
const DashboardOverview   = lazy(() => import("./pages/admin/DashboardOverview"));
const UserManagement      = lazy(() => import("./pages/admin/UserManagement"));
const ArticleManagement   = lazy(() => import("./pages/admin/ArticleManagement"));
const CategoryManagement  = lazy(() => import("./pages/admin/CategoryManagement"));
const BreakingNewsManagement = lazy(() => import("./pages/admin/BreakingNewsManagement"));
const SiteSettings        = lazy(() => import("./pages/admin/SiteSettings"));
const SubscriberManagement = lazy(() => import("./pages/admin/SubscriberManagement"));
const CommentManagement   = lazy(() => import("./pages/admin/CommentManagement"));
const AnalyticsDashboard  = lazy(() => import("./pages/admin/Analytics"));
const PageManagement      = lazy(() => import("./pages/admin/PageManagement"));
const TagManagement       = lazy(() => import("./pages/admin/TagManagement"));
const Advertisements      = lazy(() => import("./pages/admin/Advertisements"));
const PermissionManagement = lazy(() => import("./pages/admin/PermissionManagement"));
const NewsScraperPage     = lazy(() => import("./pages/admin/NewsScraperPage"));
const AIToolsPage         = lazy(() => import("./pages/admin/AIToolsPage"));
const BackupRestore       = lazy(() => import("./pages/admin/BackupRestore"));
const MediaManagement     = lazy(() => import("./pages/admin/MediaManagement"));
const AutomationPage      = lazy(() => import("./pages/admin/AutomationPage"));
const ArticleEditor       = lazy(() => import("./pages/admin/ArticleEditor"));
import NewsletterPopup from "./components/NewsletterPopup";
import Archive from "./pages/Archive";
import ResetPassword from "./pages/ResetPassword";
import UserProfile from "./pages/UserProfile";
import Auth from "./pages/Auth";
import ForceChangePassword from "./pages/ForceChangePassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const ADMIN = "/G63-admin";

const AppContent = () => {
  useContentProtection();
  useVisitorTracking(); // Track page visits & IP
  return (
    <>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}>
          <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/:categorySlug/:articleNumber" element={<ArticlePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/page/:slug" element={<StaticPage />} />
        <Route path="/author/:userId" element={<AuthorPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/G63-admin/login" element={<Auth />} />
        <Route path="/G63-admin/change-password" element={<ForceChangePassword />} />
        {/* Reset password via Supabase email only */}
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/saved" element={<SavedArticlesPage />} />
        <Route path="/archive" element={<Archive />} />
        {/* Admin */}
        <Route path={ADMIN} element={<AdminLayout><DashboardOverview /></AdminLayout>} />
        <Route path={`${ADMIN}/users`} element={<AdminLayout><AdminGuard permission="users"><UserManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/articles/new`} element={<AdminLayout><AdminGuard permission="articles.write"><ArticleEditor /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/articles/edit/:id`} element={<AdminLayout><AdminGuard permission="articles"><ArticleEditor /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/articles`} element={<AdminLayout><AdminGuard permission="articles"><ArticleManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/categories`} element={<AdminLayout><AdminGuard permission="categories"><CategoryManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/breaking`} element={<AdminLayout><AdminGuard permission="breaking_news"><BreakingNewsManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/settings`} element={<AdminLayout><AdminGuard permission="settings"><SiteSettings /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/subscribers`} element={<AdminLayout><AdminGuard permission="subscribers"><SubscriberManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/comments`} element={<AdminLayout><AdminGuard permission="comments"><CommentManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/analytics`} element={<AdminLayout><AdminGuard permission="analytics"><AnalyticsDashboard /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/pages`} element={<AdminLayout><AdminGuard permission="pages"><PageManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/tags`} element={<AdminLayout><AdminGuard permission="tags"><TagManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/advertisements`} element={<AdminLayout><AdminGuard permission="ads"><Advertisements /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/permissions`} element={<AdminLayout><AdminGuard permission="permissions"><PermissionManagement /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/ai/scraper`} element={<AdminLayout><AdminGuard permission="scraper"><NewsScraperPage /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/ai/tools`} element={<AdminLayout><AdminGuard permission="ai_tools"><AIToolsPage /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/automation`} element={<AdminLayout><AdminGuard permission="automation"><AutomationPage /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/backup`} element={<AdminLayout><AdminGuard permission="backup"><BackupRestore /></AdminGuard></AdminLayout>} />
        <Route path={`${ADMIN}/media`} element={<AdminLayout><AdminGuard permission="media.upload"><MediaManagement /></AdminGuard></AdminLayout>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
          </Suspense>
      <NewsletterPopup />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
      <PermissionsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </PermissionsProvider>
      </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
