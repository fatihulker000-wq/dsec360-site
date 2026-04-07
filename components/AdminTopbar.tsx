"use client";

export default function AdminTopbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  return (
    <div className="admin-topbar">
      <button onClick={onToggleSidebar} className="admin-menu-btn">
        ☰
      </button>

      <div className="admin-topbar-title">
        Yönetim Paneli
      </div>

      <div className="admin-topbar-right">
        <div className="admin-user-badge">
          Admin
        </div>
      </div>
    </div>
  );
}
