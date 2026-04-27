import { motion } from "framer-motion";

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard = ({ className = "" }: SkeletonCardProps) => {
  return (
    <div className={`glass-card rounded-xl p-5 flex flex-col gap-4 overflow-hidden relative ${className}`}>
      {/* Shimmer effect overlay */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent z-10"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      
      <div className="w-1/3 h-3 rounded bg-muted/40" />
      <div className="w-2/3 h-8 rounded bg-muted/20 mt-2" />
      <div className="flex-1 w-full h-full min-h-[80px] rounded-lg bg-muted/10 mt-4" />
    </div>
  );
};

export default SkeletonCard;
