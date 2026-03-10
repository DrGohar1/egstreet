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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import SavedArticlesPage from "./pages/SavedArticlesPage";
import NewsletterPopup from "./components/NewsletterPopup";

const queryClient = new QueryClient();

const AppContent = () => {
  useContentProtection();
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/page/:slug" element={<StaticPage />} />
        <Route path="/author/:userId" element={<AuthorPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<AdminLayout><DashboardOverview /></AdminLayout>} />
        <Route path="/dashboard/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
        <Route path="/dashboard/articles" element={<AdminLayout><ArticleManagement /></AdminLayout>} />
        <Route path="/dashboard/categories" element={<AdminLayout><CategoryManagement /></AdminLayout>} />
        <Route path="/dashboard/breaking" element={<AdminLayout><BreakingNewsManagement /></AdminLayout>} />
        <Route path="/dashboard/settings" element={<AdminLayout><SiteSettings /></AdminLayout>} />
        <Route path="/dashboard/subscribers" element={<AdminLayout><SubscriberManagement /></AdminLayout>} />
        <Route path="/dashboard/comments" element={<AdminLayout><CommentManagement /></AdminLayout>} />
        <Route path="/dashboard/analytics" element={<AdminLayout><AnalyticsDashboard /></AdminLayout>} />
        <Route path="/dashboard/pages" element={<AdminLayout><PageManagement /></AdminLayout>} />
        <Route path="/dashboard/tags" element={<AdminLayout><TagManagement /></AdminLayout>} />
        <Route path="/dashboard/advertisements" element={<AdminLayout><AdvertisementManagement /></AdminLayout>} />
        <Route path="/dashboard/permissions" element={<AdminLayout><PermissionManagement /></AdminLayout>} />
        <Route path="/dashboard/ai/scraper" element={<AdminLayout><NewsScraperPage /></AdminLayout>} />
        <Route path="/dashboard/ai/tools" element={<AdminLayout><AIToolsPage /></AdminLayout>} />
        <Route path="/saved" element={<SavedArticlesPage />} />
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
