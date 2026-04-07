"use client";

import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminTopbar from "../../components/AdminTopbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-layout">
      <div
        className={`admin-sidebar-wrapper 
        ${collapsed ? "collapsed" : ""} 
        ${mobileOpen ? "mobile-open" : ""}`}
      >
        <AdminSidebar />
      </div>

      <div className="admin-main">
        <AdminTopbar
          onToggleSidebar={() => {
            if (window.innerWidth < 900) {
              setMobileOpen(!mobileOpen);
            } else {
              setCollapsed(!collapsed);
            }
          }}
        />

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}