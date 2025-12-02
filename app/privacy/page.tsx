export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        <strong>Effective Date:</strong> 2025-12-02
      </p>

      <p>
        WHOOP Daily Grid ("the App") is a personal fitness data visualization
        project designed to help users understand their recovery, sleep, and
        activity trends using WHOOP data.
      </p>

      <section>
        <h2 className="font-semibold mt-4">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Recovery data</li>
          <li>Sleep data</li>
          <li>Workout and activity data</li>
          <li>Basic profile information (if provided by WHOOP)</li>
        </ul>
        <p className="mt-2">
          The App does not collect payment information, location data, contacts,
          messages, or unrelated personal data.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mt-4">How We Use Your Data</h2>
        <p>Your data is used only to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Display recovery, sleep, and activity metrics</li>
          <li>Generate daily health visualizations</li>
          <li>Improve app functionality</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mt-4">Data Storage</h2>
        <p>
          Access tokens and health data may be stored securely to allow the app
          to function properly.
        </p>
        <p>You may request deletion of your data at any time.</p>
      </section>

      <section>
        <h2 className="font-semibold mt-4">Third-Party Services</h2>
        <p>
          This app uses the WHOOP API. Your data is also governed by WHOOP’s own
          policy.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mt-4">Your Rights</h2>
        <p>
          You may revoke access through WHOOP, request deletion, or stop using
          the app at any time.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mt-4">Contact</h2>
        <p>Email: your@email.com</p>
      </section>
    </main>
  );
}
