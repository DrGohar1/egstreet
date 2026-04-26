import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCard from "@/components/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

const SearchPage = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("cat") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date");
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      let q = supabase
        .from("articles")
        .select("*")
        .eq("status", "published");

      if (query.trim()) {
        q = q.ilike("title", `%${query.trim()}%`);
      }
      if (categoryFilter && categoryFilter !== "all") {
        q = q.eq("category_id", categoryFilter);
      }
      if (sortBy === "views") {
        q = q.order("views", { ascending: false });
      } else {
        q = q.order("published_at", { ascending: false });
      }
      q = q.limit(50);

      const { data } = await q;
      setArticles(data || []);
      setLoading(false);
    };
    search();
  }, [query, categoryFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query, cat: categoryFilter, sort: sortBy });
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return undefined;
    const cat = categories.find((c: any) => c.id === catId);
    return cat ? (language === "ar" ? cat.name_ar : cat.name_en) : undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("البحث", "Search")} description={t("ابحث في الأخبار", "Search news")} />
      <Header />
      <main className="container py-8">
        <h1 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          {t("البحث المتقدم", "Advanced Search")}
        </h1>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("ابحث عن خبر...", "Search for news...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="gap-1">
              <Search className="w-4 h-4" />
              {t("بحث", "Search")}
            </Button>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("كل الأقسام", "All Categories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("كل الأقسام", "All Categories")}</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {language === "ar" ? c.name_ar : c.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t("الأحدث", "Newest")}</SelectItem>
                <SelectItem value="views">{t("الأكثر مشاهدة", "Most Viewed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {articles.length} {t("نتيجة", "results")}
              {query && ` ${t("عن", "for")} "${query}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt || undefined}
                  slug={article.slug}
                  featuredImage={article.featured_image || undefined}
                  categoryName={getCategoryName(article.category_id)}
                  publishedAt={article.published_at || undefined}
                />
              ))}
            </div>
            {articles.length === 0 && (
              <p className="text-center py-12 text-muted-foreground">{t("لا توجد نتائج", "No results found")}</p>
            )}
          </>
        )}
      </main>
      
    </div>
      <Footer />
  );
};

export default SearchPage;
