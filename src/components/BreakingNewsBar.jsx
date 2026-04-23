import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function BreakingNewsBar() {
  const [items,   setItems]   = useState([])
  const [idx,     setIdx]     = useState(0)
  const [stuck,   setStuck]   = useState(false)
  const [paused,  setPaused]  = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    supabase.from('breaking_news').select('id,text_ar,link').eq('is_active',true)
      .order('created_at',{ascending:false}).limit(15)
      .then(({ data }) => setItems(data || []))
  }, [])

  useEffect(() => {
    const fn = () => setStuck(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (!items.length || paused) return
    timer.current = setInterval(() => setIdx(i => (i + 1) % items.length), 4000)
    return () => clearInterval(timer.current)
  }, [items, paused])

  if (!items.length) return null
  const item = items[idx]

  return (
    <div
      dir="rtl"
      className={`z-30 w-full transition-all duration-300 ${stuck ? 'fixed top-0 left-0 right-0 shadow-xl shadow-black/20' : 'relative'}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-rose-600 text-white flex items-center text-sm">
        <div className="flex-shrink-0 bg-rose-800 px-4 py-2.5 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          عاجل
        </div>
        <div className="flex-1 overflow-hidden h-10 flex items-center px-4">
          <span key={idx} className="animate-slide-in-right truncate w-full block">
            {item.link
              ? <a href={item.link} className="hover:underline">{item.text_ar}</a>
              : item.text_ar
            }
          </span>
        </div>
        <div className="flex items-center gap-1 px-3 flex-shrink-0">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
          ))}
        </div>
        <div className="flex border-r border-rose-500 flex-shrink-0">
          <button onClick={() => setIdx(i => (i - 1 + items.length) % items.length)} className="px-2 py-2.5 hover:bg-rose-700">‹</button>
          <button onClick={() => setIdx(i => (i + 1) % items.length)} className="px-2 py-2.5 hover:bg-rose-700">›</button>
        </div>
      </div>
    </div>
  )
}
