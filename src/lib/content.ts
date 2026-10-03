/** Static learning content — Bangla-first English practice for learners in Bangladesh */

export type Topic = {
  id: string;
  en: string;
  bn: string;
  level: "beginner" | "intermediate" | "advanced";
  hints: string[];
  minutes: number;
};

export const TOPICS: Topic[] = [
  { id: "t1", en: "Describe your neighbourhood to a foreign guest.", bn: "আপনার এলাকাটা একজন বিদেশি অতিথিকে বর্ণনা করুন।", level: "beginner", minutes: 1, hints: ["It's located near…", "What I like most is…", "You can find…"], },
  { id: "t2", en: "Talk about your favourite Bangladeshi food and why you love it.", bn: "প্রিয় খাবার আর সেটা কেন পছন্দ — বলুন।", level: "beginner", minutes: 1, hints: ["The taste is…", "I usually have it when…", "It reminds me of…"] },
  { id: "t3", en: "Explain one problem in your city and one solution.", bn: "শহরের একটি সমস্যা ও সমাধান বুঝিয়ে বলুন।", level: "intermediate", minutes: 2, hints: ["Traffic congestion means…", "If the government…, then…", "In my area we could…"] },
  { id: "t4", en: "Describe a person who changed your life.", bn: "যে মানুষটি আপনার জীবন বদলে দিয়েছেন তাঁকে নিয়ে বলুন।", level: "intermediate", minutes: 2, hints: ["I first met him when…", "He taught me to…", "Because of that…"] },
  { id: "t5", en: "Why should students learn English in Bangladesh?", bn: "বাংলাদেশী শিক্ষার্থীদের ইংরেজি শোখা কেন দরকার?", level: "intermediate", minutes: 2, hints: ["First of all…", "For example…", "On the other hand…"] },
  { id: "t6", en: "Describe your last Eid celebration in detail.", bn: "গত ঈদের দিনগুলো বিস্তারিত বর্ণনা করুন।", level: "beginner", minutes: 2, hints: ["We woke up early and…", "The best part was…", "I felt…"] },
  { id: "t7", en: "Talk about a job interview: strengths, weaknesses, goals.", bn: "চাকরির ইন্টারভিউর মতো নিজের গুণ, দুর্বলতা আর লক্ষ্য বলুন।", level: "advanced", minutes: 3, hints: ["My greatest strength is…", "I'm working on…", "In five years I see myself…"] },
  { id: "t8", en: "Explain how you use your phone every day — and one rule you set for yourself.", bn: "ফোন ব্যবহারের নিত্যদিনের গল্প আর নিজের জন্য একটা নিয়ম বলুন।", level: "beginner", minutes: 2, hints: ["I spend most of my time on…", "It helps me to…", "So I decided to…"] },
  { id: "t9", en: "Should university classes be in English or Bangla? Give your opinion.", bn: "বিশ্ববিদ্যালয়ের ক্লাস ইংরেজিতে নাকি বাংলায় হওয়া উচিত?", level: "advanced", minutes: 3, hints: ["I strongly believe…", "Critics argue that…", "However, evidence suggests…"] },
  { id: "t10", en: "Describe a time you were stuck in load shedding / traffic and what you did.", bn: "লোডশেডিং বা জ্যামের অভিজ্ঞতা এবং কী করলেন বলুন।", level: "beginner", minutes: 2, hints: ["Suddenly…", "Instead of panicking…", "In the end…"] },
  { id: "t11", en: "Introduce your profession to someone who has never heard of it.", bn: "আপনার পেশা এমন কাউকে পরিচয় দিন যে এর নামও শোনেনি।", level: "intermediate", minutes: 2, hints: ["In simple words, I…", "My typical day looks like…", "The hardest part is…"] },
  { id: "t12", en: "What does a perfect weekend look like for you?", bn: "আদর্শ সপ্তাহান্ত আপনার কেমন লাগে?", level: "beginner", minutes: 1, hints: ["I usually start with…", "Nothing beats…", "I end my day by…"] },
  { id: "t13", en: "Persuade a friend to visit Sylhet for three days.", bn: "একজন বন্ধুকে তিন দিনের সিলেট ট্রিপে রাজি করান।", level: "intermediate", minutes: 2, hints: ["Imagine…", "It only costs…", "You'll regret it if…"] },
  { id: "t14", en: "Talk about one habit you are trying to break.", bn: "যে অভ্যাসটা ছাড়ার চেষ্টা করছেন সেটা নিয়ে বলুন।", level: "intermediate", minutes: 2, hints: ["I've been doing this since…", "It happens when…", "My plan is to…"] },
  { id: "t15", en: "Explain a Bangladeshi festival to a foreign YouTuber.", bn: "একজন বিদেশি ইউটিউবের জন্য বাংলাদেশী উৎসব বুঝিয়ে বলুন।", level: "advanced", minutes: 3, hints: ["The most striking thing is…", "It symbolises…", "People gather to…"] },
  { id: "t16", en: "If you had one crore taka, how would you spend it?", bn: "এক কোটি টাকা পেলে কী করতেন?", level: "intermediate", minutes: 2, hints: ["If I had…, I would…", "Half of it would go to…", "The reason is…"] },
  { id: "t17", en: "Describe an online class that taught you something valuable.", bn: "এমন এক অনলাইন ক্লাসের কথা বলুন যা থেকে কিছু শিখেছেন।", level: "beginner", minutes: 2, hints: ["I found it through…", "The teacher explained…", "I applied it by…"] },
  { id: "t18", en: "Argue for or against: remote work is better for young employees.", bn: "যুক্তি দিন: রিমোট চাকরি তরুণ কর্মীদের জন্য ভালো কি না।", level: "advanced", minutes: 3, hints: ["My position is…", "Some people claim…, but…", "That said,…"] },
];

