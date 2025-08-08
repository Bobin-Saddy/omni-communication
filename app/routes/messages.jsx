// app/routes/messages.jsx
import { useSearchParams, useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const number = searchParams.get("number");

  useEffect(() => {
    if (!number) {
      navigate("/app/whatsapp"); // navigate correctly
    }
  }, [number, navigate]);

  return number ? (
    <div>Show messages for {number}</div>
  ) : null;
}
