// app/routes/index.jsx
import { Form, useActionData } from "@remix-run/react";

export default function Index() {
  const response = useActionData();

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

      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          {response.success ? (
            <>
              <h2 className="font-semibold text-green-600">Message Sent Successfully</h2>
              <pre className="text-sm mt-2 overflow-x-auto">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-red-600">Failed to Send Message</h2>
              <p className="text-sm">{response.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
