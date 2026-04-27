import { createContext, useContext, useEffect, ReactNode } from "react";

interface LanguageContextType {
  language: "ar";
  direction: "rtl";
  setLanguage: (_lang: "ar") => void;
  t: (ar: string, _en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  return (
    <LanguageContext.Provider value={{
      language: "ar",
      direction: "rtl",
      setLanguage: () => {},
      t: (ar: string, _en: string) => ar,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
