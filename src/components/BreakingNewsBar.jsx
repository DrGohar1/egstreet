import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function BreakingNewsBar() {
  const [news,    setNews]    = useState([])
  const [current, setCurrent] = useState(0)
  const [stuck,   setStuck]   = useState(false)
  const [paused,  setPaused]  = useState(false)
  const barRef  = useRef(null)
  const timer   = useRef(null)

  useEffect(() => {
    supabase.from('breaking_news')
      .select('id, text_ar, link')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(10)
      .then(({ data }) => setNews(data || []))
  }, [])

  // Sticky on scroll
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto cycle
  useEffect(() => {
    if (!news.length || paused) return
    timer.current = setInterval(() => {
      setCurrent(c => (c + 1) % news.length)
    }, 4000)
    return () => clearInterval(timer.current)
  }, [news, paused])

  if (!news.length) return null

  const item = news[current]

  return (
    <div
      ref={barRef}
      className={`z-40 w-full transition-all duration-300 ${
        stuck
          ? 'fixed top-0 left-0 right-0 shadow-lg shadow-black/20'
          : 'relative'
      }`}
      dir="rtl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-rose-600 text-white flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-rose-800 px-4 py-2.5 flex items-center gap-2 font-bold text-sm">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          عاجل
        </div>

        {/* Ticker */}
        <div className="flex-1 overflow-hidden relative h-10 flex items-center">
          <div key={current} className="animate-slide-in-right px-4 text-sm font-medium truncate w-full">
            {item.link ? (
              <Link to={item.link} className="hover:underline">{item.text_ar}</Link>
            ) : (
              <span>{item.text_ar}</span>
            )}
          </div>
        </div>

        {/* Dots navigation */}
        <div className="flex-shrink-0 flex items-center gap-1 px-3">
          {news.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex-shrink-0 flex border-r border-rose-500">
          <button onClick={() => setCurrent(c => (c - 1 + news.length) % news.length)}
            className="px-2 py-2.5 hover:bg-rose-700 transition text-xs">‹</button>
          <button onClick={() => setCurrent(c => (c + 1) % news.length)}
            className="px-2 py-2.5 hover:bg-rose-700 transition text-xs">›</button>
        </div>
      </div>
    </div>
  )
}
