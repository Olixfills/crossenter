import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught UI Error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-12 bg-bg-base text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <h2 className="text-xl font-black text-text-hi uppercase tracking-widest mb-3">
            Interface Crash Detected
          </h2>
          <p className="text-xs text-text-ghost max-w-md mb-8 leading-relaxed">
            The workspace encountered an unexpected error and had to stop. This is often caused by a data mismatch or a GPU stall.
          </p>
          
          <div className="bg-bg-surface p-4 rounded-xl border border-border-dim mb-8 w-full max-w-lg text-left overflow-hidden">
             <div className="text-[10px] font-bold text-accent uppercase mb-2 tracking-tighter">Stack Trace</div>
             <div className="text-[9px] font-mono text-red-400 opacity-80 break-all line-clamp-4">
               {this.state.error?.message}
             </div>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-3 px-8 py-3 bg-accent text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCcw size={16} strokeWidth={3} />
            Recover Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
