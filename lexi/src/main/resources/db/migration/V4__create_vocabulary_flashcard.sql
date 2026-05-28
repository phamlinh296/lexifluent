-- ============================================================
-- V4: Vocabulary, Collocations, Flashcards, Review
-- ============================================================

CREATE TABLE vocabulary_items (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    user_id          CHAR(36)     NOT NULL,
    writing_entry_id CHAR(36),
    word             VARCHAR(200) NOT NULL,
    definition       TEXT,
    example_sentence TEXT,
    part_of_speech   VARCHAR(30),
    cefr_level       VARCHAR(10),
    is_mastered      TINYINT(1)   NOT NULL DEFAULT 0,
    encounter_count  INT          NOT NULL DEFAULT 1,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_vocab_user_word (user_id, word),
    CONSTRAINT fk_vocab_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_vocab_mastered ON vocabulary_items(user_id, is_mastered);
CREATE INDEX idx_vocab_cefr     ON vocabulary_items(cefr_level);

CREATE TABLE collocations (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    vocabulary_id CHAR(36)     NOT NULL,
    collocation   VARCHAR(300) NOT NULL,
    example       TEXT,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_colloc_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabulary_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_colloc_vocab ON collocations(vocabulary_id);

CREATE TABLE recurring_mistakes (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    user_id          CHAR(36)     NOT NULL,
    mistake_type     VARCHAR(100) NOT NULL,
    description      TEXT,
    example          TEXT,
    occurrence_count INT          NOT NULL DEFAULT 1,
    last_seen_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_mistake_user_type (user_id, mistake_type),
    CONSTRAINT fk_mistake_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_mistake_count ON recurring_mistakes(user_id, occurrence_count);

CREATE TABLE flashcards (
    id            CHAR(36)    NOT NULL PRIMARY KEY,
    user_id       CHAR(36)    NOT NULL,
    vocabulary_id CHAR(36),
    front         TEXT        NOT NULL,
    back          TEXT        NOT NULL,
    hint          TEXT,
    source        VARCHAR(50) NOT NULL DEFAULT 'AUTO',
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at    DATETIME(6),
    CONSTRAINT fk_flashcard_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_flashcard_user ON flashcards(user_id);

CREATE TABLE review_histories (
    id             BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    flashcard_id   CHAR(36)    NOT NULL,
    user_id        CHAR(36)    NOT NULL,
    ease_factor    DECIMAL(4,2) NOT NULL DEFAULT 2.50,
    interval_days  INT          NOT NULL DEFAULT 1,
    repetitions    INT          NOT NULL DEFAULT 0,
    quality        INT,
    next_review_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_review_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards(id),
    CONSTRAINT fk_review_user      FOREIGN KEY (user_id)      REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_review_user_next ON review_histories(user_id, next_review_at);
CREATE INDEX idx_review_flashcard ON review_histories(flashcard_id);
