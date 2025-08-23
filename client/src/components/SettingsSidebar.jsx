// src/components/SettingsSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsSidebar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const Sec = ({ label }) => (
    <div
      style={{
        opacity: 0.9,
        margin: "12px 0 6px",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.08,
        fontWeight: 800,
      }}
    >
      {label}
    </div>
  );

  const Item = ({ to, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
      style={{ display: "block" }}
    >
      {label}
    </NavLink>
  );

  const logoutNow = () => {
    logout();
    nav("/signin", { replace: true });
  };

  return (
    <aside className="sidebar settings-sidebar">
      <div style={{ fontWeight: 800, marginBottom: 12, letterSpacing: 0.3 }}>
        Setup
      </div>

      <Sec label="General" />
      <Item to="/settings/personal" label="Personal Settings" />
      <Item to="/settings/users" label="Users" />
      <Item to="/settings/company" label="Company Settings" />
      <Item to="/settings/calendar" label="Calendar Booking" />

      <Sec label="Security Control" />
      <Item to="/settings/security" label="Security Policies" />
      <Item to="/settings/roles" label="Roles & Sharing" />
      <Item to="/settings/audit" label="Audit Log" />

      <Sec label="Channels" />
      <Item to="/settings/email" label="Email" />

      <Sec label="Session" />
      <Item to="/home" label="← Back to Home" />
      <button
        className="nav-link"
        onClick={logoutNow}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "crimson",
          fontWeight: 600,
          marginTop: 6,
        }}
      >
        Log out
      </button>

      {user?.role !== "admin" ? null : (
        <>
          <Sec label="Admin (you)" />
          <Item to="/settings/users" label="Manage Users" />
          <Item to="/settings/roles" label="Roles & Sharing" />
          <Item to="/settings/audit" label="Audit Log" />
        </>
      )}
    </aside>
  );
}
