import React from "react";

export default function Settings({
  fbPages = [],   // ✅ default empty array
  igPages = [],   // ✅ default empty array
  setSelectedPage,
  selectedPage,
  fetchConversations,
}) {
  return (
    <div className="settings">
      {/* Facebook Pages */}
      {fbPages.length > 0 && (
        <div>
          <h3>📘 Facebook Pages</h3>
          {fbPages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                setSelectedPage({ ...page, type: "facebook" });
                fetchConversations(page);
              }}
              className={`page-card ${
                selectedPage?.id === page.id ? "selected" : ""
              }`}
            >
              {page.name}
            </div>
          ))}
        </div>
      )}

      {/* Instagram Pages */}
      {igPages.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>📸 Instagram Accounts</h3>
          {igPages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                setSelectedPage({ ...page, type: "instagram" });
                fetchConversations(page);
              }}
              className={`page-card ${
                selectedPage?.id === page.id ? "selected" : ""
              }`}
            >
              {page.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
