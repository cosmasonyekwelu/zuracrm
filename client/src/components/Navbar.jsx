import { Link } from "react-router-dom";
import logo from "../assets/logo-mark.svg";

export default function Navbar(){
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="nav-left">
          <Link to="/" className="nav-link" style={{display:"flex", alignItems:"center", gap:10}}>
            <img src={logo} alt="Zura" width={28} height={28} /><strong>Zura CRM</strong>
          </Link>
          <Link className="nav-link" to="#">Features</Link>
          <Link className="nav-link" to="#">Pricing</Link>
          <Link className="nav-link" to="#">Platform</Link>
          <Link className="nav-link" to="#">Customers</Link>
          <Link className="nav-link" to="#">Resources</Link>
        </div>
        <div className="nav-right">
          <Link className="nav-link" to="/signin">Sign in</Link>
          <Link className="btn btn-primary" to="/signup">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
