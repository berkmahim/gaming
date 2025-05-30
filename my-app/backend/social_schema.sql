-- User Follows table
CREATE TABLE user_follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_cannot_follow_self CHECK (follower_id <> following_id)
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- e.g., "review", "list", "game_log_entry", "user_profile_activity"
    target_id INTEGER NOT NULL, -- ID of the review, list, game_log_entry, etc.
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at timestamp for comments table
-- Assumes the function update_updated_at_column() already exists from schema.sql
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);


-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User receiving the notification
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- User who triggered the notification (e.g., new follower, commenter)
                                                              -- Can be NULL if system-generated or actor is deleted.
    notification_type VARCHAR(50) NOT NULL, -- e.g., "new_follower", "new_comment_on_review", "reply_to_comment"
    target_type VARCHAR(50), -- e.g., "user_profile", "review", "comment", "game_log" (the item related to notification)
    target_id INTEGER,       -- ID of the target item
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);

-- Example Enum types (optional, could use VARCHARs as above)
-- CREATE TYPE notification_type_enum AS ENUM ('new_follower', 'new_comment', 'reply_comment', 'game_added_to_list', 'status_update');
-- CREATE TYPE target_type_enum AS ENUM ('user', 'review', 'list', 'comment', 'game_log');
-- Then use these types in the table definitions if preferred over VARCHAR.
-- Example: notification_type notification_type_enum NOT NULL,
-- Example: target_type target_type_enum,
