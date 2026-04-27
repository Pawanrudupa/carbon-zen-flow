import { AlertCircle, RefreshCcw } from "lucide-react";

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorCard = ({ message = "Failed to load data", onRetry, className = "" }: ErrorCardProps) => {
  return (
    <div className={`glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 border-destructive/20 h-full min-h-[160px] ${className}`}>
      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="text-destructive w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Data unavailable</h3>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors"
        >
          <RefreshCcw size={12} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorCard;
