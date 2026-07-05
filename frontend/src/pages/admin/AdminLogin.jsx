import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../lib/api";
import { setToken } from "../../lib/auth";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const { access_token } = await adminLogin(username, password);
      setToken(access_token);
      navigate("/admin/messages", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast({
        title: "Login failed",
        description:
          typeof detail === "string" ? detail : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--arroyo-bg-soft)] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_10px_40px_rgba(10,26,58,0.08)] border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-[color:var(--arroyo-navy)] text-white flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="arroyo-display text-xl">Admin access</h1>
            <p className="text-xs text-[color:var(--arroyo-muted)]">
              Arroyo Systems dashboard
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="cf-label">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cf-input"
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="cf-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cf-input"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="contact-pill w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
