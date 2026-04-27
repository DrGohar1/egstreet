import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  href?: string;
  color?: string;
}

const SectionHeader = ({ title, href, color = "bg-primary" }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className={`w-1 h-6 rounded-full ${color}`}/>
      <h2 className="text-lg font-black text-foreground">{title}</h2>
    </div>
    {href && (
      <Link to={href}
        className="flex items-center gap-1 text-xs text-primary font-bold hover:text-primary/80 transition-colors">
        المزيد <ChevronLeft className="w-3.5 h-3.5"/>
      </Link>
    )}
  </div>
);

export default SectionHeader;
