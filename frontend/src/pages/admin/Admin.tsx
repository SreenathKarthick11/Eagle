import { Outlet } from "react-router-dom";
import { Adminbar } from "../../components/adminbar";
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

export const Admin = () => {
  return (
    <div>
      <Adminbar />
      <Outlet />
    </div>
  );
};
