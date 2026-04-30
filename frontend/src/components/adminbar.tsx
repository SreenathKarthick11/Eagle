import { useNavigate } from "react-router-dom";

import "./styles/adminbar.css";

export const Adminbar = () => {
  const navigate = useNavigate();

  return (
    <div className="admin_sidebar">
      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/blacklist")}>
        Blacklist
      </md-text-button>

      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/campuses")}>
        Campuses
      </md-text-button>

      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/locations")}>
        Locations
      </md-text-button>

      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/venues")}>
        Venues
      </md-text-button>

      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/events")}>
        Events
      </md-text-button>

      <md-text-button className="admin_sidebar_button" onClick={() => navigate("/admin/promote")}>
        Users
      </md-text-button>
    </div>
  );
};
