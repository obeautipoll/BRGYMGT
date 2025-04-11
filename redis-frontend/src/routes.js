import { Navigate } from "react-router-dom";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import UserDashboard from "./pages/User/UserDashboard";
import Residents from "./pages/Admin/Residents";
import Officials from "./pages/Admin/Officials";
import Clearance from "./pages/Admin/Clearance";
import Announcements from "./pages/Admin/Announcements";

const routes = {
  admin: [
    { path: "/dashboard", element: <AdminDashboard /> },
    { path: "/officials", element: <Officials /> },
    { path: "/staff", element: <StaffDashboard /> },
    { path: "/residents", element: <Residents /> },
    { path: "/clearance", element: <Clearance /> },
    { path: "/announcements", element: <Announcements /> },
  ],
  staff: [
    { path: "/dashboard", element: <StaffDashboard /> },
    { path: "/officials", element: <Officials /> },
    { path: "/residents", element: <Residents /> },
    { path: "/clearance", element: <Clearance /> },
    { path: "/announcements", element: <Announcements /> },
  ],
  user: [
    { path: "/dashboard", element: <UserDashboard /> },
    { path: "/officials", element: <Officials /> },
    { path: "/clearance", element: <Clearance /> },
  ],
};

export default routes;
