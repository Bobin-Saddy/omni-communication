export default function FacebookLogoutButton() {
  const handleLogout = async () => {
    await fetch("/logout", { method: "POST" });
    console.log("✅ Logged out from Facebook session.");
    window.location.reload(); // Refresh page or redirect as needed
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 20px",
        backgroundColor: "#ccc",
        color: "black",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        marginLeft: "10px",
      }}
    >
      Logout Facebook
    </button>
  );
}
