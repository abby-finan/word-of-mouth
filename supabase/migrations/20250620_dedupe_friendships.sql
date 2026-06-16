-- Remove duplicate friendships between the same two users (non-breaking)
-- Keeps the oldest row for each pair. Safe to re-run.

DELETE FROM public.friendships f1
USING public.friendships f2
WHERE f1.id > f2.id
  AND (
    (f1.requester_id = f2.requester_id AND f1.addressee_id = f2.addressee_id)
    OR (f1.requester_id = f2.addressee_id AND f1.addressee_id = f2.requester_id)
  );
