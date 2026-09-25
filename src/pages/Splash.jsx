import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(user ? "/home" : "/auth", { replace: true });
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="fixed inset-0" style={{ background: "#020203" }}>
      {/* أسود بحواف بنفسجية متوهجة فقط — بدون أي محتوى داخلي */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(2,2,3,0) 52%, rgba(124,77,255,0.14) 78%, rgba(124,77,255,0.30) 100%)",
          boxShadow: "inset 0 0 80px rgba(124,77,255,0.25)",
          border: "1px solid rgba(124,77,255,0.20)",
        }}
      />
    </div>
  );
}
