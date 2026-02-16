import { useState, useEffect, ReactNode } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

interface StickyHeaderProps {
  ticker: ReactNode;
  categoryNav: ReactNode;
}

const StickyHeader = ({ ticker, categoryNav }: StickyHeaderProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsSticky(latest > 200);
  });

  if (!isSticky) {
    return (
      <>
        {ticker}
        {categoryNav}
      </>
    );
  }

  return (
    <>
      {/* Spacer */}
      <div style={{ height: "auto" }}>
        {ticker}
        {categoryNav}
      </div>
      {/* Sticky overlay */}
      <motion.div
        className="fixed top-0 inset-x-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="backdrop-blur-md bg-background/80 border-b border-border shadow-lg">
          {ticker}
          {categoryNav}
        </div>
      </motion.div>
    </>
  );
};

export default StickyHeader;
