const STEPS = [
  {
    n: "01",
    t: "Upload what you've got",
    d: "A chapter, worksheet, or slide deck — we'll turn it into a first draft of questions.",
  },
  {
    n: "02",
    t: "Set the terms, gently",
    d: "Pick a duration and question mix. Turn on only the proctoring checks you actually need.",
  },
  {
    n: "03",
    t: "Let the results come to you",
    d: "Students join with a PIN, sit the exam, and their scores land on your desk automatically.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-7 pb-24 max-w-content mx-auto grid md:grid-cols-3 gap-10">
      {STEPS.map((s) => (
        <div key={s.n}>
          <div className="font-mono text-sm mb-3 text-gold">{s.n}</div>
          <div className="font-display text-lg mb-2 text-espresso">{s.t}</div>
          <div className="text-sm leading-relaxed text-bark">{s.d}</div>
        </div>
      ))}
    </section>
  );
}
