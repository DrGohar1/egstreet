import { useEffect } from "react";

interface Props {
  title?: string; description?: string; image?: string; url?: string;
  type?: string;
}

export default function SEOHead({ title, description, image, url, type="article" }: Props) {
  useEffect(()=>{
    if (title) document.title = title;
    const setMeta = (name:string, content:string, prop=false)=>{
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property",name) : el.setAttribute("name",name); document.head.appendChild(el); }
      el.content = content;
    };
    if (description) { setMeta("description",description); setMeta("og:description",description,true); setMeta("twitter:description",description); }
    if (title)       { setMeta("og:title",title,true); setMeta("twitter:title",title); }
    if (image)       { setMeta("og:image",image,true); setMeta("twitter:image",image); setMeta("twitter:card","summary_large_image"); }
    if (url)         { setMeta("og:url",url,true); }
    setMeta("og:type",type,true);
    setMeta("og:site_name","الشارع المصري",true);
  },[title,description,image,url,type]);

  return null;
}
