-- ============================================================
-- V9: Vocabulary topic tags + Flashcard groups + Favorites
-- NOTE: Assumes V6 entity-managed columns already exist via ddl-auto.
--       Run V6 manually before this in production if needed.
-- ============================================================

-- 1. Topic classification for vocabulary
ALTER TABLE vocabulary_items
    ADD COLUMN topic_tag VARCHAR(50) NULL;

CREATE INDEX idx_vocab_topic ON vocabulary_items(user_id, topic_tag);

-- 2. Favorite flag for flashcards
ALTER TABLE flashcards
    ADD COLUMN is_favorite TINYINT(1) NOT NULL DEFAULT 0;

CREATE INDEX idx_flashcard_favorite ON flashcards(user_id, is_favorite);

-- 3. User-created flashcard groups (folders)
CREATE TABLE flashcard_groups (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    user_id    CHAR(36)     NOT NULL,
    name       VARCHAR(100) NOT NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at DATETIME(6),
    CONSTRAINT fk_fg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fg_user ON flashcard_groups(user_id);

-- 4. Many-to-many: flashcard ↔ group
CREATE TABLE flashcard_group_items (
    flashcard_id CHAR(36) NOT NULL,
    group_id     CHAR(36) NOT NULL,
    PRIMARY KEY (flashcard_id, group_id),
    CONSTRAINT fk_fgi_card  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
    CONSTRAINT fk_fgi_group FOREIGN KEY (group_id)     REFERENCES flashcard_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
