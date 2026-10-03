import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 40 }).notNull(),
  level: varchar("level", { length: 16 }).notNull().default("beginner"), // beginner | intermediate | advanced
  goalMinutes: integer("goal_minutes").notNull().default(20),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastPracticeDay: varchar("last_practice_day", { length: 10 }),
  nativeLanguage: varchar("native_language", { length: 16 }).notNull().default("Bangla"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(), // speak | shadow | vocab | grammar | roleplay | call
  score: integer("score").notNull().default(0),
  durationSec: integer("duration_sec").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Spaced repetition state per flashcard, per user */
export const cardProgress = pgTable("card_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cardKey: varchar("card_key", { length: 48 }).notNull(),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  ease: integer("ease").notNull().default(250),
  intervalDays: integer("interval_days").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Voice practice rooms: 1-1 matching between two learners */
export const rooms = pgTable("rooms", {
  id: varchar("id", { length: 8 }).primaryKey(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).notNull().default("waiting"), // waiting | active | ended
  topic: text("topic"),
  level: varchar("level", { length: 16 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

/** WebRTC signalling relay (SDP offers / answers / ICE candidates / chat lines) */
export const signals = pgTable("signals", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  roomId: varchar("room_id", { length: 8 })
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  fromId: uuid("from_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull(), // offer | answer | ice | chat | end
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const callRatings = pgTable("call_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: varchar("room_id", { length: 8 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").notNull(),
  stars: integer("stars").notNull().default(5),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  english: text("english").notNull(),
  bangla: text("bangla"),
  tag: varchar("tag", { length: 24 }).notNull().default("phrase"),
  mastered: boolean("mastered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
