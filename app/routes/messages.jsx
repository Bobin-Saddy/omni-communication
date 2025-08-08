// app/routes/messages.jsx
import { useSearchParams } from "@remix-run/react";
import { useEffect } from "react";

export default function Messages() {
  const [searchParams] = useSearchParams();
  const number = searchParams.get("number");

  useEffect(() => {
    if (!number) return;
    router.push("/app/whatsapp"); // if number is missing, go to WhatsApp input page
    return;
  }, [number]);

  return <div>Show messages for {number}</div>;
}
