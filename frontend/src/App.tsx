import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { Profile } from "./pages/Profile";
import { BlackList } from "./pages/BlackList";
import { AdminLayout } from "./pages/admin/Layout";
import { AdminBlackList } from "./pages/admin/BlackList";
import { AdminCampus } from "./pages/admin/Campus";
import { Layout } from "./pages/layout";
import { AdminLocation } from "./pages/admin/Location";
import { AdminVenue } from "./pages/admin/Venues";
import { AdminEvent } from "./pages/admin/Event";
import { AdminPromoteToOrg } from "./pages/admin/PromoteToOrganiser";
import { EventCreate } from "./pages/EventCreate";

// import "./styles/light.css";
import "./styles/light_new.css";
import "./styles/md.css";


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
          <Route path="/create-event" element={<EventCreate />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="blacklist" element={<AdminBlackList />} />
            <Route path="campuses" element={<AdminCampus />} />
            <Route path="locations" element={<AdminLocation />} />
            <Route path="venues" element={<AdminVenue />} />
            <Route path="events" element={<AdminEvent />} />
            <Route path="promote_org" element={<AdminPromoteToOrg />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
