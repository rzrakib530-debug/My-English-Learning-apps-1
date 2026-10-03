/**
 * Rule based English coach tuned for Bangladeshi learners.
 * Detects the mistakes Bangla speakers most often make when talking,
 * explains each one in Bangla, and rewrites the sentence correctly.
 */

export type Correction = {
  id: string;
  excerpt: string;
  wrong: string;
  right: string;
  whyBn: string;
  type: "grammar" | "vocabulary" | "style" | "fluency";
};

export type Analysis = {
  words: number;
  sentences: number;
  wpm: number;
  uniqueWords: number;
  longestWord: string;
  fillers: string[];
  repeats: string[];
  corrections: Correction[];
  scores: { accuracy: number; fluency: number; vocabulary: number; confidence: number };
  band: number;
  overall: number;
  rewritten: string;
  praise: string[];
  nextSteps: string[];
  nextStepsBn: string[];
};

type Rule = {
  id: string;
  re: RegExp;
  right: (m: RegExpMatchArray) => string;
  whyBn: string;
  type?: Correction["type"];
};

const RULES: Rule[] = [
  {
    id: "stative-progress",
    re: /\b(i|we|they|you) (am|are) having (a|an|the|my|our|their)? ?([a-z]+)/i,
    right: (m) => `${m[1]} have ${m[3] ?? ""} ${m[4]}`.replace(/\s+/g, " "),
    whyBn: "'have' যখন মালিকানা বোঝায়, তখন continuous (having) ব্যবহার করা হয় না। বলুন: I have a pen.",
    type: "grammar",
  },
  {
    id: "am-agree",
    re: /\b(i|we|they) am agree\b|\bi am agree\b/i,
    right: () => "I agree",
    whyBn: "'agree' নিজেই ক্রিয়া, তাই আগে am/is/are বসে না। বলুন: I agree.",
    type: "grammar",
  },
  {
    id: "donnt-3rd",
    re: /\b(he|she|it|rahim|bob) don'?t\b/i,
    right: (m) => `${m[1]} doesn't`,
    whyBn: "Third person singular (he/she/it) এর সাথে don't না বলে doesn't বলতে হয়।",
    type: "grammar",
  },
  {
    id: "past-time-present",
    re: /\b(yesterday|last night|last week|last year)\b[^.?!]*\b(go|goes|see|sees|come|comes|eat|buys|take|is)\b/i,
    right: (m) => `${m[1]} … past tense (went / saw / came / ate / bought / took / was)`,
    whyBn: "yesterday / last week থাকলে বাক্যটি Simple Past এ লিখতে হয় — 'yesterday I go' না বলে 'yesterday I went' বলুন।",
    type: "grammar",
  },
  {
    id: "double-past",
    re: /\bdidn'?t (went|saw|came|took|bought|ate|did|made|went)\b/i,
    right: (m) => `didn't ${m[2] === "did" ? "do" : m[2].slice(0, m[2].length - 1)}`,
    whyBn: "didn't এর পর Verb-1 বসে। 'didn't went' ভুল, 'didn't go' ঠিক।",
    type: "grammar",
  },
  {
    id: "discuss-about",
    re: /\bdiscuss about\b/i,
    right: () => "discuss",
    whyBn: "'discuss' এর সাথে about বসে না — discuss is already 'about' something।",
    type: "grammar",
  },
  {
    id: "return-back",
    re: /\b(return back|repeat again|again and again)\b/i,
    right: (m) => (m[1].toLowerCase() === "return back" ? "return" : m[1].toLowerCase() === "repeat again" ? "repeat" : "repeatedly"),
    whyBn: "return মানেই ফিরে আসা, তাই back অতিরিক্ত। একইভাবে repeat এর সাথে again লাগে না।",
    type: "vocabulary",
  },
  {
    id: "more-better",
    re: /\bmore (better|worse|easier|faster|slower)\b/i,
    right: (m) => m[1],
    whyBn: "অনিয়মিত comparative (better/worse/faster) এর আগে more বসে না।",
    type: "grammar",
  },
  {
    id: "plural-uncountable",
    re: /\b(childrens|peoples|informations|advices|furnitures|knowledges|softwares|moneys|staffs)\b/i,
    right: (m) => m[1].replace(/s$/i, "").replace(/children$/i, "children"),
    whyBn: "এগুলো uncountable/already plural — 'informations' না বলে 'information' বা 'a piece of information' বলুন।",
    type: "grammar",
  },
  {
    id: "article-a-an",
    re: /\b(a) (honest|hour|honest man|eight)/i,
    right: (m) => `an ${m[2]}`,
    whyBn: "শব্দের উচ্চারণ স্বরে (vowel sound) শুরু হলে 'an' বসে — an hour, an honest boy.",
    type: "grammar",
  },
  {
    id: "article-an-consonant",
    re: /\ban (university|user|one[- ]?way|European|useful)\b/i,
    right: (m) => `a ${m[1]}`,
    whyBn: "ব্যঞ্জনে (yu-, wu-) শুরু হলে 'a' বসে — a university, a useful tool.",
    type: "grammar",
  },
  {
    id: "missing-article-job",
    re: /\b(he|she|my father|my mother|i) is (a |an )?(teacher|doctor|engineer|student|nurse|officer|engineer|accountant)\b/i,
    right: (m) => `${m[1]} is a ${m[3]}`,
    whyBn: "পেশা বোঝाতে singular noun এর আগে a/an বসাতে হয়: She is a teacher.",
    type: "grammar",
  },
  {
    id: "since-for",
    re: /\bsince (two|three|four|five|six|ten|many|some|long) (years|months|days|weeks)\b/i,
    right: (m) => `for ${m[1]} ${m[2]}`,
    whyBn: "সময়ের ব্যবধান (duration) হলে 'for', নির্দিষ্ট শুরু হলে 'since' — for two years ✔ / since 2019 ✔",
    type: "grammar",
  },
  {
    id: "since-present-perfect",
    re: /\b(i|we|he|she) (am|is|are) (living|staying|working|studying|knowing) .*since\b/i,
    right: (m) => `${m[1]} has/have been ${m[3]} … since`,
    whyBn: "অতীতে শুরু হয়ে এখনো চলছে — Present Perfect Continuous দরকার: I have been living here since 2018.",
    type: "grammar",
  },
  {
    id: "good-name",
    re: /\bwhat is your good name\b/i,
    right: () => "what's your name",
    whyBn: "'good name' শুধু বাংলা 'আপনার ভালো নাম কী?' এর সরাসরি অনুবাদ — ইংরেজিতে বলুন: What's your name?",
    type: "vocabulary",
  },
  {
    id: "myself-intro",
    re: /\bmyself ([a-z]+)/i,
    right: (m) => `I'm ${m[1]}`,
    whyBn: "নাম পরিচয় দিতে 'Myself Rahim' বলাটা অপ্রাকৃতিক — বলুন: I'm Rahim / My name is Rahim.",
    type: "style",
  },
  {
    id: "needful",
    re: /\b(do the needful|needful|as above|please advice me|revert back)\b/i,
    right: () => "please handle this / please reply to me",
    whyBn: "'do the needful' পুরনো অফিস-ইংরেজি; আধুনিক যোগাযোগে এড়িয়ে চলুন।",
    type: "style",
  },
  {
    id: "explain-me",
    re: /\b(explain|describe|discuss|tell) (me )?(it )?to? ?me\b(?!\s+that)/i,
    right: (m) => (m[1].toLowerCase() === "tell" ? "tell me" : `${m[1]} it to me`),
    whyBn: "explain/discuss/describe এর পর object চাই: 'explain me' ✗ → 'explain it to me' ✔ ('tell me' ঠিক আছে)।",
    type: "grammar",
  },
  {
    id: "suggest-me",
    re: /\bsuggest me\b/i,
    right: () => "give me a suggestion",
    whyBn: "'suggest me' ভুল — suggest something to me অথবা 'give me a suggestion' বলুন।",
    type: "grammar",
  },
  {
    id: "preposition-monday",
    re: /\b(in|on) (monday|tuesday|wednesday|friday|saturday|sunday)\b/i,
    right: (m) => (m[1].toLowerCase() === "on" ? `on ${m[2]}` : `on ${m[2]}`),
    whyBn: "দিনের সাথে সবসময় 'on' — on Friday, on Monday morning.",
    type: "grammar",
  },
  {
    id: "marry-with",
    re: /\bmarried with\b/i,
    right: () => "married to",
    whyBn: "married always takes 'to' — He is married to a doctor.",
    type: "grammar",
  },
  {
    id: "enter-into",
    re: /\b(enter into|discuss about|complain about to|return back to)\b/i,
    right: () => "enter",
    whyBn: "'enter' এর পর into বসে না (enter the room)।",
    type: "grammar",
  },
  {
    id: "i-lower",
    re: /\bi\b(?=[ ,.!?])/,
    right: () => "I",
    whyBn: "সব জায়গায় 'I' capital letters এ লিখতে হয় — বাংলা থেকে লেখার সময় এটা বাদ পড়ে যায়।",
    type: "style",
  },
  {
    id: "hedge-very",
    re: /\b(very much|basically|actually|just now|no matter)\b/i,
    right: (m) => (m[1].toLowerCase() === "just now" ? "just now (a moment ago)" : m[1]),
    whyBn: "'very much' অতিরিক্ত ব্যবহার এড়িয়ে চলুন: I like it very much → I really like it.",
    type: "style",
  },
  {
    id: "hope-you-are",
    re: /\bi hope you are fine\b/i,
    right: () => "I hope you're doing well",
    whyBn: "'you are fine' চেনা-শোনা শুন্‌য়, কিন্তু আধুনিক ইমেইল/কথায় 'doing well' বেশি স্বাভাবিক।",
    type: "style",
  },
];

