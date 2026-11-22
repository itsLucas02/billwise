"use client";

// "See it work": BillWise's real flow as a short Stageshow demo (kit vendored under src/components/stageshow, MIT).
// Started from the stageshow `hero-demo` gold: browser window + a second window that comes forward.
// Every label is the app's own; amounts are the decoder's result for the redacted Aug 2026 Unifi bill.
import { Bar, Button, Collapse, Count, Phone, Stage, States, Text, Window, type Act } from "@/components/stageshow/kit";
import "./see-it-work.css";

type S = { uploaded: boolean; decoded: boolean; caseOpen: boolean; firmer: boolean };
const initial: S = { uploaded: false, decoded: false, caseOpen: false, firmer: false };
const POSTER: S = { uploaded: true, decoded: true, caseOpen: true, firmer: true };
const REST = { x: 640, y: 300 };
const PHONE_REST = { x: 250, y: 440 };
const rm = (n: number) => `RM${n.toFixed(2)}`;

async function script(a: Act<S>) {
  await a.wait(700);
  // 1. Upload the PDF: read on the device, the text box fills
  await a.move("upload");
  await a.wait(250);
  await a.click();
  await a.set({ uploaded: true });
  await a.wait(1100);
  // 2. Decode: the input folds away, the result opens
  await a.move("decode");
  await a.wait(250);
  await a.click();
  await a.set({ decoded: true });
  await a.wait(1800);
  // 3. Start an enquiry from the reconnection fee
  await a.move("dispute");
  await a.wait(300);
  await a.click();
  await a.set({ caseOpen: true });
  await a.wait(1100);
  // 4. AI rewrite: the only AI step, on the message
  await a.move("firmer");
  await a.wait(300);
  await a.click();
  await a.set({ firmer: true });
  await a.move("rest");
  await a.wait(2600);
  // Close the case window, then the decoder resets: the loop's seam has a cause
  await a.set({ caseOpen: false, firmer: false });
  await a.wait(700);
  await a.set({ decoded: false });
  await a.wait(900);
  await a.set({ uploaded: false });
  await a.wait(500);
}

// The decoder page: input and result swap in one place as a crossfade, so the page is never empty between them
function DecoderScreen({ s, phone }: { s: S; phone?: boolean }) {
  const size = phone ? "large" : "small";
  return (
    <States
      value={s.decoded ? "result" : "input"}
      align="start"
      states={{
        input: (
          <section className="siw-card">
            <Text className="siw-label">Paste the charges from your bill</Text>
            <div className="siw-textbox" data-filled={s.uploaded || undefined}>
              {[86, 62, 74, 55, 68].map((w, i) => <Bar key={i} w={`${w}%`} h={6} tone={s.uploaded ? 3 : 1} />)}
            </div>
            <div className="siw-actions">
              <Button data-target="upload" data-cursor="hand" size={size} variant="secondary">Upload PDF bill</Button>
              <States value={s.uploaded ? "read" : "empty"} align="start" className="siw-slot" states={{ empty: <Bar w="60%" h={8} tone={1} />, read: <span className="siw-note">Read 5 pages from Unifi_Aug_2026.pdf</span> }} />
              <Button data-target="decode" data-cursor="hand" size={size} variant="primary" className="siw-decode">Decode my bill</Button>
            </div>
            <div className="siw-history">
              <Text className="siw-label">Your decoded bills</Text>
              {[[120, 64], [96, 48]].map(([a, b], i) => (
                <div key={i} className="siw-history-row"><Bar w={a} h={7} tone={2} /><Bar w={b} h={7} tone={1} /><Bar w={26} h={16} r={8} tone={2} /></div>
              ))}
            </div>
          </section>
        ),
        result: (
          <section className="siw-result">
            <div className="siw-summary">
              <div>
                <Text className="siw-kicker">Unifi bill · 07 Aug 2026</Text>
                <p className="siw-total"><span>This Unifi bill comes to</span><Count value={136.75} format={rm} /></p>
              </div>
              <span className="siw-score" aria-label="Bill health 64 out of 100">64</span>
            </div>
            <div className="siw-finding">
              <span className="siw-tag">Act on this</span>
              <p className="siw-finding-title">RM10.00 reconnection fee — your line was cut off for an overdue balance</p>
              <Button data-target="dispute" data-cursor="hand" size={size} variant="secondary" className="siw-dispute">Help me dispute this</Button>
            </div>
            <div className="siw-finding">
              <span className="siw-tag">Act on this</span>
              <p className="siw-finding-title">RM136.75 unpaid from earlier bills is carried into this one</p>
            </div>
          </section>
        ),
      }}
    />
  );
}