export type ShadowLine = { id: string; en: string; bn: string; focus: string; level: Topic["level"] };

export const SHADOW_LINES: ShadowLine[] = [
  { id: "s1", en: "I'd like to book a table for four people tonight.", bn: "আজ রাতে চার জনের জন্য একটা টেবিল বুক করতে চাই।", focus: "polite request", level: "beginner" },
  { id: "s2", en: "Could you please repeat that a little more slowly?", bn: "একটু ধীরে বলবেন কি?", focus: "asking again", level: "beginner" },
  { id: "s3", en: "The meeting has been pushed back to Thursday.", bn: "মিটিং বৃহস্পতিবারে ঠেলে দেওয়া হয়েছে।", focus: "phrasal verb", level: "intermediate" },
  { id: "s4", en: "I'm not really sure what you mean by that.", bn: "তার দ্বারা আপনি কী বোঝাচ্ছেন ঠিক বুঝতে পারছি না।", focus: "soft disagreement", level: "beginner" },
  { id: "s5", en: "Would you mind sending me the file again?", bn: "ফাইলটা আবার পাঠাতে পারবেন?", focus: "would you mind", level: "intermediate" },
  { id: "s6", en: "Prices have gone up again since last month.", bn: "গত মাসের পর থেকে দাম আবার বেড়ে গেছে।", focus: "present perfect", level: "intermediate" },
  { id: "s7", en: "If I had known, I would have come earlier.", bn: "জানলে আগেই আসতাম।", focus: "third conditional", level: "advanced" },
  { id: "s8", en: "That's not exactly how I would put it.", bn: "আমি ঠিক এইভাবে বলতাম না।", focus: "diplomacy", level: "advanced" },
  { id: "s9", en: "Sorry, I couldn't hear you — the line broke up.", bn: "দুঃখিত, লাইন কেটে গেছিলো।", focus: "phone English", level: "beginner" },
  { id: "s10", en: "Let me think about it and get back to you tomorrow.", bn: "ভেবে দেখি, কাল জানাবো।", focus: "buying time", level: "intermediate" },
  { id: "s11", en: "She's the one who handles supplier issues.", bn: "সরবরাহকারীর সমস্যাগুলো উনিই দেখেন।", focus: "at work", level: "intermediate" },
  { id: "s12", en: "I've been living in Dhaka for six years.", bn: "আমি ছয় বছর ধরে ঢাকায় আছি।", focus: "for vs since", level: "beginner" },
  { id: "s13", en: "It's much cheaper than eating out every day.", bn: "প্রতিদিন বাইরে খাওয়ার চেয়ে অনেক সস্তা।", focus: "comparatives", level: "beginner" },
  { id: "s14", en: "There's no way we can finish this by Friday.", bn: "শুক্রবারের মধ্যে শেষ করা সম্ভব না।", focus: "emphasis", level: "intermediate" },
  { id: "s15", en: "What I mean is that we need a clearer plan.", bn: "আমার মানে, আমাদের আরও পরিষ্কার পরিকল্পনা দরকার।", focus: "clarifying", level: "intermediate" },
  { id: "s16", en: "Had it not been for your help, I would have failed.", bn: "আপনার সাহায্য না থাকলে আমি ব্যর্থ হতাম।", focus: "inverted conditional", level: "advanced" },
  { id: "s17", en: "He asked me where I had parked the bike.", bn: "সে জিজ্ঞেস করলো বাইক কোথায় রেখেছি।", focus: "reported speech", level: "intermediate" },
  { id: "s18", en: "I'd rather take the earlier train tomorrow.", bn: "আগামীকাল আগের ট্রেনেই যেতে চাই।", focus: "would rather", level: "advanced" },
  { id: "s19", en: "Sorry for the late reply — I've been swamped.", bn: "দেরিতে উত্তর দেওয়ার জন্য দুঃখিত, খুব ব্যস্ত ছিলাম।", focus: "small talk", level: "beginner" },
  { id: "s20", en: "Could you walk me through the process once more?", bn: "প্রক্রিয়াটা একবার আরও বলে শোনাবেন কি?", focus: "workplace", level: "advanced" },
];

