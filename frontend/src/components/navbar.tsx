import { useNavigate } from "react-router-dom";

import "@material/web/button/text-button.js";
import "./styles/navbar.css";

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {/* Account */}
      <div className="profile-grid">
        <md-filled-button onClick={() => navigate("/profile")}>
          <md-icon slot="icon" className="profile-icon">
            person
          </md-icon>
          Sreenath
        </md-filled-button>

        <span className="role-label">Admin</span>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
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
