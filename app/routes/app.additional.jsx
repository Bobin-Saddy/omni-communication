import { Form, useActionData } from "@remix-run/react";

export default function Index() {
  const actionData = useActionData();

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Send WhatsApp Message</h1>

      <Form method="post" action="/send-message">
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

      {/* Show response message */}
      {actionData && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          {actionData.success ? (
            <p className="text-green-600">
              ✅ Message sent successfully! Message ID:{" "}
              {actionData.data.messages?.[0]?.id}
            </p>
          ) : (
            <p className="text-red-600">
              ❌ Failed to send message: {actionData.error || actionData.data?.error?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
