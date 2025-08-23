import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import SocialButtons from "../components/SocialButtons.jsx";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { AuthAPI } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const nav = useNavigate();
  const { search } = useLocation();
  const inviteToken = useMemo(() => new URLSearchParams(search).get("token") || "", [search]);
  const { signup: signupCtx, signin: signinCtx } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", agree: false });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const looksLikeEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const looksLikePhone = (v) => /^\+?[0-9\-().\s]{6,20}$/.test(v);

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.email && !form.phone) return "Enter a work email or phone number.";
    if (form.email && !looksLikeEmail(form.email)) return "Enter a valid email address.";
    if (form.phone && !looksLikePhone(form.phone)) return "Enter a valid phone number.";
    if (!form.password || form.password.length < 6) return "Password must be at least 6 characters.";
    if (!form.agree) return "Please accept the Terms and Privacy Policy.";
    return "";
  };

  const serverErrorToText = (e) => {
    const list = e?.server?.errors;
    if (Array.isArray(list) && list.length) return list.map(x => x.message).join("\n");
    return e?.message || "Signup failed";
  };

  const autoLoginAfterSignup = async (res) => {
    if (res?.token) {
      nav("/home");
      return;
    }
    const identifier = form.email || form.phone;
    const si = await AuthAPI.signin({ identifier, password: form.password });
    await signinCtx({ identifier, password: form.password });
    if (si?.token) localStorage.setItem("auth.token", si.token);
    nav("/home");
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const v = validate();
    if (v) return setMsg(v);
    setLoading(true);
    try {
      const res = await signupCtx({ ...form, inviteToken: inviteToken || undefined });
      setMsg("Account created! Redirecting…");
      await autoLoginAfterSignup(res);
    } catch (err) {
      setMsg(serverErrorToText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <Navbar />

      <section className="hero hero--stripe">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="pill pill--rose">All-in-one CRM</span>
            <h1>Grow faster with <span className="brand">Zura CRM</span></h1>
            <p className="sub">
              Capture leads, manage deals, and track activities in a clean, modern workspace.
            </p>
            <div className="hero__cta">
              <Link to={inviteToken ? `/signup?token=${encodeURIComponent(inviteToken)}` : "/signup"} className="btn btn-primary">Get Started</Link>
              <Link to="/signin" className="btn btn-outline">Sign in</Link>
            </div>
          </div>

          <form onSubmit={submit} className="card shadow-xl hero__card" noValidate>
            <h3 className="card__title">Start your free trial</h3>
            <div className="row">
              <input className="input" placeholder="Full Name" value={form.name}
                     onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="row">
              <input className="input" placeholder="Work Email" type="email" value={form.email}
                     onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}/>
              <input className="input" placeholder="Phone Number" value={form.phone}
                     onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}/>
            </div>
            <div className="row">
              <input className="input" placeholder="Create Password" type="password" value={form.password}
                     onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}/>
            </div>
            <label className="tiny">
              <input type="checkbox" checked={form.agree}
                     onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))}/>
              I agree to the Terms of Service and Privacy Policy.
            </label>

            {msg && <div className={`note ${/created/i.test(msg) ? "ok" : "err"}`}>{msg}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create my account"}
            </button>

            <div className="or-row"><span>or</span></div>
            <SocialButtons onGoogle={() => nav("/signin")} onOther={() => nav("/signin")} label="Continue with" />
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
