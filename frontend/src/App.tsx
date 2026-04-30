import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { Profile } from "./pages/Profile";
import { BlackList } from "./pages/BlackList";
import { AdminLayout } from "./pages/admin/Layout";
import { AdminBlackList } from "./pages/admin/BlackList";

import "./styles/light.css";
import "./styles/md.css";
import { Layout } from "./pages/layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/black-list" element={<BlackList />} />
          {/* <Route path="/layout" element={<Layout />} /> */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="blacklist" element={<AdminBlackList />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
