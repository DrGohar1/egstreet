<div align="center">

<img src="https://raw.githubusercontent.com/DrGohar1/egstreet/main/public/og-image.png" alt="جريدة الشارع المصري" width="600" />

# 🗞️ جريدة الشارع المصري
### EgStreet News — صحافة تضرم عقلك

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-egstreet.vercel.app-D90221?style=for-the-badge)](https://egstreet.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> منصة إخبارية مصرية مستقلة مبنية بأحدث تقنيات الويب.  
> Full-stack Arabic news platform with real-time updates, admin dashboard, AI tools, and monetization features.

</div>

---

## 📸 Screenshots

| الصفحة الرئيسية | لوحة التحكم | صفحة المقال |
|:-:|:-:|:-:|
| ![Home](https://via.placeholder.com/380x220/1A1A1A/D90221?text=Home+Page) | ![Dashboard](https://via.placeholder.com/380x220/1A1A1A/D90221?text=Admin+Dashboard) | ![Article](https://via.placeholder.com/380x220/1A1A1A/D90221?text=Article+Page) |

---

## ✨ المميزات الرئيسية

### 🎯 للقارئ
- 📰 **صفحة رئيسية** — Bento Hero layout، أقسام مصنفة، آخر الأخبار، الأكثر قراءة
- ⚡ **أخبار عاجلة** — شريط متحرك Real-time مع تمييز Breaking بصري
- 🌙 **وضع ليلي / نهاري** — Dark/Light Mode تلقائي مع حفظ التفضيل
- 🌐 **ثنائي اللغة** — عربي + إنجليزي (Arabic RTL + English LTR)
- 🔍 **بحث متقدم** — Full Text Search عربي
- 💾 **حفظ المقالات** — للمستخدمين المسجلين
- 💬 **التعليقات** — نظام تعليقات متكامل مع Moderation
- 📤 **مشاركة اجتماعية** — Facebook / Twitter / WhatsApp / Copy Link
- 📱 **تصميم متجاوب** — Mobile-first، يعمل على كل الأجهزة

### 🛠️ للمحرر والمدير
- ✍️ **محرر نصوص غني** — TipTap Editor مع صور، روابط، تنسيق كامل
- 📁 **إدارة الأقسام والتاجات** — Categories & Tags management
- 🚨 **إدارة الأخبار العاجلة** — تحديد وإلغاء Breaking News فورياً
- 📊 **لوحة تحليلات** — مشاهدات يومية، أكثر المقالات قراءة، إحصاءات المستخدمين
- 👥 **إدارة المستخدمين** — أدوار متعددة (Super Admin / Editor / Journalist)
- 💰 **إدارة الإعلانات** — مواقع متعددة مع تتبع Impressions & Clicks
- 📧 **النشرة البريدية** — قائمة المشتركين مع إدارة كاملة
- 📄 **صفحات ثابتة** — من نحن / اتصل بنا / سياسة الخصوصية
- 🤖 **أدوات الذكاء الاصطناعي** — AI Tools للمحتوى
- 🗞️ **News Scraper** — جلب الأخبار تلقائياً
- 💾 **Backup & Restore** — نسخ احتياطي للبيانات

### 🔒 نظام الأمان
- ✅ Row Level Security (RLS) على Supabase لكل الجداول
- ✅ أدوار مستخدمين: `super_admin`, `editor_in_chief`, `journalist`, `ads_manager`
- ✅ حماية المحتوى من النسخ
- ✅ Kill Switch لكل ميزة مدفوعة

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite 6 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Routing** | React Router DOM v6 |
| **State / Server** | TanStack Query v5 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Rich Text** | TipTap Editor |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **PWA** | Vite PWA Plugin |
| **Fonts** | Cairo + Amiri (Google Fonts) |

---

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 18
- npm >= 9 أو bun
- حساب Supabase

### 1. استنساخ المشروع

```bash
git clone https://github.com/DrGohar1/egstreet.git
cd egstreet
npm install
```

### 2. إعداد Supabase

1. أنشئ مشروع جديد على [supabase.com](https://supabase.com)
2. من **SQL Editor** شغّل ملف `docs/supabase-schema.sql` كاملاً
3. خد الـ URL و API Key من Project Settings

### 3. متغيرات البيئة

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. التشغيل

```bash
npm run dev
# → http://localhost:5173
```

### 5. إنشاء أول Admin

بعد إنشاء حسابك عبر `/auth`، شغّل في Supabase SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'super_admin');
```

---

## 📁 هيكل المشروع

```
egstreet/
├── src/
│   ├── components/          # مكونات UI قابلة لإعادة الاستخدام
│   │   ├── admin/           # مكونات لوحة التحكم
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React Contexts (Auth, Language)
│   ├── hooks/               # Custom Hooks
│   │   ├── useFeatureFlags.ts   # 🔑 Kill Switch لكل الميزات
│   │   ├── useSiteSettings.ts   # إعدادات الموقع
│   │   └── useArticleCache.ts   # Cache للأداء
│   ├── integrations/
│   │   └── supabase/        # Client + Types
│   └── pages/
│       ├── admin/           # 16 صفحة لوحة تحكم
│       ├── Index.tsx        # الصفحة الرئيسية
│       ├── ArticlePage.tsx  # صفحة المقال
│       ├── CategoryPage.tsx # صفحة القسم
│       └── SearchPage.tsx   # البحث
├── supabase/
│   └── migrations/          # Database migrations
├── docs/
│   └── supabase-schema.sql  # Schema كامل
├── public/                  # Assets ثابتة
├── .env.example
└── SETUP.md                 # دليل الإعداد الكامل
```

---

## 🔑 Kill Switch — نظام التحكم في المميزات

كل ميزة قابلة للتفعيل/الإيقاف من **لوحة التحكم → Site Settings** بدون أي كود:

| المفتاح | الميزة | الحالة الافتراضية |
|---------|--------|:-:|
| `feature_comments` | نظام التعليقات | ✅ مفعّل |
| `feature_newsletter` | النشرة البريدية | ✅ مفعّل |
| `feature_breaking_ticker` | شريط الأخبار العاجلة | ✅ مفعّل |
| `feature_ads` | الإعلانات | ✅ مفعّل |
| `feature_saved_articles` | حفظ المقالات | ✅ مفعّل |
| `feature_social_share` | المشاركة الاجتماعية | ✅ مفعّل |
| `feature_copy_protection` | حماية المحتوى | ✅ مفعّل |
| `feature_ai_tools` | أدوات الذكاء الاصطناعي | 🔒 يحتاج ترقية |
| `feature_news_scraper` | جلب الأخبار تلقائياً | 🔒 يحتاج ترقية |
| `feature_advanced_search` | البحث المتقدم | 🔒 يحتاج ترقية |
| `feature_vip_notifications` | إشعارات VIP Push | 🔒 يحتاج ترقية |
| `feature_editor_analytics` | تحليلات المحرر | 🔒 يحتاج ترقية |

---

## 🚢 النشر على Vercel

```bash
# Build
npm run build

# Deploy
npx vercel --prod
```

أضف في Vercel → Environment Variables:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 🤝 المساهمة في المشروع

```bash
# 1. Fork المشروع
# 2. أنشئ فرع جديد
git checkout -b feature/your-feature-name

# 3. Commit تغييراتك
git commit -m "feat: add amazing feature"

# 4. Push
git push origin feature/your-feature-name

# 5. افتح Pull Request
```

---

## 📜 الترخيص

هذا المشروع مرخص تحت **MIT License** — راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 👥 فريق العمل

| الدور | الاسم |
|-------|-------|
| **رئيس مجلس الإدارة** | د. هشام القريبي |
| **رئيس التحرير** | سيد بغدادي |
| **تغطية شاملة والسياسة التحريرية** | د. محمود توفيق عليوة |
| **تطوير التقني** | DrGohar1 |

---

<div align="center">

**جريدة الشارع المصري — صحافة تضرم عقلك**

[![GitHub stars](https://img.shields.io/github/stars/DrGohar1/egstreet?style=social)](https://github.com/DrGohar1/egstreet/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DrGohar1/egstreet?style=social)](https://github.com/DrGohar1/egstreet/network/members)
[![GitHub issues](https://img.shields.io/github/issues/DrGohar1/egstreet)](https://github.com/DrGohar1/egstreet/issues)

صُنع بـ ❤️ في مصر 🇪🇬

</div>
