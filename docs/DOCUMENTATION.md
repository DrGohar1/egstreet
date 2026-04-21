# 📚 EgStreet — Technical Documentation
> جريدة الشارع المصري | Full-Stack Arabic News Platform

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Pages   │  │Components│  │ Contexts │  │ Hooks  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│         │              │           │             │       │
│         └──────────────┴───────────┴─────────────┘      │
│                              │                           │
│                    Supabase Client SDK                   │
└─────────────────────────────┬───────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │        SUPABASE BACKEND        │
              │                               │
              │  ┌──────────┐  ┌───────────┐  │
              │  │PostgreSQL│  │  Storage  │  │
              │  │  + RLS   │  │  Buckets  │  │
              │  └──────────┘  └───────────┘  │
              │  ┌──────────┐  ┌───────────┐  │
              │  │   Auth   │  │ Realtime  │  │
              │  └──────────┘  └───────────┘  │
              └───────────────────────────────┘
```

---

## 🗂️ Project Structure

```
egstreet/
├── src/
│   ├── App.tsx                    # Routes + Providers setup
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles + CSS variables
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx    # Dashboard shell (header + sidebar)
│   │   │   ├── AdminSidebar.tsx   # Navigation sidebar (RTL)
│   │   │   ├── NotificationsPanel.tsx  # Bell icon + notifications list
│   │   │   ├── RichTextEditor.tsx # TipTap WYSIWYG editor
│   │   │   ├── ImageUploader.tsx  # Supabase Storage uploader
│   │   │   └── ArticleWorkflow.tsx # Draft/Review/Publish workflow
│   │   │
│   │   ├── ui/                    # shadcn/ui components (DO NOT EDIT)
│   │   ├── ArticleCard.tsx        # Card variants: hero/standard/compact/list
│   │   ├── Header.tsx             # Site header + nav + search
│   │   ├── Footer.tsx             # Footer + developer credit
│   │   ├── SEOHead.tsx            # Meta tags + OG + Twitter cards
│   │   ├── CategoryNav.tsx        # Horizontal category bar
│   │   ├── BreakingTicker.tsx     # Scrolling breaking news bar
│   │   ├── CommentSection.tsx     # Comments with moderation
│   │   ├── MostReadWidget.tsx     # Most viewed sidebar widget
│   │   ├── SocialShareButtons.tsx # FB/Twitter/WhatsApp/Copy
│   │   ├── NewsletterPopup.tsx    # Email subscription popup
│   │   ├── AdBanner.tsx           # Advertisement banner
│   │   └── NavLink.tsx            # Active-aware router link
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx        # useAuth() — user, signIn, signOut
│   │   ├── LanguageContext.tsx    # useLanguage() — t(), language, dir
│   │   └── ThemeContext.tsx       # useTheme() — dark/light mode
│   │
│   ├── hooks/
│   │   ├── useNotifications.ts   # Realtime notifications (Supabase)
│   │   ├── useSiteSettings.ts    # Site-wide settings from DB
│   │   ├── useFeatureFlags.ts    # Kill switch per feature
│   │   ├── useContentProtection.ts # Copy/right-click protection
│   │   └── useArticleCache.ts    # TanStack Query cache layer
│   │
│   ├── pages/
│   │   ├── Index.tsx             # Homepage — Bento hero + sections
│   │   ├── ArticlePage.tsx       # Single article — enhanced UI
│   │   ├── CategoryPage.tsx      # Category listing
│   │   ├── SearchPage.tsx        # Full-text search
│   │   ├── StaticPage.tsx        # About/Contact/Privacy pages
│   │   ├── AuthorPage.tsx        # Author profile + articles
│   │   ├── TagPage.tsx           # Tag listing
│   │   ├── SavedArticlesPage.tsx # User saved articles
│   │   ├── Auth.tsx              # Login / Register
│   │   ├── ResetPassword.tsx     # Password reset
│   │   ├── UserProfile.tsx       # User profile editor
│   │   ├── NotFound.tsx          # 404 page
│   │   │
│   │   └── admin/                # 16 Admin pages
│   │       ├── DashboardOverview.tsx
│   │       ├── ArticleManagement.tsx   # + slug field
│   │       ├── CategoryManagement.tsx
│   │       ├── TagManagement.tsx
│   │       ├── BreakingNewsManagement.tsx
│   │       ├── UserManagement.tsx
│   │       ├── PermissionManagement.tsx
│   │       ├── CommentManagement.tsx
│   │       ├── SubscriberManagement.tsx
│   │       ├── AdvertisementManagement.tsx
│   │       ├── AnalyticsDashboard.tsx
│   │       ├── PageManagement.tsx
│   │       ├── SiteSettings.tsx
│   │       ├── NewsScraperPage.tsx
│   │       ├── AIToolsPage.tsx
│   │       └── BackupRestore.tsx
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts         # Supabase client init
│           └── types.ts          # Auto-generated DB types
│
├── public/
│   ├── og-image.png              # ⚠️ ADD: 1200×630px share image
│   ├── pwa-192.png               # PWA icon small
│   ├── pwa-512.png               # PWA icon large
│   ├── favicon.ico               # Browser favicon
│   └── robots.txt                # SEO robots file
│
├── supabase/
│   └── migrations/               # DB migration files
│
├── docs/
│   ├── DOCUMENTATION.md          # This file
│   └── supabase-schema.sql       # Full DB schema
│
├── vite.config.ts                # Vite + PWA config
├── tailwind.config.ts            # Tailwind theme
├── .env.example                  # Environment template
├── SETUP.md                      # Setup guide
├── AGENT_PROMPT.md               # AI agent deployment guide
└── README.md                     # Project overview
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `articles` | Main articles table |
| `categories` | Article categories |
| `tags` | Article tags |
| `article_categories` | Many-to-many: articles ↔ categories |
| `article_tags` | Many-to-many: articles ↔ tags |
| `profiles` | User profiles (extends auth.users) |
| `user_roles` | RBAC roles per user |
| `comments` | Article comments |
| `comment_likes` | Likes on comments |
| `breaking_news` | Breaking news ticker items |
| `advertisements` | Ad slots and creatives |
| `subscribers` | Newsletter subscribers |
| `pages` | Static pages (About, Contact…) |
| `site_settings` | Key-value site configuration |
| `article_saves` | User-saved articles |
| `daily_article_views` | Per-day view tracking |

