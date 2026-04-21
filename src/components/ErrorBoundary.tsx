import React from "react";

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-bold text-foreground">حدث خطأ في تحميل الصفحة</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            🔄 إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
