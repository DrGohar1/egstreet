import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoadingScreen({ onDone }) {
  const [logo,    setLogo]    = useState(null)
  const [siteName,setSiteName] = useState('الشارع المصري')
  const [phase,   setPhase]   = useState(0) // 0=appear 1=pulse 2=exit

  useEffect(() => {
    // جلب اللوجو واسم الموقع من الإعدادات
    supabase.from('site_settings')
      .select('key, value')
      .in('key', ['site_logo','site_name'])
      .then(({ data }) => {
        data?.forEach(s => {
          if (s.key === 'site_logo')  setLogo(JSON.parse(s.value))
          if (s.key === 'site_name')  setSiteName(JSON.parse(s.value))
        })
      })

    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => onDone?.(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#0d0d0d] flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Animated logo */}
      <div className={`transition-all duration-700 ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        {logo ? (
          <img src={logo} alt={siteName}
            className="h-20 w-auto object-contain drop-shadow-[0_0_30px_rgba(225,29,72,0.6)]" />
        ) : (
          <div className="text-white font-bold text-4xl tracking-tight">
            <span className="text-rose-500">الشارع</span> المصري
          </div>
        )}
      </div>

      {/* Loading bar */}
      <div className={`mt-8 transition-all duration-700 delay-300 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full bg-rose-500 rounded-full transition-all ${phase === 2 ? 'w-full duration-500' : 'w-2/3 duration-1000'}`} />
        </div>
      </div>

      {/* Tagline */}
      <p className={`mt-4 text-gray-600 text-sm transition-all duration-700 delay-500 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        أخبار مصر لحظة بلحظة
      </p>
    </div>
  )
}