### articles Table

```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,      -- auto: "article-XXXXXX" or custom
  content         TEXT,
  excerpt         TEXT,
  featured_image  TEXT,                      -- Supabase Storage URL
  status          TEXT DEFAULT 'draft',      -- draft | review | published
  is_breaking     BOOLEAN DEFAULT false,
  views_count     INTEGER DEFAULT 0,
  category_id     UUID REFERENCES categories(id),
  author_id       UUID REFERENCES auth.users(id),
  custom_author_name TEXT,                   -- override display name
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### User Roles

```sql
-- Roles: super_admin | editor_in_chief | journalist | ads_manager | reader
CREATE TABLE user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL,
  UNIQUE(user_id, role)
);
```

---

## 🔑 Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# Optional (for AI features)
VITE_OPENAI_API_KEY=sk-...
VITE_NEWS_API_KEY=...
```

---

## 🪝 Custom Hooks Reference

### `useNotifications()`
```typescript
// Returns realtime notifications from Supabase
const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
// Subscribes to: articles INSERT, comments INSERT, profiles INSERT
// Triggers browser Push Notification if permission granted
```

### `useLanguage()`
```typescript
const { t, language, setLanguage } = useLanguage();
// t("عربي", "English") — returns based on current language
// language: "ar" | "en"
// Saves preference to localStorage
```

### `useAuth()`
```typescript
const { user, loading, signIn, signOut, signUp } = useAuth();
// user: Supabase User object or null
// Auto-refreshes session
```

### `useSiteSettings()`
```typescript
const { settings, updateSetting } = useSiteSettings();
// settings.site_name, settings.logo_url, settings.footer_message
// settings.feature_comments (kill switch), etc.
```

