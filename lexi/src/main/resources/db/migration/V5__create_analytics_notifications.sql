-- ============================================================
-- V5: Analytics, Progress, Notifications
-- ============================================================

CREATE TABLE user_progress (
    id                    CHAR(36)     NOT NULL PRIMARY KEY,
    user_id               CHAR(36)     NOT NULL UNIQUE,
    total_entries         INT          NOT NULL DEFAULT 0,
    total_words_written   INT          NOT NULL DEFAULT 0,
    avg_grammar_accuracy  DECIMAL(5,2),
    avg_fluency_score     DECIMAL(5,2),
    avg_lexical_diversity DECIMAL(5,2),
    estimated_ielts_band  DECIMAL(3,1),
    estimated_cefr        VARCHAR(10),
    vocabulary_mastered   INT          NOT NULL DEFAULT 0,
    current_streak        INT          NOT NULL DEFAULT 0,
    longest_streak        INT          NOT NULL DEFAULT 0,
    last_updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE writing_analytics (
    id                   BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id              CHAR(36)    NOT NULL,
    writing_entry_id     CHAR(36)    NOT NULL,
    grammar_accuracy     DECIMAL(5,2),
    fluency_score        DECIMAL(5,2),
    lexical_diversity    DECIMAL(5,2),
    naturalness_score    DECIMAL(5,2),
    estimated_ielts_band DECIMAL(3,1),
    sentence_count       INT,
    avg_sentence_length  DECIMAL(5,2),
    word_count           INT,
    recorded_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_analytics_user  FOREIGN KEY (user_id)          REFERENCES users(id),
    CONSTRAINT fk_analytics_entry FOREIGN KEY (writing_entry_id) REFERENCES writing_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_analytics_user  ON writing_analytics(user_id, recorded_at);
CREATE INDEX idx_analytics_entry ON writing_analytics(writing_entry_id);

CREATE TABLE notifications (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    user_id    CHAR(36)     NOT NULL,
    type       VARCHAR(80)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    metadata   JSON,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created     ON notifications(user_id, created_at);
