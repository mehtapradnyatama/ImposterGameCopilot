-- Add UPDATE policy for votes table to allow users to change their votes

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

-- Add DELETE policy so users can delete their votes (alternative method)
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = voter_id);