// The case page's message and its AI rewrite
function CaseBody({ s, phone }: { s: S; phone?: boolean }) {
  const size = phone ? "large" : "small";
  return (
    <div className="siw-case-body">
      <Text className="siw-case-title">Your message, ready to send</Text>
      <div className="siw-ai">
        <Text className="siw-ai-label">AI rewrite</Text>
        <Button data-target="firmer" data-cursor="hand" size={size} variant="secondary">Make it firmer</Button>
        <Bar w={84} h={22} r={11} tone={1} />
      </div>
      <Collapse open={s.firmer}>
        <p className="siw-done">✓ Draft rewritten. 9 AI rewrites left today.</p>
      </Collapse>
      <div className="siw-draft" data-firmer={s.firmer || undefined}>
        <p>Subject: Billing enquiry – August 2026 bill</p>
        <p>The charge in question is “Fixed Line Reconnection Fee” for RM10.00.</p>
        {[92, 80, 86, 48].map((w, i) => <Bar key={i} w={`${w}%`} h={5} tone={2} />)}
      </div>
    </div>
  );
}

// Desktop: the decoder in a browser window, the case window comes forward beside it, a mouse pointer
function WindowDemo() {
  return (
    <Stage width={760} height={380} initial={initial} poster={POSTER} script={script} cursor={{ at: REST }} className="siw">
      {(s) => (
        <>
          <Window url="billwise-blush.vercel.app/decoder" className="siw-browser" receded={s.caseOpen}>
            <div className="siw-page">
              <header className="siw-nav">
                <Text className="siw-brand-name">BillWise</Text>
                <span className="siw-nav-links"><Bar w={54} h={6} tone={3} /><Bar w={48} h={6} tone={2} /><Bar w={40} h={6} tone={2} /></span>
              </header>
              <DecoderScreen s={s} />
            </div>
          </Window>
          <Window url="billwise-blush.vercel.app/help" className="siw-case" data-show={s.caseOpen}>
            <CaseBody s={s} />
          </Window>
          <span data-target="rest" style={{ position: "absolute", left: REST.x, top: REST.y }} />
        </>
      )}
    </Stage>
  );
}

// Phone: the same flow on BillWise's phone layout, taps instead of a pointer, the case rises as a sheet
function PhoneDemo() {
  return (
    <Stage width={358} height={520} initial={initial} poster={POSTER} script={script} cursor={{ at: PHONE_REST, style: "touch" }} className="siw siw-m">
      {(s) => (
        <>
          <Phone width={300} className="siw-phone">
            <div className="siw-app" data-back={s.caseOpen || undefined}>
              <header className="siw-nav">
                <Text className="siw-brand-name">BillWise</Text>
                <span className="siw-menu" aria-hidden><i /><i /><i /></span>
              </header>
              <DecoderScreen s={s} phone />
            </div>
            <div className="siw-sheet" data-show={s.caseOpen || undefined}>
              <span className="siw-grab" aria-hidden />
              <CaseBody s={s} phone />
            </div>
          </Phone>
          <span data-target="rest" style={{ position: "absolute", left: PHONE_REST.x, top: PHONE_REST.y }} />
        </>
      )}
    </Stage>
  );
}

export function SeeItWork() {
  return (
    <>
      <div className="hidden sm:block"><WindowDemo /></div>
      <div className="sm:hidden"><PhoneDemo /></div>
    </>
  );
}
