import { useNavigate } from "react-router-dom";

import "@material/web/button/text-button.js";
import "./styles/navbar.css";

// Imprort user image
import userIcon from "../assets/user.png";

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left" onClick={() => navigate("/profile")}>
        <img src={userIcon} alt="profile" className="profile-img" />

        <div className="profile-info">
          <p className="name">Sreenath</p>
          <p className="role">Admin</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <md-text-button onClick={() => navigate("/")}>Home</md-text-button>

        <md-text-button onClick={() => navigate("/admin")}>
          Admin
        </md-text-button>

        <md-text-button onClick={() => navigate("/create-event")}>
          Create Event
        </md-text-button>

        <md-text-button onClick={() => navigate("/black-list")}>
          Black List
        </md-text-button>

        <md-text-button onClick={() => navigate("/login")}>
          Logout
        </md-text-button>
      </div>
    </nav>
  );
};
