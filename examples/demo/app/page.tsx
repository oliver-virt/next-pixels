"use client";
import { track, setGoogleConversionLabels } from "next-pixels";
setGoogleConversionLabels({ Purchase: "TESTLABEL" });
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>next-pixels demo</h1>
      <button id="buy" onClick={() => track({ eventName: "Purchase", data: { value: 12.5, currency: "USD" }, emails: ["test@example.com"] })}>
        Buy (fire track)
      </button>
    </main>
  );
}
