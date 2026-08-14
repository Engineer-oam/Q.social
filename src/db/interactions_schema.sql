CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "targetId" UUID NOT NULL,
  "userId" UUID REFERENCES profiles(id) NOT NULL,
  "createdAt" BIGINT NOT NULL,
  UNIQUE("targetId", "userId")
);

CREATE TABLE saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "targetId" UUID NOT NULL,
  "userId" UUID REFERENCES profiles(id) NOT NULL,
  "createdAt" BIGINT NOT NULL,
  UNIQUE("targetId", "userId")
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "postId" UUID REFERENCES posts(id) NOT NULL,
  "userId" UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "likesCount" INT DEFAULT 0
);

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "recipientId" UUID REFERENCES profiles(id) NOT NULL,
  "actorId" UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  "targetId" UUID,
  "createdAt" BIGINT NOT NULL,
  read BOOLEAN DEFAULT false
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = "userId");

CREATE POLICY "Public saves" ON saves FOR SELECT USING (true);
CREATE POLICY "Users can insert own saves" ON saves FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can delete own saves" ON saves FOR DELETE USING (auth.uid() = "userId");

CREATE POLICY "Public comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = "userId");

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = "recipientId");
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = "recipientId");
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = "recipientId");

CREATE OR REPLACE FUNCTION increment_post_count(post_id UUID, col_name TEXT, amount INT)
RETURNS void AS $$
BEGIN
  IF col_name = 'likesCount' THEN
    UPDATE posts SET "likesCount" = "likesCount" + amount WHERE id = post_id;
  ELSIF col_name = 'commentsCount' THEN
    UPDATE posts SET "commentsCount" = "commentsCount" + amount WHERE id = post_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
