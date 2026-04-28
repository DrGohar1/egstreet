import { Shield, Crown, PenLine, BarChart, Megaphone, Check, X } from "lucide-react";

type Perm = { label: string; desc: string };
type Section = { title: string; perms: Perm[] };

const SECTIONS: Section[] = [
  {
    title: "المقالات",
    perms: [
      { label:"كتابة مقال", desc:"إنشاء مسودة جديدة" },
      { label:"نشر مقال", desc:"تحويل المسودة لمنشورة" },
      { label:"تعديل مقاله", desc:"تعديل مقالاته الخاصة" },
      { label:"تعديل الكل", desc:"تعديل مقالات الآخرين" },
      { label:"حذف مقال", desc:"حذف أي مقال" },
      { label:"مقال عاجل", desc:"تمييز مقال كعاجل" },
    ],
  },
  {
    title: "المستخدمون",
    perms: [
      { label:"عرض المستخدمين", desc:"رؤية قائمة المستخدمين" },
      { label:"إنشاء مستخدم",   desc:"إضافة يوزر جديد" },
      { label:"تعديل مستخدم",   desc:"تغيير بيانات يوزر" },
      { label:"حذف مستخدم",     desc:"حذف يوزر من النظام" },
      { label:"تغيير أدوار",    desc:"تعديل صلاحيات يوزر" },
    ],
  },
  {
    title: "الموقع",
    perms: [
      { label:"إعدادات الموقع", desc:"تغيير اسم الموقع والشعار" },
      { label:"إدارة الأقسام",  desc:"إضافة وتعديل الأقسام" },
      { label:"إدارة الصفحات",  desc:"تعديل الصفحات الثابتة" },
      { label:"إدارة الإعلانات",desc:"رفع وتعديل الإعلانات" },
      { label:"سحب RSS",        desc:"استيراد أخبار خارجية" },
    ],
  },
  {
    title: "التقارير",
    perms: [
      { label:"عرض التقارير",  desc:"إحصائيات ومشاهدات" },
      { label:"تقارير متقدمة", desc:"تقارير مالية ومستخدمين" },
    ],
  },
];

// ── Role → permissions matrix ──
// true = لديه الصلاحية | false = ليس لديه | "own" = مقالاته فقط
const MATRIX: Record<string, (boolean|string)[]> = {
  super_admin:     [true,true,true,true,true,true,  true,true,true,true,true,  true,true,true,true,true,  true,true],
  editor_in_chief: [true,true,true,true,true,true,  true,true,true,false,true, true,true,true,false,true, true,true],
  journalist:      [true,true,"own",false,false,false, false,false,false,false,false, false,false,false,false,true, true,false],
  analyst:         [true,false,"own",false,false,false, false,false,false,false,false, false,false,false,false,false, true,false],
  ads_manager:     [false,false,false,false,false,false, false,false,false,false,false, false,false,false,true,false, false,false],
};

const ROLES = [
  { key:"super_admin",     label:"مدير عام",      icon: <Crown     className="w-4 h-4"/>, color:"text-red-600 bg-red-50 border-red-200"       },
  { key:"editor_in_chief", label:"رئيس تحرير",    icon: <Shield    className="w-4 h-4"/>, color:"text-purple-600 bg-purple-50 border-purple-200" },
  { key:"journalist",      label:"صحفي",           icon: <PenLine   className="w-4 h-4"/>, color:"text-blue-600 bg-blue-50 border-blue-200"     },
  { key:"analyst",         label:"محلل",           icon: <BarChart className="w-4 h-4"/>, color:"text-green-600 bg-green-50 border-green-200"  },
  { key:"ads_manager",     label:"مدير إعلانات",   icon: <Megaphone className="w-4 h-4"/>, color:"text-amber-600 bg-amber-50 border-amber-200"  },
];

const ALL_PERMS = SECTIONS.flatMap(s => s.perms);

function PermIcon({ val }: { val: boolean|string }) {
  if (val === true)  return <Check className="w-4 h-4 text-green-600 mx-auto"/>;
  if (val === "own") return <span className="text-[10px] text-amber-600 font-bold mx-auto block text-center">مقالاته</span>;
  return <X className="w-3.5 h-3.5 text-red-300 mx-auto"/>;
}

export default function PermissionManagement() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary"/> جدول الصلاحيات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          الصلاحيات محددة بالدور الوظيفي — لتغيير صلاحية مستخدم، غيّر دوره من صفحة إدارة المستخدمين
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-green-700"><Check className="w-4 h-4"/> مسموح كاملاً</div>
        <div className="flex items-center gap-1.5 font-bold text-amber-600"><span className="font-black">مقالاته</span> مقالاته فقط</div>
        <div className="flex items-center gap-1.5 font-bold text-red-400"><X className="w-4 h-4"/> غير مسموح</div>
      </div>

      {/* Permission Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground min-w-[160px]">الصلاحية</th>
                {ROLES.map(r => (
                  <th key={r.key} className="py-3 px-3 min-w-[90px]">
                    <div className={`inline-flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl border ${r.color} text-xs font-bold`}>
                      {r.icon}
                      <span className="whitespace-nowrap">{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section, si) => {
                let permIdx = SECTIONS.slice(0, si).reduce((a, s) => a + s.perms.length, 0);
                return [
                  <tr key={`sec-${si}`} className="bg-primary/5 border-y border-primary/10">
                    <td colSpan={ROLES.length + 1} className="py-2 px-4 text-xs font-black text-primary uppercase tracking-wide">
                      {section.title}
                    </td>
                  </tr>,
                  ...section.perms.map((perm, pi) => {
                    const idx = permIdx + pi;
                    return (
                      <tr key={`perm-${idx}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-sm">{perm.label}</div>
                          <div className="text-[10px] text-muted-foreground">{perm.desc}</div>
                        </td>
                        {ROLES.map(r => (
                          <td key={r.key} className="py-2.5 px-3 text-center">
                            <PermIcon val={MATRIX[r.key]?.[idx] ?? false}/>
                          </td>
                        ))}
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
        <strong>ملاحظة:</strong> الصلاحيات مدمجة في الكود (middleware) — أي تغيير في الدور ينعكس فوراً على صلاحيات المستخدم
        بدون الحاجة لإعادة تشغيل الموقع.
      </div>
    </div>
  );
}
