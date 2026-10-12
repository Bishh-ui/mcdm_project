"use client";

import { Toaster } from "react-hot-toast";

export function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "rgb(17 24 39)", // gray-900
          color: "#fff",
          border: "1px solid rgb(55 65 81)", // gray-700
        },
        success: {
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