export type Card = { key: string; en: string; bn: string; example: string; sound: string };

export const VOCAB: Card[] = [
  { key: "v1", en: "commute", bn: "যাতায়াত (কাজে যাওয়া-আসা)", example: "My commute takes ninety minutes.", sound: "কামিউট" },
  { key: "v2", en: "affordable", bn: "সাশ্রয়ী, কেনার মতো", example: "Street food is affordable for students.", sound: "অ্যাফর্ডাবল" },
  { key: "v3", en: "deadline", bn: "শেষ সময়সীমা", example: "The deadline is Friday evening.", sound: "ডেডলাইন" },
  { key: "v4", en: "reliable", bn: "নির্ভরযোগ্য", example: "He's the most reliable person in the team.", sound: "রিলাইএবল" },
  { key: "v5", en: "figure out", bn: "বুঝে নেওয়া, সমাধান বের করা", example: "Let's figure out the cost first.", sound: "ফিগার আউট" },
  { key: "v6", en: "postpone", bn: "পরে ঠিক করা, স্থগিত", example: "They postponed the launch twice.", sound: "পোস্টপোন" },
  { key: "v7", en: "grateful", bn: "কৃতজ্ঞ", example: "I'm grateful for your support.", sound: "গ্রেটফুল" },
  { key: "v8", en: "overwhelmed", bn: "চাপে অচলা হয়ে যাওয়া", example: "I feel overwhelmed by the workload.", sound: "ওভারবেল্মড" },
  { key: "v9", en: "hesitate", bn: "দ্বিধা করা", example: "Don't hesitate to ask questions.", sound: "হেসিটেট" },
  { key: "v10", en: "improve", bn: "উন্নত করা", example: "I record myself to improve my speaking.", sound: "ইমপ্রুভ" },
  { key: "v11", en: "crowded", bn: "ঠাসা, ভিড়পূর্ণ", example: "The bus is always crowded at rush hour.", sound: "ক্রাউডিড" },
  { key: "v12", en: "sustainable", bn: "টেকসই", example: "We need a sustainable plan for the village.", sound: "সাসটেইনেবল" },
  { key: "v13", en: "clarify", bn: "স্পষ্ট করে বলা", example: "Could you clarify the last point?", sound: "ক্ল্যারিফাই" },
  { key: "v14", en: "handle", bn: "সামলানো, মোকাবিলা", example: "She handles customer complaints.", sound: "হ্যান্ডেল" },
  { key: "v15", en: "opportunity", bn: "সুযোগ", example: "This job is a great opportunity.", sound: "অপর্চুনিটি" },
  { key: "v16", en: "awkward", bn: "অস্বস্তিকর", example: "It was an awkward silence.", sound: "অকোয়ার্ড" },
  { key: "v17", en: "roughly", bn: "আনুমানিক", example: "Roughly two hundred people came.", sound: "রাফলি" },
  { key: "v18", en: "put off", bn: "মুলতুবি রাখা", example: "Don't put off your practice today.", sound: "পুট অফ" },
  { key: "v19", en: "confident", bn: "আত্মবিশ্বাসী", example: "You sound more confident now.", sound: "কনফিডেন্ট" },
  { key: "v20", en: "accustomed to", bn: "অভ্যস্ত", example: "I'm accustomed to waking up early.", sound: "অ্যাকাস্টমড টু" },
  { key: "v21", en: "compromise", bn: "রফা, সমঝোতা", example: "We compromised on the price.", sound: "কম্প্রোমাইজ" },
  { key: "v22", en: "insight", bn: "গভীর বোঝাপড়া", example: "Your video gave me real insight.", sound: "ইনসাইট" },
  { key: "v23", en: "follow up", bn: "পরবর্তীতে আবার যোগাযোগ", example: "I'll follow up by email tomorrow.", sound: "ফলো আপ" },
  { key: "v24", en: "thrilled", bn: "অত্যন্ত আনন্দিত", example: "I was thrilled to hear the result.", sound: "থ্রিল্ড" },
];

export type FalseFriend = { bangla: string; literal: string; natural: string; whyBn: string };

