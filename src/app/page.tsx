import Link from "next/link";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { activities, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";
import { TOPICS, FALSE_FRIENDS } from "@/lib/content";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🎙️",
    title: "স্পিকিং ল্যাব",
    bn: "মাইকে ১–৩ মিনিট কথা বলুন, AI কোচ প্রতিটা বাক্য দেখে বানান-ঠিক উত্তর আর ব্যাখ্যা দেবে — সম্পূর্ণ বাংলায়।",
    href: "/speak",
    tone: "from-jam/20",
  },
  {
    icon: "📞",
    title: "লাইভ ভয়েস কল",
    bn: "এই অ্যাপের আরেকজন শিক্ষার্থীর সাথে সরাসরি voice call — partner খুঁজুন, topic পান, ৫ মিনিট ইংরেজিতে আড্ডা দিন।",
    href: "/call",
    tone: "from-sky/20",
  },
  {
    icon: "🔁",
    title: "শ্যাডোয়িং ট্রেনার",
    bn: "নেটিভ-স্পিড বাক্য শুনে হুবহু নকল করুন। আপনার উচ্চারণ লক্ষ্যবাক্যের সাথে মিলিয়ে score পান।",
    href: "/shadow",
    tone: "from-saffron/20",
  },
  {
    icon: "🎭",
    title: "রিয়েল-লাইফ রোল-প্লে",
    bn: "রেস্টুরেন্ট, ইন্টারভিউ, ডাক্তার, কুরিয়ার কল — স্ক্রিপ্ট ধরে ধরে সাড়া দেওয়ার প্র্যাকটিস।",
    href: "/roleplay",
    tone: "from-lilac/20",
  },
  {
    icon: "📐",
    title: "গ্রামার ক্যাম্প",
    bn: "article, tense, preposition — শুধু বাংলাদেশিরা যেখানে ভুল করে সেই জায়গাগুলো ছোট কুইজসহ।",
    href: "/grammar",
    tone: "from-rose/20",
  },
  {
    icon: "🃏",
    title: "শব্দভাণ্ডার + Spaced repetition",
    bn: "২৪টা দরকারি শব্দ/ফ্রেজ, বাংলা মানেসহ। ভুললে বারবার ফিরে আসবে, মনে থাকলে বিরতি পাবে।",
    href: "/vocab",
    tone: "from-jam/20",
  },
];

