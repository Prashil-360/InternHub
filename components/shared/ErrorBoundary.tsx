"use client";
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-5 max-w-xs">
            {this.state.error?.message || "An unexpected error occurred. Try refreshing the page."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