/** Bangla sentences people translate word-for-word, and what native speakers actually say */
export const FALSE_FRIENDS: FalseFriend[] = [
  { bangla: "আমি রাজি নই।", literal: "I am not agree.", natural: "I don't agree.", whyBn: "'agree' ক্রিয়া — am/agree একসাথে বসে না।" },
  { bangla: "আমার একটা গাড়ি আছে।", literal: "I am having a car.", natural: "I have a car.", whyBn: "মালিকানা বোঝালে 'have' continuous হয় না।" },
  { bangla: "সে আমার বন্ধু হয়।", literal: "He is my friend does.", natural: "He's my friend.", whyBn: "শেষে 'does' যোগ করার দরকার নেই।" },
  { bangla: "দুই বছর ধরে এখানে আছি।", literal: "I am here since two years.", natural: "I've been here for two years.", whyBn: "duration → for, এবং present perfect লাগে।" },
  { bangla: "আপনার ভালো নাম কী?", literal: "What is your good name?", natural: "What's your name?", whyBn: "'good name' বাংলার সরাসরি অনুবাদ।" },
  { bangla: "বৃষ্টি হচ্ছে।", literal: "Rain is falling.", natural: "It's raining.", whyBn: "আবহাওয়ায় subject হয় 'it'।" },
  { bangla: "খবরটা শুনলাম?", literal: "Heard the news?", natural: "Did you hear the news?", whyBn: "ইংরেজি প্রশ্নে subject + auxiliary দরকার।" },
  { bangla: "আমি তোমাকে কাল ফোন করবো।", literal: "I will call you tomorrow night.", natural: "I'll call you tomorrow evening.", whyBn: "night = ঘুমানোর সময়; বিকেল/সন্ধ্যা = evening।" },
  { bangla: "এটা কি ঠিক হবে?", literal: "Will it be correct?", natural: "Would that work?", whyBn: "কথ্য ইংরেজিতে 'Would that work?' বেশি স্বাভাবিক।" },
  { bangla: "আমি ইংরেজিতে একটু অস্বস্তি পাই।", literal: "I feel shy in English.", natural: "I get a bit nervous speaking English.", whyBn: "'shy' মানুষকে বোঝায়, পরিস্থিতি বোঝাতে nervous / self-conscious।" },
];

export type QuizQ = { q: string; options: string[]; answer: number; whyBn: string };
export type Lesson = {
  id: string;
  title: string;
  bnTitle: string;
  summaryBn: string;
  rules: string[];
  examples: { wrong: string; right: string; note: string }[];
  quiz: QuizQ[];
};

