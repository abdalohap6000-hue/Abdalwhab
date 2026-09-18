import { Component } from "react";

// حاجز أخطاء: يمنع الشاشة السوداء عند أي خطأ غير متوقع في العرض،
// ويعرض بدلاً منها رسالة واضحة مع زر إعادة المحاولة.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center font-cairo"
        style={{ background: "#020203" }}
      >
        <div className="text-4xl">⚠️</div>
        <h1 className="text-lg font-bold text-white/85">حدث خطأ غير متوقع</h1>
        <p className="text-xs text-white/40 max-w-sm break-words" dir="auto">
          {String(this.state.error?.message || this.state.error)}
        </p>
        <button
          onClick={() => {
            this.setState({ error: null });
            window.location.href = "/";
          }}
          className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: "rgba(124,77,255,0.25)", border: "1px solid rgba(124,77,255,0.4)" }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }
}
