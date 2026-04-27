"use client";
import { useState } from "react";

export default function PhotoViewer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={url}
        style={{
          width: 60,
          height: 60,
          objectFit: "cover",
          borderRadius: 8,
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <img
            src={url}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </>
  );
}