export const LESSONS: Lesson[] = [
  {
    id: "g1",
    title: "Articles: a / an / the / —",
    bnTitle: "Article: সবচেয়ে বেশি ভুল হওয়া জায়গা",
    summaryBn: "বাংলায় article নেই, তাই এটাই আমাদের নম্বর-ওয়ান ভুল। মনে রাখুন: প্রথমবার শুনলে a/an, পরে সেই নির্দিষ্ট বস্তু হলে the, আর general/uncountable হলে কিছু না।",
    rules: [
      " Singular countable noun কখনো bare থাকে না: I have a phone (✗ I have phone)",
      "প্রথমবার → a/an, পরিচিত/নির্দিষ্ট হলে → the",
      "অবসার সাথে a/an: She is a doctor.",
      "abstract / uncountable সাধারণ অর্থে article ছাড়া: I love music.",
    ],
    examples: [
      { wrong: "I went to market.", right: "I went to the market.", note: "market নির্দিষ্ট জায়গা, তাই the" },
      { wrong: "He is university student.", right: "He is a university student.", note: "'university' উচ্চারণে yu- দিয়ে শুরু, তাই a" },
      { wrong: "The pollution is increasing in Dhaka.", right: "Pollution is increasing in Dhaka.", note: "সাধারণ অর্থে uncountable noun এর আগে the নেই" },
    ],
    quiz: [
      { q: "Yesterday I bought ___ umbrella.", options: ["a", "an", "the", "—"], answer: 1, whyBn: "umbrella vowel sound দিয়ে শুরু → an" },
      { q: "___ sun rises in the east.", options: ["A", "An", "The", "—"], answer: 2, whyBn: "একটাই সূর্য — নির্দিষ্ট বস্তু, তাই The" },
      { q: "My sister wants to be ___ engineer.", options: ["a", "an", "the", "—"], answer: 1, whyBn: "engineer vowel sound → an engineer" },
      { q: "I don't like ___ broccoli.", options: ["a", "an", "the", "—"], answer: 3, whyBn: "সাধারণ পছন্দের কথা বললে uncountable noun article ছাড়া থাকে" },
      { q: "Can you pass me ___ salt?", options: ["a", "an", "the", "—"], answer: 2, whyBn: "টেবিলের সেই নির্দিষ্ট লবণ → the salt" },
    ],
  },
  {
    id: "g2",
    title: "Tenses that Bangladeshis mix up",
    bnTitle: "Past Simple বনাম Present Perfect",
    summaryBn: "সময় উল্লেখ থাকলে (yesterday, in 2019, last week) → Past Simple। সময় উল্লেখ নেই কিন্তু ফলাফল এখনো কাজ করছে → Present Perfect।",
    rules: [
      "I lost my passport. (কবে বললেন না — বর্তমানেও সমস্যা)",
      "I lost my passport last Monday. (সময় আছে → past simple)",
      "✗ I have seen him yesterday.  ✔ I saw him yesterday.",
      "since + বিন্দু (since 2020), for + সময়কাল (for 3 years)",
    ],
    examples: [
      { wrong: "I have finished my work just now.", right: "I finished my work just now.", note: "'just now' নির্দিষ্ট অতীত সময়" },
      { wrong: "She is living here since five years.", right: "She has been living here for five years.", note: "চলমান অতীত→বর্তমান: perfect continuous + for" },
      { wrong: "Did you ever eat fuchka?", right: "Have you ever eaten fuchka?", note: "জীবনের অভিজ্ঞতা জিজ্ঞেস করতে present perfect" },
    ],
    quiz: [
      { q: "I ___ my phone on the bus this morning.", options: ["have lost", "lost", "lose", "was losing"], answer: 1, whyBn: "'this morning' নির্দিষ্ট অতীত → lost" },
      { q: "She ___ never ___ sushi.", options: ["has … eaten", "did … ate", "is … eating", "have … eaten"], answer: 0, whyBn: "experience + never → has eaten" },
      { q: "We ___ for this bus for 40 minutes.", options: ["wait", "are waiting", "have been waiting", "waited"], answer: 2, whyBn: "অতীতে শুরু, এখনো চলছে → perfect continuous" },
      { q: "___ you go to Jamuna Bridge last month?", options: ["Did", "Have", "Do", "Were"], answer: 0, whyBn: "last month থাকলে Did" },
      { q: "By the time we reached, the movie ___.", options: ["already started", "had already started", "has already started", "was already start"], answer: 1, whyBn: "অতীতের আগে ঘটা কাজ → past perfect" },
    ],
  },
  {
    id: "g3",
    title: "Prepositions after verbs",
    bnTitle: "ক্রিয়ার পর preposition",
    summaryBn: "বাংলা postposition এর সাথে ইংরেজি preposition মেলে না। এই কয়েকটা মুখস্থ রাখুন।",
    rules: [
      "listen TO, wait FOR, depend ON, agree WITH (a person) / agree TO (a plan)",
      "discuss ✗about, explain ✗me → explain TO me",
      "arrive IN a city / AT a place, reach ✗to",
      "good AT, interested IN, afraid OF, married TO",
    ],
    examples: [
      { wrong: "He is good in cricket.", right: "He is good at cricket.", note: "skill → good at" },
      { wrong: "I am waiting you.", right: "I'm waiting for you.", note: "wait for someone" },
      { wrong: "We discussed about the plan.", right: "We discussed the plan.", note: "discuss তে about নেই" },
    ],
    quiz: [
      { q: "I'm interested ___ learning English.", options: ["on", "in", "for", "at"], answer: 1, whyBn: "interested always takes IN" },
      { q: "She explained ___ the problem.", options: ["me", "to me", "for me", "with me"], answer: 1, whyBn: "explain something TO someone" },
      { q: "We arrived ___ Dhaka late at night.", options: ["to", "in", "at", "on"], answer: 1, whyBn: "বড় জায়গা (শহর/দেশ) হলে arrive in; ছোট নির্দিষ্ট জায়গায় arrive at" },
      { q: "He depends ___ his parents.", options: ["to", "for", "on", "at"], answer: 2, whyBn: "depend ON / rely ON" },
      { q: "Please listen ___ me carefully.", options: ["to", "for", "at", "—"], answer: 0, whyBn: "listen TO someone" },
    ],
  },
  {
    id: "g4",
    title: "Sounding polite (not rude)",
    bnTitle: "ভদ্রভাবে ইংরেজি বলা",
    summaryBn: "সরাসরি অনুবাদ অনেক রূক্ষ শোনাতে পারে। modal + softener ব্যবহার করুন।",
    rules: [
      "Give me → Could you give me, please?",
      "I want → I'd like",
      "No → I'm afraid not / That doesn't work for me",
      "You are wrong → I see it a bit differently",
    ],
    examples: [
      { wrong: "Open the door.", right: "Could you open the door, please?", note: "order না দিয়ে request" },
      { wrong: "I want a discount.", right: "Would you be able to offer a small discount?", note: "business tone" },
      { wrong: "Come early tomorrow.", right: "Would you mind coming in a bit earlier tomorrow?", note: "would you mind + -ing" },
    ],
    quiz: [
      { q: "আপনার বসকে file পাঠাতে বলবেন কীভাবে?", options: ["Send me the file.", "Send the file to me now.", "Could you send me the file, please?", "I want the file."], answer: 2, whyBn: "modal request সবচেয়ে appropriate" },
      { q: "অপাশিত উত্তর: 'I want to leave early.'", options: ["I want leave.", "I'd like to leave a bit early, if that's okay.", "Let me go.", "I am going."], answer: 1, whyBn: "I'd like + checking permission = polite" },
      { q: "বন্ধুর পরিকল্পনায় দ্বিমত:", options: ["You are wrong.", "No no, bad idea.", "I see it a bit differently.", "It is incorrect."], answer: 2, whyBn: "soft disagreement" },
      { q: "Wait করতে বলতে:", options: ["Wait.", "Could you hold on for a second?", "Stay there now.", "You wait."], answer: 1, whyBn: "phone/workplace এ 'hold on a second' স্বাভাবিক" },
      { q: "ভুল বোঝাবুঝি ঠিক করতে:", options: ["You don't understand.", "Sorry, let me rephrase that.", "My English is bad.", "Listen again."], answer: 1, whyBn: "নিজের দিকে নিয়ে rephrase করা বেশি mature" },
    ],
  },
  {
    id: "g5",
    title: "Filler words & flow",
    bnTitle: "um/you know কমানোর কৌশল",
    summaryBn: "ভুল করলে কথা থেমে যায় — সমাধান: chunk মুখস্থ রাখা।",
    rules: [
      "চুপ থাকা = শক্তি; 'um' = দুর্বলতা। এক সেকেন্ড থামুন।",
      "Time buying chunks: 'That's a good question…', 'Let me think for a second…'",
      "প্রতিটা উত্তর 3 ভাগে: answer → reason → example",
      "নিজের voice record করে শুনলে filler ৫০% কমে যায়",
    ],
    examples: [
      { wrong: "I… um… I like… you know… cricket, um.", right: "I like cricket — mostly because my brother and I play it every Friday.", note: "answer + reason" },
      { wrong: "Yeah, no, I think… maybe…", right: "I'd say yes, mainly because…", note: "clear stance" },
    ],
    quiz: [
      { q: "Filler বোঝায়-", options: ["confidence", "you are searching for words", "advanced English", "good accent"], answer: 1, whyBn: "শ্রোতা বুঝতে পারে আপনি আটকে গেছেন" },
      { q: "ভাবতে সময় নিতে সবচেয়ে ভালো chunk:", options: ["um… um…", "Let me think about that for a second.", "Sorry my English weak.", "What? Repeat."], answer: 1, whyBn: "natural + polite time-buyer" },
      { q: "ARE formula মানে:", options: ["Ask, Reply, End", "Answer, Reason, Example", "Audio, Read, Edit", "Always Review Everything"], answer: 1, whyBn: "প্রতিটা উত্তরের কাঠামো এটাই" },
      { q: "লম্বা answer বানাতে কী যোগ করবেন?", options: ["আরও grammar", "একটা ব্যক্তিগত উদাহরণ", "choppy words", "Bangla words"], answer: 1, whyBn: "example শুনলে কথা স্বাভাবিকভাবে বাড়ে" },
      { q: "Filler কমানোর প্র্যাকটিস কৌশল:", options: ["জোরে পড়া", "একই উত্তর ৩ বার টানা বলা", "চুপ থাকা", "Lecture দেওয়া"], answer: 1, whyBn: "repetition তে muscle memory তৈরি হয়" },
    ],
  },
];

