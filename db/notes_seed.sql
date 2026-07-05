-- Curated starter notes for the "note from a stranger" feature — status is
-- already 'approved' so the pool isn't empty on day one, before any real
-- user submissions clear manual review. Delivery is fully random (not
-- matched to the recipient's mood — see NOTES_FEATURE.md), so every line
-- here is deliberately written to work regardless of how the reader is
-- actually feeling: no "I know today was rough" (wrong if they're having a
-- great day) and no "isn't life great" (wrong if they're not).
--
-- Safe to re-run — the WHERE NOT EXISTS guard skips any line already seeded.

INSERT INTO notes (text, source, status, approved_at)
SELECT v.text, 'internal', 'approved', now()
FROM (VALUES
  ('You checked in today — that''s a small act of self-care most people skip.'),
  ('Someone, somewhere, is glad you''re here today.'),
  ('Whatever today looked like for you, showing up counts.'),
  ('You''re not the only one figuring things out one day at a time.'),
  ('A stranger just wanted you to know: you''re doing better than you think.'),
  ('No matter what number you picked today, it doesn''t define your whole story.'),
  ('Sending a small bit of good energy your way, from someone you''ll never meet.'),
  ('Today is one page. There are a lot more left to write.'),
  ('You matter more than today''s mood lets on.'),
  ('Just a reminder: it''s okay to have an ordinary day. Not everything needs a highlight reel.'),
  ('Whoever''s reading this — take a breath. You''re allowed one.'),
  ('Someone out there believes today will get a little easier for you.'),
  ('You don''t have to have it all figured out today. Or tomorrow. That''s fine.'),
  ('A tiny note from a stranger: you''re not invisible. Someone noticed you today.'),
  ('However you''re feeling right now is valid — no explanation needed.'),
  ('This is a small hello from someone else checking in on their own mood too.'),
  ('You''re part of a lot of people quietly doing their best today. Same here.'),
  ('Hope today treats you kindly, even in small ways.'),
  ('If no one''s told you yet — you''re doing okay.'),
  ('One vote, one moment, one small piece of a much bigger world. You''re in it.'),
  ('Take today one hour at a time if that''s what it needs.'),
  ('However today went, tomorrow gets a fresh tally.'),
  ('You''re allowed to feel exactly how you feel — good, bad, or nothing much.'),
  ('Someone across the world just checked in too. You''re less alone than it feels.')
) AS v(text)
WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.text = v.text);