const FILLERS = ["um", "uh", "unn", "ah", "erm", "you know", "i mean", "like", "actually", "basically", "right"];
const BANNED_CONNECTIVES = ["because", "although", "however", "moreover", "so that", "in order to", "for example", "on the other hand", "as a result", "first of all", "finally"];
const GOOD_WORDS = new Set([
  "environment", "opportunity", "responsible", "government", "technology", "community", "experience",
  "necessary", "successful", "traditional", "development", "education", "sustainable", "confident",
  "communicate", "practise", "vocabulary", "pronunciation", "effortless", "challenging", "rewarding",
]);

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeSpeech(transcript: string, seconds: number): Analysis {
  const clean = transcript.trim().replace(/\s+/g, " ");
  const tokens = tokenize(clean);
  const words = tokens.length;
  const sentenceParts = clean.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentences = Math.max(sentenceParts.length, words > 0 ? 1 : 0);
  const minutes = Math.max(seconds / 60, 0.05);
  const wpm = Math.round(words / minutes);
  const unique = new Set(tokens).size;
  const longestWord = tokens.reduce((a, b) => (b.length > a.length ? b : a), "");

  const fillers: string[] = [];
  for (const f of FILLERS) {
    const m = clean.match(new RegExp(`\\b${f}\\b`, "gi"));
    if (m) for (let i = 0; i < m.length; i++) fillers.push(f);
  }

  const repeats: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === tokens[i - 1] && tokens[i].length > 2 && !repeats.includes(tokens[i])) {
      repeats.push(tokens[i]);
    }
  }

  const corrections: Correction[] = [];
  let rewritten = clean;
  for (const rule of RULES) {
    const m = rewritten.match(rule.re);
    if (m) {
      const right = rule.right(m);
      corrections.push({
        id: rule.id,
        excerpt: m[0],
        wrong: m[0],
        right,
        whyBn: rule.whyBn,
        type: rule.type ?? "grammar",
      });
      rewritten = rewritten.replace(rule.re, right);
    }
  }

  // punctuation / capitalisation hygiene
  if (words > 6 && !/[.!?]$/.test(clean)) {
    corrections.push({
      id: "punctuation",
      excerpt: clean.slice(-24),
      wrong: "…no full stop",
      right: "…finish with a full stop.",
      whyBn: "বড় কথা শেষে পূর্ণবিরাম (.) দিন — না হলে run-on বাক্য তৈরি হয়।",
      type: "style",
    });
  }
  const runOn = sentenceParts.find((s) => s.split(/\s+/).length > 28);
  if (runOn) {
    corrections.push({
      id: "run-on",
      excerpt: runOn.slice(0, 34) + "…",
      wrong: "28+ words in one sentence",
      right: "Break it into 2 short sentences",
      whyBn: "এক শ্বাসে ২৫+ শব্দ শুনতে ক্লান্তিকর। ছোট বাক্যে ভাগ করুন: subject + verb + idea.",
      type: "style",
    });
  }

  const errCount = corrections.filter((c) => c.type === "grammar").length;
  const styleCount = corrections.length - errCount;
  const accuracy = clamp(100 - errCount * 9 - styleCount * 3 - (words < 8 ? 10 : 0));
  const fluency = clamp(
    60 + bandScore(wpm, 95, 155) * 0.28 - fillers.length * 5 - repeats.length * 6 + (words > 40 ? 12 : 0),
  );
  const vocab = clamp(
    34 + (unique / Math.max(words, 1)) * 70 + countConnectives(clean) * 6 + (GOOD_WORDS.has(longestWord) ? 8 : 0) + (words > 25 ? 8 : 0),
  );
  const confidence = clamp(28 + words * 1.1 + (wpm > 80 ? 18 : 0) - fillers.length * 3);
  const overall = Math.round(accuracy * 0.32 + fluency * 0.26 + vocab * 0.22 + confidence * 0.2);
  const band = Math.max(3, Math.min(8.5, 2.5 + overall / 20));

  const praise: string[] = [];
  if (words > 45) praise.push("ধারাবাহিকভাবে বেশ লম্বা কথা বলেছেন — দারুণ effort! 🔥");
  if (fillers.length === 0 && words > 12) praise.push("filler (um/uh/you know) প্রায় নেই — কথা পরিষ্কার শোনায়।");
  if (countConnectives(clean) >= 2) praise.push("because / although / for example এর মতো linking words ব্যবহার করেছেন।");
  if (errCount === 0) praise.push("গুরুতর grammar ভুল পাওয়া যায়নি — ঠিক আছেন!");
  if (!praise.length) praise.push("শুরুটাই সবচেয়ে কঠিন — আজ practice করেছেন, সেটাই বড় কথা। 💪");

  const nextSteps: string[] = [];
  const nextStepsBn: string[] = [];
  if (words < 40) {
    nextSteps.push("Give a reason + an example for every answer.");
    nextStepsBn.push("প্রতিটা উত্তরে একটি কারণ আর একটি উদাহরণ যোগ করুন — তাহলেই কথা বাড়বে।");
  }
  const pattern = corrections.find((c) => c.type === "grammar");
  if (pattern) {
    nextSteps.push(`Fix this pattern: “${pattern.wrong}” → “${pattern.right}”`);
    nextStepsBn.push(`এই ভুলটা আজই ঠিক করে ফেলুন: ${pattern.whyBn}`);
  }
  if (wpm > 175) {
    nextSteps.push("Slow down by 20% and finish each sentence.");
    nextStepsBn.push("দৌড়ানো বন্ধ করুন — ধীরে, প্রতিটা বাক্য শেষ করে বলুন।");
  } else if (wpm < 70 && words > 10) {
    nextSteps.push("Do 3 repetitions of the same answer to build speed.");
    nextStepsBn.push("একই উত্তরটা ৩ বার টানা বলে ফেলুন — গতি নিজে থেকেই বাড়বে।");
  }
  if (fillers.length > 2) {
    nextSteps.push("Replace fillers with a 1-second silence.");
    nextStepsBn.push("'um/you know' এর জায়গায় এক সেকেন্ড চুপ থাকুন — silence sounds confident.");
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Level up: add an emotion + a future plan to your answer.");
    nextStepsBn.push("উত্তরে অনুভূতি আর ভবিষ্যতের পরিকল্পনা যোগ করুন — এটাই advanced English।");
  }

  return {
    words,
    sentences,
    wpm,
    uniqueWords: unique,
    longestWord,
    fillers,
    repeats,
    corrections,
    scores: { accuracy: round(accuracy), fluency: round(fluency), vocabulary: round(vocab), confidence: round(confidence) },
    band: Math.round(band * 2) / 2,
    overall: round(overall),
    rewritten: capitalize(rewritten),
    praise,
    nextSteps,
    nextStepsBn,
  };
}

