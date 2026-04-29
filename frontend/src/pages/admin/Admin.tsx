import { Outlet } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import { Adminbar } from "../../components/adminbar";
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

export const Admin = () => {
  return (
    <div>
      <Navbar />
      <Adminbar />
      <Outlet />
    </div>
  );
};
