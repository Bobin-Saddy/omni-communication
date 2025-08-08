// app/routes/app.whatsapp.jsx
import { useSearchParams, useNavigate } from "@remix-run/react";
import { useState } from "react";

export default function WhatsAppPage() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone) return alert("Please enter a phone number");
    navigate(`/messages?number=${encodeURIComponent(phone)}`);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center" }}>
      <h2>Enter WhatsApp Number</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={phone}
          placeholder="Enter phone number"
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#25D366",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
