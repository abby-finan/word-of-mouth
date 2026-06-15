-- Allow users to see profiles of people who sent them a pending friend request.
-- Without this, the Friends page join returns requester: null and crashes the UI.

CREATE POLICY "Users can view pending request sender profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT requester_id
      FROM public.friendships
      WHERE addressee_id = auth.uid()
        AND status = 'pending'
    )
  );

-- Allow requesters to see addressee profile for outgoing pending requests.
CREATE POLICY "Users can view pending request recipient profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT addressee_id
      FROM public.friendships
      WHERE requester_id = auth.uid()
        AND status = 'pending'
    )
  );
