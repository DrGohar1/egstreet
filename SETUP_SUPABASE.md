# 🔗 ربط Supabase بالمشروع — دليل 5 دقائق

## المشكلة
أنا (AI) مش قادر أوصل Supabase مباشرة لأن:
- محتاج **Service Role Key** سري جداً
- لازم يكون في بيئة Supabase نفسها

**الحل:** أنا بكتب الكود كاملاً، وانت بتشغّله خطوة واحدة 🎯

---

## الخطوة 1 — Migration (جداول جديدة)

### افتح:
**app.supabase.com → مشروعك → SQL Editor → New Query**

### الصق وشغّل:

```sql
-- ========================================
-- EgStreet: visitor_logs + daily_views fix
-- ========================================

-- 1. Visitor Logs Table
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    TEXT,
  country_code  TEXT DEFAULT 'XX',
  city          TEXT,
  page_path     TEXT DEFAULT '/',
  device_type   TEXT DEFAULT 'desktop',
  browser       TEXT DEFAULT 'Other',
  referrer      TEXT,
  visited_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fix daily_views: add country_code column
ALTER TABLE public.daily_views
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'EG';

-- 3. Unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS daily_views_date_country_idx
  ON public.daily_views (view_date, country_code);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitor_logs_time
  ON public.visitor_logs (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country
  ON public.visitor_logs (country_code);

-- 5. RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service insert visitor_logs" ON public.visitor_logs;
CREATE POLICY "Service insert visitor_logs"
  ON public.visitor_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read visitor_logs" ON public.visitor_logs;
CREATE POLICY "Admin read visitor_logs"
  ON public.visitor_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'editor_in_chief')
    )
  );

-- Done!
SELECT '✅ Migration completed!' AS status;
```

---

## الخطوة 2 — Deploy Edge Functions

### افتح Terminal على جهازك وشغّل:

```bash
# ادخل على مجلد المشروع
cd egstreet

# لازم يكون عندك Supabase CLI
npm install -g supabase

# Login
supabase login

# Link المشروع
supabase link --project-ref YOUR_PROJECT_REF

# Deploy الـ functions
supabase functions deploy track-visitor
supabase functions deploy ai-rewrite
supabase functions deploy news-scraper
```

### إيه الـ project-ref؟
**Supabase Dashboard → Settings → General → Reference ID**
مثال: `abcdefghijklmnop`

---

## الخطوة 3 — Secrets (OpenAI Key)

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

أو من الـ Dashboard:
**Supabase → Edge Functions → Secrets → Add**

---

## الخطوة 4 — App.tsx (إضافة Tracking)

افتح `src/App.tsx` وأضف السطرين دول:

```tsx
// أضف في الـ imports
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

// أضف جوه AppContent — أول سطر
const AppContent = () => {
  useVisitorTracking(); // ← أضف هنا
  // ... باقي الكود
```

---

## الخطوة 5 — تأكيد الشغل

بعد deploy، افتح الموقع وروح:
**Admin → Analytics** وهتلاقي الزيارات بتتسجل

---

## 🚀 بديل أسرع — Lovable

لو المشروع على **lovable.dev**:
1. افتح المشروع
2. اكتب في الـ chat:
   > "Run the SQL migration in supabase/migrations/20260421_visitor_tracking.sql"
3. Lovable بيعمل كل حاجة تلقائي!

---

*أي مشكلة — ابعت الـ error وأنا أصلحه فوراً 💪*
