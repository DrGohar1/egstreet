import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoadingScreen({ onDone }) {
  const [logo, setLogo]       = useState(null)
  const [name, setName]       = useState('الشارع المصري')
  const [phase, setPhase]     = useState(0)

  useEffect(() => {
    supabase.from('site_settings').select('key,value').in('key',['site_logo','site_name'])
      .then(({ data }) => {
        data?.forEach(s => {
          try {
            if (s.key === 'site_logo') setLogo(JSON.parse(s.value))
            if (s.key === 'site_name') setName(JSON.parse(s.value))
          } catch {}
        })
      })
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => onDone?.(), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className={`transition-all duration-700 ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        {logo
          ? <img src={logo} alt={name} className="h-20 w-auto object-contain drop-shadow-[0_0_40px_rgba(225,29,72,0.5)]" />
          : <div className="text-white text-4xl font-black tracking-tight"><span className="text-rose-500">الشارع</span> المصري</div>
        }
      </div>
      <div className={`transition-all duration-700 delay-200 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full bg-rose-500 rounded-full transition-all duration-[1400ms] ${phase >= 1 ? 'w-full' : 'w-0'}`} />
        </div>
      </div>
      <p className={`text-gray-600 text-xs tracking-widest transition-all duration-700 delay-300 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>أخبار مصر لحظة بلحظة</p>
    </div>
  )
}