export default async function Home() {
  const me = await getSessionUser();
  if (me) redirect("/dashboard");

  const [counts] = await db
    .select({
      learners: sql<number>`count(distinct ${users.id})::int`,
      minutes: sql<number>`coalesce(sum(${activities.durationSec}),0)/60::int`,
      sessions: sql<number>`count(${activities.id})::int`,
    })
    .from(users)
    .leftJoin(activities, sql`${activities.userId} = ${users.id}`);

  const [{ online }] = await db
    .select({ online: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '2 minutes')::int` })
    .from(users);

  const topic = TOPICS[(new Date().getDate() - 1) % TOPICS.length];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-jam text-[#04150f]">🗣️</span>
          <span className="font-display text-lg font-bold">
            বলো<span className="grad-text">English</span>
          </span>
        </div>
        <Link href="/#join" className="bangla soft-btn rounded-full px-4 py-2 text-sm font-semibold text-chalk hover:border-jam/50">
          লগইন / প্রগ্রেস দেখুন
        </Link>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1180px] items-start gap-10 px-5 pb-10 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-12">
        <div>
          <p className="bangla inline-flex items-center gap-2 rounded-full border border-jam/35 bg-jam/10 px-3 py-1 text-xs font-semibold text-jam">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-jam" />
            এখন অনলাইন: {online ?? 0} জন · কল রেডি
          </p>
          <h1 className="font-display mt-5 text-[clamp(2.1rem,6vw,3.6rem)] font-bold leading-[1.08] tracking-tight">
            ইংরেজি <span className="grad-text">পড়া</span> বন্ধ করুন,
            <br />
            ইংরেজি <span className="grad-text">বলা</span> শুরু করুন।
          </h1>
          <p className="bangla mt-5 max-w-[54ch] text-[15px] leading-8 text-mist">
            গ্রামার বইয়ে সব ঠিক ছিল — কিন্তু কেউ English এ কথা বললে বুক ধড়ফড় শুরু হয়ে যায়? এই অ্যাপ ঠিক সেই জায়গাটাই
            টার্গেট করে: প্রতিদিন ১৫ মিনিট <strong className="text-chalk">মাইকে কথা</strong>, আর সপ্তাহে ৩ বার{" "}
            <strong className="text-chalk">আরেকজন শিক্ষার্থীর সাথে লাইভ ভয়েস কল</strong>। ভুল হলে ভয় নেই — প্রতিটা ভুলের
            কারণ বাংলায় বুঝিয়ে দেওয়া হয়।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#join"
              className="rounded-full bg-jam px-5 py-3 font-display text-sm font-bold text-[#04150f] shadow-[0_20px_46px_-20px_rgba(0,196,143,0.95)] transition-transform hover:scale-[1.02]"
            >
              ৫ সেকেন্ডে অ্যাকাউন্ট খুলুন
            </a>
            <Link href="/call" className="bangla soft-btn rounded-full px-5 py-3 text-sm font-bold text-chalk">
              ভয়েস কলটা কেমন দেখুন
            </Link>
          </div>

          <div className="mt-8 grid max-w-[520px] grid-cols-3 gap-3">
            {[
              { k: (counts?.learners ?? 0).toString(), v: "লার্নার" },
              { k: `${counts?.minutes ?? 0}`, v: "প্র্যাকটিস মিনিট" },
              { k: `${counts?.sessions ?? 0}`, v: "সেশন রেকর্ড" },
            ].map((s) => (
              <div key={s.v} className="panel px-3 py-3 text-center">
                <p className="font-display text-xl font-bold text-jam">{s.k}</p>
                <p className="bangla text-[11px] text-mist">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="join" className="space-y-4">
          <JoinForm />
          <div className="panel p-5">
            <p className="bangla text-[11px] font-semibold uppercase tracking-wider text-mist">আজকের টপিক</p>
            <p className="font-display mt-2 text-[17px] font-semibold leading-snug">{topic.en}</p>
            <p className="bangla mt-1.5 text-sm text-mist">{topic.bn}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topic.hints.map((h) => (
                <span key={h} className="rounded-full border border-line bg-panel-2/70 px-2.5 py-1 text-[11px] text-mist">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK DEMO */}
      <section className="mx-auto max-w-[1180px] px-5 py-8">
        <div className="panel grid gap-6 p-6 lg:grid-cols-2 lg:p-8">
          <div>
            <h2 className="font-display text-2xl font-bold">
              আপনি যা বললেন → <span className="grad-text">আসলে যা বলা দরকার</span>
            </h2>
            <p className="bangla mt-3 text-sm leading-7 text-mist">
              প্রতিটা সেশনে ট্রান্সক্রিপ্ট বিশ্লেষণ করে ৪টা স্কোর (accuracy, fluency, vocabulary, confidence), ভুলগুলো pointer
              ধরে ধরে দেখানো হয়, আর IELTS-এর মতো rough band estimate দেওয়া হয়।
            </p>
            <ul className="bangla mt-4 space-y-2 text-sm text-mist">
              <li>✅ filler (um / you know) গুনে দেয়</li>
              <li>✅ run-on বাক্য, article, tense ভুল ধরে</li>
              <li>✅ পুরো উত্তরটা rewrite করে দিয়ে দেয়</li>
            </ul>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-rose/30 bg-rose/[0.07] p-4">
              <p className="text-[13px] text-mist">আপনার কথা (transcript)</p>
              <p className="font-display mt-1 text-[15px] leading-relaxed text-chalk line-through decoration-rose/50">
                yesterday I am going to market and I am buying a fish, discuss about the price…
              </p>
            </div>
            <div className="rounded-2xl border border-jam/35 bg-jam/[0.07] p-4">
              <p className="text-[13px] text-mist">কোচ সংস্করণ</p>
              <p className="font-display mt-1 text-[15px] leading-relaxed text-chalk">
                Yesterday I went to the market and bought a fish — I had to argue about the price.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panel-2/60 p-4">
              <p className="bangla text-[13px] leading-7 text-mist">
                🇧🇩 <strong className="text-chalk">কারণ:</strong> yesterday থাকলে Simple Past (went / bought) দরকার;
                “discuss about”-এ about লাগে না; আর সেই নির্দিষ্ট market-এর আগে the বসে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1180px] px-5 py-10">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">সব কিছু এক অ্যাপে</h2>
        <p className="bangla mt-2 text-sm text-mist">কোনো সাবস্ক্রিপশন নেই, কোনো অ্যাড নেই। শুধু প্র্যাকটিস।</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className={`panel card-hover group relative overflow-hidden bg-gradient-to-br ${f.tone} to-transparent p-5`}>
              <span className="text-2xl">{f.icon}</span>
              <p className="font-display mt-3 text-lg font-bold">{f.title}</p>
              <p className="bangla mt-2 text-[13px] leading-7 text-mist">{f.bn}</p>
              <span className="bangla mt-3 inline-block text-xs font-bold text-jam opacity-0 transition-opacity group-hover:opacity-100">
                খুলুন →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CALL SPOTLIGHT */}
      <section className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="panel overflow-hidden p-6 lg:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="bangla text-xs font-bold uppercase tracking-[0.18em] text-sky">Live voice rooms</p>
              <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                অচেনা কেউ নয় — <span className="grad-text">আপনার মতোই আরেকজন বাংলাদেশী</span>
              </h2>
              <p className="bangla mt-3 max-w-[62ch] text-sm leading-7 text-mist">
                “Partner খুঁজুন” চাপলেই ৫-৬০ সেকেন্ডের মধ্যে কারো সাথে match। কথাবার্তা সম্পূর্ণ browser-to-browser (WebRTC) —
                অডিও আমাদের সার্ভারে দিয়ে যায় না। শুধু offer/answer (signalling) সার্ভারে থাকে, কল শেষ হলেই মুছে যায়। নিচে
                ১২টা ready topic, chat panel, mute, timer — সব আছে।
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {["🎧 এক্সট্রা অ্যাপ লাগে না", "🔒 P2P অডিও", "⏱️ ৫ মিনিট টাইমার"].map((t) => (
                  <p key={t} className="bangla rounded-xl border border-line bg-panel-2/60 px-3 py-2 text-center text-xs text-mist">
                    {t}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-canvas/60 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-jam/15 text-jam">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full border border-jam/60" />
                    🧑
                  </span>
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-sky/15 text-sky">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full border border-sky/60" />
                    🧕
                  </span>
                </div>
                <span className="bangla rounded-full bg-jam/15 px-2 py-0.5 text-[11px] font-bold text-jam">connected</span>
              </div>
              <p className="bangla mt-4 text-xs text-mist">আজকের topic</p>
              <p className="font-display text-sm font-semibold">Traffic in Dhaka — what would actually fix it?</p>
              <div className="mt-4 flex gap-[3px]">
                {Array.from({ length: 34 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-sky"
                    style={{ height: `${6 + Math.abs(Math.sin(i * 0.9)) * 26}px`, opacity: 0.3 + Math.abs(Math.cos(i)) * 0.6 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FALSE FRIENDS */}
      <section className="mx-auto max-w-[1180px] px-5 py-10">
        <h2 className="font-display text-2xl font-bold">বাংলা থেকে সরাসরি অনুবাদে যে ৬টা ভুল সবসময় হয়</h2>
        <p className="bangla mt-2 text-sm text-mist">এগুলো ঠিক করলেই শুনতে সঙ্গে সঙ্গে improvement আসে।</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FALSE_FRIENDS.slice(0, 6).map((f, i) => (
            <div key={f.bangla} className="panel card-hover p-4">
              <p className="bangla text-[11px] text-mist">
                {i + 1}. {f.bangla}
              </p>
              <p className="mt-2 text-sm text-rose line-through decoration-rose/40">{f.literal}</p>
              <p className="font-display mt-1 text-[15px] font-semibold text-jam">{f.natural}</p>
              <p className="bangla mt-2 text-[12px] leading-6 text-mist">{f.whyBn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1180px] px-5 py-12">
        <div className="panel relative overflow-hidden p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 animate-floaty rounded-full bg-jam/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 animate-floaty rounded-full bg-saffron/15 blur-3xl" />
          <h2 className="font-display relative text-2xl font-bold sm:text-3xl">
            আজকের ১৫ মিনিট = ৩০ দিন পর আত্মবিশ্বাস
          </h2>
          <p className="bangla relative mx-auto mt-3 max-w-[58ch] text-sm leading-7 text-mist">
            স্ট্রিক, XP, লেভেল আর লিডারবোর্ড — প্র্যাকটিসকে অভ্যাস বানিয়ে দেওয়ার জন্য বানানো। এখনই নাম লিখুন, প্রথম
            স্পিকিং টাস্কটা করে ফেলুন।
          </p>
          <a
            href="#join"
            className="relative mt-6 inline-block rounded-full bg-jam px-6 py-3 font-display text-sm font-bold text-[#04150f] transition-transform hover:scale-[1.03]"
          >
            শুরু করি 🔥
          </a>
        </div>
      </section>

      <footer className="border-t border-line/70 px-5 py-8 text-center">
        <p className="bangla text-xs text-mist">
          বলোEnglish · বাংলাদেশী শিক্ষার্থীদের জন্য তৈরি · মাইক্রোফোন ও অডিও শুধু আপনার ব্রাউজারে কাজ করে
        </p>
      </footer>
    </div>
  );
}
