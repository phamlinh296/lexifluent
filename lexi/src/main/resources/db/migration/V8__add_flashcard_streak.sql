-- V8: Add flashcard streak tracking to user_progress
ALTER TABLE user_progress
    ADD COLUMN flashcard_streak    INT  NOT NULL DEFAULT 0,
    ADD COLUMN last_flashcard_date DATE NULL;