export type ScenarioTurn = { partner: string; partnerBn: string; expect: string[]; model: string };
export type Scenario = { id: string; title: string; bnTitle: string; emoji: string; turns: ScenarioTurn[] };

export const SCENARIOS: Scenario[] = [
  {
    id: "r1",
    title: "At a Dhaka restaurant",
    bnTitle: "রেস্টুরেন্টে অর্ডার ও সমস্যা সমাধান",
    emoji: "🍛",
    turns: [
      { partner: "Hi! Table for how many today?", partnerBn: "হ্যালো! কত জনের টেবিল?", expect: ["table for", "two", "three", "one", "people"], model: "A table for two, please. We'll wait outside if it's busy." },
      { partner: "Sure. What can I get you to drink?", partnerBn: "পানীয় কী নেবেন?", expect: ["I'll have", "can I get", "water", "soda", "lassi"], model: "I'll have a glass of lassi, please." },
      { partner: "Great. Our special today is kacchi biryani — it's a bit spicy.", partnerBn: "আজকের স্পেশাল কাচ্চি বিরিয়ানি, একটু ঝাল।", expect: ["how spicy", "not too", "okay", "bring", "with"], model: "How spicy is it? If it's too hot, could you make it milder?" },
      { partner: "Sorry, we're out of lassi. Mint lemonade instead?", partnerBn: "লাচ্ছি নেই, বদলে পুদিনা লেমনেড?", expect: ["that's fine", "sure", "no thanks", "then", "give me"], model: "That's fine — I'll try the mint lemonade." },
      { partner: "Your order will take about twenty minutes.", partnerBn: "অর্ডার পেতে কুড়ি মিনিট লাগবে।", expect: ["that's okay", "no problem", "could you", "faster", "we're not"], model: "No problem. We're not in a rush." },
      { partner: "How was everything?", partnerBn: "সব কেমন ছিল?", expect: ["delicious", "really nice", "a bit", "but", "thank"], model: "Everything was delicious, though the rice could be a little less oily." },
    ],
  },
  {
    id: "r2",
    title: "Job interview at a software company",
    bnTitle: "সফটওয়্যার কোম্পানিতে ইন্টারভিউ",
    emoji: "💼",
    turns: [
      { partner: "Thanks for coming. Tell me a little about yourself.", partnerBn: "নিজের সম্পর্কে বলুন।", expect: ["I'm", "graduated", "worked", "experience", "currently"], model: "I'm a fresh business graduate; I handled customer support for a year and now I'm learning product analytics." },
      { partner: "Why do you want this role?", partnerBn: "কেন এই চাকরিটা চান?", expect: ["because", "opportunity", "match", "interest", "learn"], model: "This role matches my experience with data, and I want to learn from a team that ships fast." },
      { partner: "What's your biggest weakness?", partnerBn: "আপনার সবচেয়ে বড় দুর্বলতা?", expect: ["sometimes", "I'm working", "public speaking", "delegating", "over"], model: "I avoid public speaking, so I've joined a local club to get comfortable on stage." },
      { partner: "Describe a conflict with a teammate and how you solved it.", partnerBn: "সহকর্মীর সাথে দ্বন্দ্ব ও সমাধান বলুন।", expect: ["we disagreed", "I listened", "compromise", "result", "deadline"], model: "We disagreed on a deadline; I asked for his reasoning, and we agreed to deliver a smaller version first." },
      { partner: "What salary are you expecting?", partnerBn: "কত বেতন আশা করছেন?", expect: ["negotiable", "range", "according", "market", "bdt"], model: "I'm looking at a range of 40 to 45 thousand, but I'm flexible depending on the responsibilities." },
      { partner: "Do you have any questions for us?", partnerBn: "আমাদের কাছে কিছু জানার আছে?", expect: ["what does", "team", "how", "success", "when"], model: "Yes — what does success look like in the first ninety days?" },
    ],
  },
  {
    id: "r3",
    title: "Doctor appointment",
    bnTitle: "ডাক্তারের কাছে সমস্যা বলা",
    emoji: "🩺",
    turns: [
      { partner: "So, what brings you in today?", partnerBn: "কী সমস্যায় এসেছেন?", expect: ["I've been", "fever", "cough", "since", "pain"], model: "I've had a fever and a dry cough since Sunday." },
      { partner: "On a scale of one to ten, how bad is it?", partnerBn: "১ থেকে ১০ কত কষ্ট?", expect: ["about", "seven", "it's", "worse", "night"], model: "About six — it gets worse at night." },
      { partner: "Any allergy or regular medicine?", partnerBn: "অ্যালার্জি বা নিয়মিত ঔষধ?", expect: ["no", "yes", "I take", "allergic to", "none"], model: "No allergies. I take one blood-pressure tablet every morning." },
      { partner: "I'm prescribing an antibiotic. Take it after meals.", partnerBn: "অ্যান্টিবায়োটিক, খাওয়ার পর খেতে হবে।", expect: ["how many", "times", "for", "side", "should"], model: "How many times a day, and for how many days?" },
      { partner: "Rest, drink warm water, and come back if the fever crosses 103.", partnerBn: "বিশ্রাম করুন, ১০৩ ছাড়লে আসুন।", expect: ["thank", "I'll", "clear", "got it", "should I"], model: "Got it. Should I avoid going to work for a few days?" },
    ],
  },
  {
    id: "r4",
    title: "Phone call with a courier (wrong delivery)",
    bnTitle: "কুরিয়ারের সাথে ভুল ডেলিভারির ফোন কল",
    emoji: "📦",
    turns: [
      { partner: "Courier service, how can I help?", partnerBn: "কীভাবে সাহায্য করতে পারি?", expect: ["I received", "wrong", "my order", "tracking", "issue"], model: "Hi, I received the wrong box for order ID 4471." },
      { partner: "Sorry to hear that. Can I have the tracking number?", partnerBn: "ট্র্যাকিং নম্বরটা দিন।", expect: ["it's", "sure", "let me", "the number", "hold"], model: "Sure — it's BD-88-4471-CXR. One second, let me check my SMS." },
      { partner: "Thanks. Was the box opened or damaged?", partnerBn: "বক্স কি খোলা/নষ্ট ছিল?", expect: ["sealed", "torn", "opened", "no", "yes"], model: "It was sealed, but the corner was torn." },
      { partner: "We can arrange a pickup today between 4 and 6.", partnerBn: "আজ ৪টা থেকে ৬টার মধ্যে নিতে পারবো।", expect: ["that works", "can you", "tomorrow", "I'll be", "please"], model: "Four works, but could you make it after five? I'm at office till then." },
      { partner: "Noted. Refund takes three working days.", partnerBn: "রিফান্ড তিন দিনে।", expect: ["thank", "how will", "bkash", "receive", "okay"], model: "Okay — will the refund go to my bKash or my card?" },
    ],
  },
  {
    id: "r5",
    title: "Small talk with a foreign colleague",
    bnTitle: "বিদেশি সহকর্মীর সাথে ছোটখাটো আড্ডা",
    emoji: "☕",
    turns: [
      { partner: "First week here — everything is so loud and colourful!", partnerBn: "প্রথম সপ্তাহ, সব খুব জটিল ও রঙিন!", expect: ["welcome", "Dhaka is", "you should", "get used", "let me"], model: "Welcome! Dhaka is intense for a week, then it starts to feel like home." },
      { partner: "Where do people usually eat around the office?", partnerBn: "অফিসের আশপাশে মানুষ কোথায় খায়?", expect: ["there's", "try", "near", "I recommend", "cheap"], model: "There's a tiny place behind the gate — try their beef haleem, it's cheap and famous." },
      { partner: "Do you have time for coffee this afternoon?", partnerBn: "বিকেলে কফির জন্য সময় আছে?", expect: ["sure", "I can't", "how about", "let's", "after"], model: "Sure, I'm free after three. Shall I book the corner table?" },
      { partner: "What does 'adda' mean, exactly?", partnerBn: "'আড্ডা' মানে কী?", expect: ["it means", "long", "chat", "friends", "no"], model: "It's a long, relaxed chat with friends — usually with tea and no ending time." },
      { partner: "Any tip for surviving winter here?", partnerBn: "শীত কাটানোর টিপস?", expect: ["bring", "layers", "the fog", "early", "you'll"], model: "Bring one warm jacket; the fog makes mornings feel colder than the temperature says." },
    ],
  },
];