/** 0..100 similarity between what the learner said and the target sentence */
export function shadowScore(target: string, said: string) {
  const a = tokenize(target);
  const b = tokenize(said);
  if (!a.length || !b.length) return { score: 0, hitWords: [], missedWords: [] };
  const bSet = new Set(b);
  const hitWords = a.filter((w) => bSet.has(w));
  const missedWords = a.filter((w) => !bSet.has(w));
  const raw = (2 * hitWords.length) / (a.length + b.length); // Dice
  const orderBonus = a.join(" ").includes(b.slice(0, Math.min(4, b.length)).join(" ")) ? 6 : 0;
  return {
    score: Math.min(100, Math.round(raw * 100 + orderBonus)),
    hitWords,
    missedWords,
  };
}

function countConnectives(text: string) {
  let n = 0;
  for (const c of BANNED_CONNECTIVES) if (new RegExp(`\\b${c.replace(/ /g, "\\s+")}\\b`, "i").test(text)) n++;
  return n;
}
function bandScore(v: number, lo: number, hi: number) {
  if (v >= lo && v <= hi) return 100;
  return v < lo ? Math.max(0, 100 - (lo - v) * 1.6) : Math.max(30, 100 - (v - hi) * 1.2);
}
function clamp(n: number) {
  return Math.max(20, Math.min(100, n));
}
function round(n: number) {
  return Math.round(Math.max(0, Math.min(100, n)));
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
