import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

const CategoryNav = ({ categories, activeSlug }: CategoryNavProps) => {
  const { language } = useLanguage();

  return (
    <nav className="nav-gradient z-40">
      <div className="container">
        <ul className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/category/${cat.slug}`}
                className={`block px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeSlug === cat.slug
                    ? "text-nav-accent border-b-2 border-nav-accent"
                    : "text-nav-foreground hover:text-nav-accent"
                }`}
              >
                {language === "ar" ? cat.name_ar : cat.name_en}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
