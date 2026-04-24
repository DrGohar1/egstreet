import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const [newPass,   setNewPass]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  const strength = (p: string) => {
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabel = ["ضعيف جداً","ضعيف","مقبول","قوي","ممتاز"];
  const strengthColor = ["bg-red-500","bg-orange-500","bg-yellow-500","bg-blue-500","bg-green-500"];
  const s = strength(newPass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) { toast.error("كلمة المرور 8 أحرف على الأقل"); return; }
    if (newPass !== confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (s < 2) { toast.error("كلمة المرور ضعيفة — استخدم حروفاً وأرقاماً"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      }
      toast.success("تم تغيير كلمة المرور بنجاح ✅");
      navigate("/x7k9-control", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-xl font-black">تغيير كلمة المرور</h1>
            <p className="text-xs text-muted-foreground">مطلوب منك تغيير كلمة المرور عند أول دخول</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">كلمة المرور الجديدة</label>
              <div className="relative">
                <input type={showNew?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pe-10"
                  placeholder="••••••••" dir="ltr" required/>
                <button type="button" onClick={()=>setShowNew(!showNew)}
                  className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showNew?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {newPass && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i=>(
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < s ? strengthColor[s] : "bg-muted"}`}/>
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold ${s>=3?"text-green-500":s>=2?"text-yellow-500":"text-red-500"}`}>{strengthLabel[s]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">تأكيد كلمة المرور</label>
              <div className="relative">
                <input type={showConf?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)}
                  className={`w-full bg-muted border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pe-10 ${confirm && newPass===confirm?"border-green-500":"border-border"}`}
                  placeholder="••••••••" dir="ltr" required/>
                <button type="button" onClick={()=>setShowConf(!showConf)}
                  className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showConf?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {confirm && newPass===confirm && (
                <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>كلمتا المرور متطابقتان</p>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-700 space-y-1">
              <p className="font-bold">متطلبات كلمة المرور:</p>
              <p className={newPass.length>=8?"text-green-600":""}>• 8 أحرف على الأقل</p>
              <p className={/[A-Z]/.test(newPass)?"text-green-600":""}>• حرف كبير واحد</p>
              <p className={/[0-9]/.test(newPass)?"text-green-600":""}>• رقم واحد</p>
              <p className={/[^A-Za-z0-9]/.test(newPass)?"text-green-600":""}>• رمز خاص (!@#$...)</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading?<><Loader2 className="w-4 h-4 animate-spin"/>جارٍ الحفظ...</>:<><Lock className="w-4 h-4"/>حفظ كلمة المرور الجديدة</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
