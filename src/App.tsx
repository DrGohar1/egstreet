import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import DashboardOverview from "./pages/admin/DashboardOverview";
import UserManagement from "./pages/admin/UserManagement";
import ArticleManagement from "./pages/admin/ArticleManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import BreakingNewsManagement from "./pages/admin/BreakingNewsManagement";
import SiteSettings from "./pages/admin/SiteSettings";
import SubscriberManagement from "./pages/admin/SubscriberManagement";
import CommentManagement from "./pages/admin/CommentManagement";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import PageManagement from "./pages/admin/PageManagement";
import TagManagement from "./pages/admin/TagManagement";
import AdvertisementManagement from "./pages/admin/AdvertisementManagement";
import PermissionManagement from "./pages/admin/PermissionManagement";
import NewsScraperPage from "./pages/admin/NewsScraperPage";
import AIToolsPage from "./pages/admin/AIToolsPage";
import BackupRestore from "./pages/admin/BackupRestore";
import SavedArticlesPage from "./pages/SavedArticlesPage";
import NewsletterPopup from "./components/NewsletterPopup";
import ResetPassword from "./pages/ResetPassword";
import UserProfile from "./pages/UserProfile";
import Auth from "./pages/Auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const ADMIN = "/admin-panel";
const ADMIN2 = "/Gadmin"; // alias

const AppContent = () => {
  useContentProtection();
  useVisitorTracking(); // Track page visits & IP
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/page/:slug" element={<StaticPage />} />
        <Route path="/author/:userId" element={<AuthorPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/saved" element={<SavedArticlesPage />} />
        {/* Admin */}
        <Route path={ADMIN} element={<AdminLayout><DashboardOverview /></AdminLayout>} />
        <Route path={`${ADMIN}/users`} element={<AdminLayout><UserManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/articles`} element={<AdminLayout><ArticleManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/categories`} element={<AdminLayout><CategoryManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/breaking`} element={<AdminLayout><BreakingNewsManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/settings`} element={<AdminLayout><SiteSettings /></AdminLayout>} />
        <Route path={`${ADMIN}/subscribers`} element={<AdminLayout><SubscriberManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/comments`} element={<AdminLayout><CommentManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/analytics`} element={<AdminLayout><AnalyticsDashboard /></AdminLayout>} />
        <Route path={`${ADMIN}/pages`} element={<AdminLayout><PageManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/tags`} element={<AdminLayout><TagManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/advertisements`} element={<AdminLayout><AdvertisementManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/permissions`} element={<AdminLayout><PermissionManagement /></AdminLayout>} />
        <Route path={`${ADMIN}/ai/scraper`} element={<AdminLayout><NewsScraperPage /></AdminLayout>} />
        <Route path={`${ADMIN}/ai/tools`} element={<AdminLayout><AIToolsPage /></AdminLayout>} />
        <Route path={`${ADMIN}/backup`} element={<AdminLayout><BackupRestore /></AdminLayout>} />
        {/* /Gadmin aliases */}
        <Route path={ADMIN2} element={<AdminLayout><DashboardOverview /></AdminLayout>} />
        <Route path={`${ADMIN2}/users`} element={<AdminLayout><UserManagement /></AdminLayout>} />
        <Route path={`${ADMIN2}/articles`} element={<AdminLayout><ArticleManagement /></AdminLayout>} />
        <Route path={`${ADMIN2}/breaking`} element={<AdminLayout><BreakingNewsManagement /></AdminLayout>} />
        <Route path={`${ADMIN2}/settings`} element={<AdminLayout><SiteSettings /></AdminLayout>} />
        <Route path={`${ADMIN2}/analytics`} element={<AdminLayout><AnalyticsDashboard /></AdminLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <NewsletterPopup />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
