import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Header />

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;