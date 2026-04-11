// Example component
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
        {/* @ts-ignore */}
        <md-list>
          {/* @ts-ignore */}
          <md-list-item type="button" onClick={() => navigate("/")}><div slot="start">Home</div></md-list-item>
          {/* @ts-ignore */}
          <md-list-item type="button" onClick={() => navigate("/login")}><div slot="start">Login</div></md-list-item>
        {/* @ts-ignore */}
        </md-list>
    </nav>
  )
}