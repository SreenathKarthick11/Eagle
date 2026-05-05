import { useNavigate } from "react-router-dom";

import type { UserInfoItem } from "../interfaces";

import "@material/web/button/text-button.js";
import "./styles/navbar.css";

export const Navbar = () => {
  const navigate = useNavigate();
  const user: UserInfoItem = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;
  const username = user.username;

  const admin_role = "admin_role";
  const organizer_role = "organizer_role";
  const editor_role = "editor_role";
  const visitor_role = "visitor_role";

  console.log(role);

  function prettyRole(role: string) {
    switch (role) {
      case admin_role:
        return "Admin";
      case organizer_role:
        return "Organizer";
      case editor_role:
        return "Editor";
      case visitor_role:
        return "Visitor";
      default:
        return "Unknown";
    }
  }

  const isAdmin = role == admin_role;
  const isOrganizer = role == organizer_role;
  const isEditor = role == editor_role;
  const isVisitor = role == visitor_role;

  return (
    <nav className="navbar">
      {/* Account */}
      <div className="profile-grid">
        <md-filled-button onClick={() => navigate("/profile")}>
          <md-icon slot="icon" className="profile-icon">
            person
          </md-icon>
          {username}
        </md-filled-button>

        <span className="role-label">{prettyRole(role)}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
        {/* Visible to all */}
        <md-text-button onClick={() => navigate("/")}>Home</md-text-button>

        {/* Admin only */}
        {isAdmin && (
          <md-text-button onClick={() => navigate("/admin")}>
            Admin
          </md-text-button>
        )}

        {/* Organizer only */}
        {isOrganizer && (
          <md-text-button onClick={() => navigate("/create-event")}>
            Create Event
          </md-text-button>
        )}

        {/* Organizer only */}
        {isOrganizer && (
          <md-text-button onClick={() => navigate("/black-list")}>
            Black List
          </md-text-button>
        )}

        {/* Visible to all */}
        <md-text-button onClick={() => navigate("/login")}>
          Logout
        </md-text-button>
      </div>
    </nav>
  );
};
