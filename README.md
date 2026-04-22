# 🗞️ الشارع المصري — EG Street News

> منصة إخبارية رقمية عصرية — **Egypt's Premier Digital News Platform**

[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://egstreet-psi.vercel.app)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react)](https://react.dev)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Animations | Framer Motion v12 |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |
| Routing | React Router v6 |
| State | TanStack Query v5 |
| Deployment | Vercel |

---

## 📁 Folder Architecture

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Sticky header, search, dark mode
│   │   ├── Footer.tsx          # Footer with links and newsletter
│   │   └── AdminLayout.tsx     # Admin panel wrapper
│   ├── news/
│   │   ├── BreakingTicker.tsx  # Animated breaking news ticker
│   │   ├── NewsCard.tsx        # Reusable article card
│   │   └── HeroGrid.tsx        # Homepage hero section
│   ├── ui/                     # shadcn/ui primitives
│   ├── SEOHead.tsx             # Dynamic meta tags
│   └── SocialShareButtons.tsx  # Share: WhatsApp, FB, Twitter, Telegram
│
├── pages/
│   ├── Index.tsx               # 🏠 Homepage — Hero, Trending, Categories
│   ├── ArticlePage.tsx         # 📰 Article — Reading progress, TTS, Related
│   ├── CategoryPage.tsx        # 📂 Category archive with filters
│   ├── SearchPage.tsx          # 🔍 Full-text search
│   ├── Auth.tsx                # 🔐 Login / Register
│   └── admin/
│       ├── DashboardOverview.tsx
│       ├── ArticleManagement.tsx
│       ├── ArticleEditor.tsx   # ✍️ Rich editor + Unsplash image picker
│       ├── UserManagement.tsx  # 👥 Invite by email + roles + permissions
│       ├── AnalyticsDashboard.tsx
│       └── ...
│
├── contexts/
│   ├── AuthContext.tsx          # Supabase Auth
│   ├── LanguageContext.tsx      # AR/EN i18n
│   └── ThemeContext.tsx         # Dark/Light mode
│
├── hooks/
│   ├── usePermissions.tsx      # Role-based access control
│   └── useArticles.tsx         # Data fetching hooks
│
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase client
│       └── types.ts            # Database types
│
└── styles/
    ├── globals.css             # Base styles + Arabic typography
    └── article.css             # Article body prose styles
```

---

## 🗄️ Database Schema

### Core Tables
```sql
articles       — المقالات (title, slug, content, status, views, featured_image)
categories     — الأقسام (name_ar, name_en, slug, color)
breaking_news  — الأخبار العاجلة (title, is_active)
profiles       — بيانات المستخدمين (display_name, avatar_url)
user_roles     — الأدوار والصلاحيات (role, permissions JSON)
subscribers    — المشتركين في النشرة البريدية
advertisements — الإعلانات
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/DrGohar1/egstreet.git
cd egstreet
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://neojditfucitnovcfspw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_KEY=your_service_key
```

### 3. Run Development
```bash
npm run dev
# → http://localhost:5173
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

---

## 👥 User Roles & Permissions

| Role | صلاحيات |
|---|---|
| `super_admin` | كل الصلاحيات |
| `editor_in_chief` | تحرير المحتوى + إحصائيات |
| `journalist` | كتابة مقالاته فقط |
| `ads_manager` | الإعلانات + الإحصائيات |

**Invite Flow:** Admin → UserManagement → دعوة بالإيميل → يستلم رابط → يختار كلمة السر

---

## 📱 Key Features

- ✅ **Responsive** — Mobile-first + Bottom Navigation
- ✅ **Dark Mode** — كامل ومتكامل
- ✅ **Breaking Ticker** — شريط الأخبار العاجلة المتحرك
- ✅ **Text-to-Speech** — الاستماع للخبر
- ✅ **Reading Progress** — مؤشر تقدم القراءة
- ✅ **Image Picker** — Unsplash search + upload + URL
- ✅ **SEO Optimized** — Open Graph + Twitter Cards
- ✅ **Analytics Dashboard** — إحصائيات المشاهدات
- ✅ **Automation Center** — RSS + Newsletter + Auto-publish
- ✅ **Role-based Access** — صلاحيات دقيقة لكل مستخدم

---

## 📋 Git Commit Strategy

```bash
# 1. Initialize project foundation
git commit -m "init: Vite + React + TypeScript + Tailwind scaffold"

# 2. Database & auth layer
git commit -m "feat(db): Supabase schema — articles, categories, users, roles"

# 3. Core UI components
git commit -m "feat(ui): Header, Footer, NewsCard, BreakingTicker, SEOHead"

# 4. Public pages
git commit -m "feat(pages): Homepage, ArticlePage, CategoryPage, SearchPage"

# 5. Admin panel
git commit -m "feat(admin): Dashboard, ArticleEditor, UserManagement, Analytics"
```

---

## 🎨 Design System

### Colors
```css
--primary: #e11d48;          /* أحمر إخباري */
--background: #ffffff;       /* أبيض صريح */
--card: #f9fafb;             /* رمادي فاتح */
--foreground: #111827;       /* أسود عميق */
--muted: #f3f4f6;            /* رمادي للخلفيات */
--border: #e5e7eb;           /* حدود خفية */
```

### Typography
```css
/* Headers */    font-family: 'Cairo', 'Tajawal', sans-serif;
/* Body text */  font-family: 'Noto Naskh Arabic', 'Amiri', serif;
/* Monospace */  font-family: 'JetBrains Mono', monospace;
```

---

> Built with ❤️ by **Dr. Gohar** — EG Street News Team
