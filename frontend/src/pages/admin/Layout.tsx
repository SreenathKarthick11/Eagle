import { Outlet } from "react-router-dom";
import { Adminbar } from "../../components/adminbar";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";

import "../styles/admin/Layout.css";

export const AdminLayout = () => {
  return (
    <div className="admin_layout">
      <Adminbar />

      <div className="admin_panel">
        <Outlet />
      </div>
    </div>
  );
};
