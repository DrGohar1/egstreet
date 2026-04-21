<div align="center">

# 🗞️ جريدة الشارع المصري
### EgStreet News — صحافة تضرم عقلك

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-egstreet.vercel.app-D90221?style=for-the-badge)](https://egstreet.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> منصة إخبارية مصرية مستقلة مبنية بأحدث تقنيات الويب.
> Full-stack Arabic news platform with real-time updates, admin dashboard, AI tools & PWA.

</div>

---

## ✨ المميزات الرئيسية

### 🎯 للقارئ
- 📰 **صفحة رئيسية** — Bento Hero layout، أقسام مصنفة، آخر الأخبار، الأكثر قراءة
- ⚡ **أخبار عاجلة** — شريط متحرك Real-time
- 🌙 **Dark/Light Mode** — تلقائي مع toggle
- 🌐 **ثنائي اللغة** — عربي RTL + إنجليزي LTR
- 🔍 **بحث متقدم** — Full Text Search
- 💾 **حفظ المقالات** — للمستخدمين المسجلين
- 💬 **تعليقات** — مع Moderation كامل
- 📤 **مشاركة** — Facebook / Twitter / WhatsApp / Copy
- 📱 **PWA** — تثبيت على الموبايل كتطبيق كامل
- 📊 **شريط تقدم القراءة** — يظهر أعلى كل مقال

### 🛠️ للمدير والمحرر
- 🔒 **Admin مخفي** — على `/eg-control-2026`
- 🔔 **إشعارات Realtime** — مقالات / تعليقات / يوزرز جدد
- ✍️ **TipTap Editor** — محرر نصوص احترافي
- 🔗 **Slug ذكي** — تلقائي `article-XXXXXX` أو يدوي
- 📊 **تحليلات** — مشاهدات يومية وإحصاءات
- 👥 **إدارة مستخدمين** — أدوار متعددة
- 💰 **إعلانات** — مع تتبع Impressions & Clicks
- 🤖 **AI Tools** — توليد محتوى وتلخيص
- 🗞️ **News Scraper** — سحب أخبار تلقائي
- 💾 **Backup & Restore**

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite 6 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Routing** | React Router DOM v6 |
| **State** | TanStack Query v5 |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Rich Text** | TipTap Editor |
| **PWA** | Vite PWA Plugin |
| **Fonts** | Cairo + Amiri (Google Fonts) |

---

## 🚀 البدء السريع

```bash
# 1. Clone
git clone https://github.com/DrGohar1/egstreet.git
cd egstreet

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Edit: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Database
# Run docs/supabase-schema.sql in Supabase SQL Editor

# 5. Run
npm run dev
```

### إنشاء أول Admin
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid', 'super_admin');
```

---

## 🔑 Kill Switch — نظام التحكم في المميزات

| المفتاح | الميزة | الافتراضي |
|---------|--------|:-:|
| `feature_comments` | التعليقات | ✅ |
| `feature_newsletter` | النشرة البريدية | ✅ |
| `feature_breaking_ticker` | شريط الأخبار العاجلة | ✅ |
| `feature_ads` | الإعلانات | ✅ |
| `feature_saved_articles` | حفظ المقالات | ✅ |
| `feature_social_share` | المشاركة الاجتماعية | ✅ |
| `feature_copy_protection` | حماية المحتوى | ✅ |
| `feature_ai_tools` | أدوات AI | 🔒 |
| `feature_news_scraper` | سحب الأخبار | 🔒 |

---

## 📁 الهيكل

```
egstreet/
├── src/
│   ├── App.tsx              # Routes
│   ├── components/admin/    # Dashboard components
│   ├── hooks/               # Custom hooks
│   ├── pages/admin/         # 16 admin pages
│   └── integrations/        # Supabase client
├── public/                  # Static assets
├── docs/                    # Documentation
├── AGENT_PROMPT.md          # AI deployment guide
└── README.md
```

---

## 🚢 النشر

```bash
npm run build
npx vercel --prod
```

---

## 👥 الفريق

| الدور | الاسم |
|-------|-------|
| **رئيس مجلس الإدارة** | د. هشام القريبي |
| **رئيس التحرير** | سيد بغدادي |
| **السياسة التحريرية** | د. محمود توفيق عليوة |
| **تطوير وبرمجة** | **د. سعيد جوهر** |

---

## 📜 Changelog — آخر التحديثات (أبريل 2026)

- ✅ Admin route مخفي على `/eg-control-2026`
- ✅ نظام إشعارات Realtime كامل
- ✅ لوحة إشعارات أنيقة مع badge
- ✅ Slug تلقائي `article-XXXXXX` + يدوي
- ✅ شريط تقدم القراءة
- ✅ Skeleton loading للمقالات
- ✅ زر حفظ المقال 🔖
- ✅ Image fallback للصور المكسورة
- ✅ Default OG image للمشاركة

---

<div align="center">

**صُنع بـ ❤️ في مصر 🇪🇬**

[![GitHub stars](https://img.shields.io/github/stars/DrGohar1/egstreet?style=social)](https://github.com/DrGohar1/egstreet/stargazers)

</div>
