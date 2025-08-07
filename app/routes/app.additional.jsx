// app/routes/index.jsx
import { Form } from "@remix-run/react";

export default function Index() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Send WhatsApp Message</h1>
      <Form method="post" action="./send-message">
        <input
          type="text"
          name="message"
          placeholder="Enter message"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2">
          Send Message
        </button>
      </Form>
    </div>
  );
}