### `useFeatureFlags()`
```typescript
const { isEnabled } = useFeatureFlags();
isEnabled("comments")        // true/false — controlled from Admin
isEnabled("news_scraper")    // true/false
isEnabled("ai_tools")        // true/false
```

---

## 🛣️ Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Index | Public |
| `/article/:slug` | ArticlePage | Public |
| `/category/:slug` | CategoryPage | Public |
| `/search` | SearchPage | Public |
| `/page/:slug` | StaticPage | Public |
| `/author/:userId` | AuthorPage | Public |
| `/tag/:slug` | TagPage | Public |
| `/auth` | Auth | Public |
| `/reset-password` | ResetPassword | Public |
| `/profile` | UserProfile | Auth Required |
| `/saved` | SavedArticlesPage | Auth Required |
| `/eg-control-2026` | DashboardOverview | Admin Only |
| `/eg-control-2026/articles` | ArticleManagement | Admin Only |
| `/eg-control-2026/users` | UserManagement | Admin Only |
| … (13 more admin routes) | … | Admin Only |

---

## 🔔 Notifications System

```
Supabase Realtime Channels
        │
        ├── admin-articles  → INSERT on articles  → "مقال جديد 📰"
        │                  → UPDATE is_breaking   → "خبر عاجل 🚨"
        ├── admin-comments  → INSERT on comments  → "تعليق جديد 💬"
        └── admin-users     → INSERT on profiles  → "مستخدم جديد 👤"
                │
                ▼
        useNotifications() hook
                │
                ├── Updates badge count (Bell icon)
                ├── Adds to notifications list (max 50)
                └── Triggers browser Push Notification (if permitted)
```

---

## 📰 Article Slug System

| Mode | Format | Example |
|------|--------|---------|
| Auto (default) | `article-XXXXXX` | `article-847291` |
| Custom (manual) | user-defined | `cairo-metro-line-4-2026` |

Logic in `ArticleManagement.tsx`:
```typescript
const articleNum = Date.now().toString().slice(-6);
const slug = customSlugVal
  ? customSlugVal.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF-]+/g, "-").slice(0, 100)
  : "article-" + articleNum;
```

---

## 🖼️ Image Handling

### Problem & Fix
All `<img>` tags in `ArticleCard` have `onError` fallback:
```tsx
<img
  src={featuredImage}
  alt={title}
  loading="lazy"
  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
/>
```

### Required `public/` Assets
| File | Size | Purpose |
|------|------|---------|
| `og-image.png` | 1200×630px | Social share thumbnail |
| `pwa-192.png` | 192×192px | PWA icon (small) |
| `pwa-512.png` | 512×512px | PWA icon (large) |
| `favicon.ico` | 32×32px | Browser tab icon |
| `placeholder.svg` | any | Fallback for broken images |

---

## 🚀 Deployment Checklist

```bash
# 1. Build
npm run build

# 2. Check build output
ls dist/

# 3. Deploy to Vercel
npx vercel --prod

# 4. Supabase: Enable Realtime on tables
# Dashboard → Database → Replication → Enable for:
# - articles, comments, profiles
```

### Vercel Environment Variables
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

---

## 🔒 Security Notes

- Admin route is `/eg-control-2026` — not `/admin`
- All admin pages check `useAuth()` and redirect to `/auth` if not logged in
- RLS policies on Supabase prevent unauthorized DB access
- Content protection: right-click disabled, text selection blocked (configurable)

---

## 🤝 How to Add a New Feature

1. **DB change?** → Add migration in `supabase/migrations/`
2. **New page?** → Create in `src/pages/`, add route in `App.tsx`
3. **Admin page?** → Add to `src/pages/admin/`, add route in `App.tsx`, add to `AdminSidebar.tsx`
4. **Kill switch needed?** → Add key to `site_settings` table, check with `useFeatureFlags()`
5. **New hook?** → Add to `src/hooks/`, export from `useNotifications.ts` pattern

---

*آخر تحديث: أبريل 2026 | تطوير: د. سعيد جوهر*
