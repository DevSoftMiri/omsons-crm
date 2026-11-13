"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error("Invalid email or password");
      window.location.assign("/dashboard");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in"); } finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Omsons CRM introduction">
        <div className="login-orb login-orb-top" />
        <div className="login-orb login-orb-bottom" />
        <div className="login-intro-content">
          <img className="login-brand" src="/Omsons Logo.png" alt="Omsons Germany" />
          <h1>Welcome <span>Back!</span></h1>
          <p>Sign in to your CRM account and<br />manage your business efficiently.</p>
          <img className="login-preview" src="/crm_login_left_panel.png" alt="Omsons CRM dashboard preview" />
          <div className="login-benefits">
            <div><b>↗</b><span>Track<br />Performance</span></div>
            <div><b>♧</b><span>Manage<br />Contacts</span></div>
            <div><b>ϟ</b><span>Grow Your<br />Business</span></div>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Sign in form">
        <div className="login-card">
          <img className="login-card-logo" src="/Omsons Logo.png" alt="Omsons Germany" />
          <h2>Sign In</h2>
          <p className="login-subtitle">Enter your credentials to access your account</p>
          <form onSubmit={handleSubmit}>
            <label className="login-field">
              <Mail size={25} strokeWidth={1.8} />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email Address" aria-label="Email Address" />
            </label>
            <label className="login-field">
              <LockKeyhole size={25} strokeWidth={1.8} />
              <input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Password" />
              <button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={23} /> : <Eye size={23} />}
              </button>
            </label>
            <div className="login-options">
              <label className="remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> <span>Remember me</span></label>
              <button type="button" className="forgot">Forgot Password?</button>
            </div>
            {error ? <p className="login-error" role="alert">{error}</p> : null}
            <button disabled={loading} className="sign-in-button" type="submit">{loading ? "Signing in…" : "Sign In"} {!loading && <ArrowRight size={22} />}</button>
          </form>
          <div className="secure-note"><span /><ShieldCheck size={25} /><span /><p>Your data is safe and secure</p></div>
        </div>
      </section>
    </main>
  );
}