export const CALL_TOPICS = [
  { en: "Weekend plans", bn: "সপ্তাহান্তের পরিকল্পনা" },
  { en: "Best series you watched recently", bn: "সদ্য দেখা সেরা সিরিজ" },
  { en: "Why learning English is hard in BD", bn: "বাংলাদেশে ইংরেজি শোখা কঠিন কেন" },
  { en: "Your first job story", bn: "প্রথম চাকরির গল্প" },
  { en: "Traffic in Dhaka — solutions?", bn: "ঢাকার জ্যাম — সমাধান?" },
  { en: "Village vs city life", bn: "গ্রাম বনাম শহরের জীবন" },
  { en: "A skill you want to learn", bn: "যে দক্ষতাটা শিখতে চান" },
  { en: "Food you could eat forever", bn: "যে খাবার চিরকাল খেতে পারবেন" },
  { en: "Describing your daily routine", bn: "নিত্যদিনের রুটিন বর্ণনা" },
  { en: "Money vs. passion", bn: "টাকা নাকি আবেগ" },
  { en: "A place you want to travel", bn: "যেখানে যেতে চান" },
  { en: "Online learning vs classroom", bn: "অনলাইন বনাম ক্লাসরুম" },
];

export const SENTENCE_PACKS = [
  { from: "আমি ঠিক বুঝি নি।", to: "I didn't quite catch that." },
  { from: "একটু ধীরে বলবেন?", to: "Could you slow down a little, please?" },
  { from: "আপনি কি বলতে চাচ্ছেন…", to: "Do you mean that…?" },
  { from: "এক সেকেন্ড, নোট নিচ্ছি।", to: "One second — let me note that down." },
  { from: "এটা নিয়ে আমি পরে জানাবো।", to: "I'll get back to you on that." },
  { from: "আমার ধারণা এটা সম্ভব না।", to: "I don't think that's possible." },
  { from: "ধন্যবাদ, খুব সাহায্য হলো।", to: "Thanks, that really helps." },
  { from: "আমি একমত, তবে…", to: "I agree, but… " },
];
