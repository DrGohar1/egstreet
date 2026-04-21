# 🤖 EgStreet — Agent Deployment Prompt

## المهمة
أنت AI agent مسؤول عن تطبيق patch كامل على مشروع EgStreet (جريدة الشارع المصري).
المشروع React + TypeScript + Vite + Supabase على GitHub: https://github.com/DrGohar1/egstreet

## خطوات العمل بالترتيب

### الخطوة 1 — تحقق من المسارات
```
egstreet/
├── src/
│   ├── App.tsx                              ← يُستبدل
│   ├── components/
│   │   ├── ArticleCard.tsx                  ← يُستبدل
│   │   ├── Footer.tsx                       ← يُستبدل
│   │   ├── SEOHead.tsx                      ← يُستبدل
│   │   └── admin/
│   │       ├── AdminLayout.tsx              ← يُستبدل
│   │       ├── AdminSidebar.tsx             ← يُستبدل
│   │       └── NotificationsPanel.tsx       ← جديد (أنشئه)
│   ├── hooks/
│   │   └── useNotifications.ts              ← جديد (أنشئه)
│   └── pages/
│       ├── ArticlePage.tsx                  ← يُستبدل
│       └── admin/
│           └── ArticleManagement.tsx        ← يُستبدل (slug field added)
```

### الخطوة 2 — نسخ الملفات
لكل ملف في هذا الـ patch، انسخ محتواه إلى مساره الصحيح في المشروع.
استبدل المحتوى القديم كاملاً.
للملفات الجديدة (NotificationsPanel.tsx, useNotifications.ts) أنشئها في مسارها.

### الخطوة 3 — Footer يدوي (لأسباب صلاحيات)
في `src/components/Footer.tsx` ابحث عن:
```tsx
          {settings.footer_message && (
            <div className="mt-2" dangerouslySetInnerHTML={{ __html: settings.footer_message }} />
          )}
        </div>
```
أضف قبل `</div>` الأخيرة:
```tsx
          <p className="mt-3 opacity-50 text-[10px] tracking-wide">
            {t("تطوير وبرمجة:", "Developed by:")}{" "}
            <span className="font-black">{t("د. سعيد جوهر", "Dr. Saeed Gohar")}</span>
          </p>
```

### الخطوة 4 — og-image.png
أضف صورة `og-image.png` بأبعاد 1200×630px في مجلد `public/`
هذه الصورة تظهر عند المشاركة على Facebook/WhatsApp/Twitter

### الخطوة 5 — التحقق
بعد الرفع على GitHub، تحقق من:
- [ ] الرابط `/eg-control-2026` يفتح لوحة التحكم
- [ ] أيقونة Bell 🔔 تظهر في الـ header مع عداد
- [ ] إضافة مقال جديد → slug تلقائي بشكل `article-XXXXXX`
- [ ] خانة Slug يدوي موجودة في نموذج المقال
- [ ] شريط تقدم القراءة يظهر أعلى صفحة المقال
- [ ] زر حفظ 🔖 يظهر بجانب المقال
- [ ] Skeleton يظهر أثناء تحميل المقال
- [ ] اسم "د. سعيد جوهر" يظهر في الـ Footer

## ملاحظات مهمة
- المشروع يستخدم Supabase Realtime → الإشعارات تشتغل تلقائياً
- `NavLink` component موجودة في `@/components/NavLink`
- `ThemeToggle` و `LanguageToggle` موجودان في `@/components/`
- الـ Admin route السري: `/eg-control-2026` (لا تغيره)
- لا توجد localStorage → كل الـ state in-memory

## التعديلات المطبّقة في هذا الـ Patch

| الملف | التعديل |
|-------|---------|
| `App.tsx` | Admin route مخفي على `/eg-control-2026` |
| `AdminSidebar.tsx` | RTL كامل + كل الروابط + badge إشعارات |
| `AdminLayout.tsx` | TopBar + Avatar + NotificationsPanel |
| `NotificationsPanel.tsx` | لوحة إشعارات كاملة (جديد) |
| `useNotifications.ts` | Realtime notifications hook (جديد) |
| `ArticleManagement.tsx` | Slug تلقائي أو يدوي |
| `ArticlePage.tsx` | شريط تقدم + Skeleton + Save + Share |
| `ArticleCard.tsx` | onError fallback للصور المكسورة |
| `SEOHead.tsx` | Default og:image + Twitter cards |
| `Footer.tsx` | اسم الديفلوبر: د. سعيد جوهر |

## الخطوات القادمة (للـ Patch التالي)
- [ ] PWA تفعيل كامل مع install prompt
- [ ] NewsScraperPage — سحب أخبار من مواقع عالمية بالـ AI
- [ ] AIToolsPage — توليد عناوين وتلخيص بالـ AI
- [ ] تحسين واجهة المقال — Reading time, related by category
