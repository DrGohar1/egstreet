import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen bg-background" dir="rtl">
    <Header />
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <div className="text-8xl font-black text-primary/20 mb-4 select-none">404</div>
      <h1 className="text-2xl font-black text-foreground mb-3">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها
      </p>
      <div className="flex gap-3">
        <Link to="/"
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/85 transition-colors shadow-md">
          <Home className="w-4 h-4"/>
          الرئيسية
        </Link>
        <button onClick={() => window.history.back()}
          className="flex items-center gap-2 border border-border px-6 py-3 rounded-xl font-bold hover:bg-muted transition-colors">
          <ArrowRight className="w-4 h-4"/>
          رجوع
        </button>
      </div>
    </div>
  </div>
);

export default NotFound;
