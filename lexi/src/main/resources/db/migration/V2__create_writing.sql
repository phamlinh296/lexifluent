-- ============================================================
-- V2: Writing Entries & Revisions
-- ============================================================

CREATE TABLE writing_entries (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    user_id          CHAR(36)     NOT NULL,
    mode             VARCHAR(30)  NOT NULL DEFAULT 'DAILY_ENGLISH',
    correction_style VARCHAR(30)  NOT NULL DEFAULT 'GRAMMAR_CORRECTION',
    title            VARCHAR(300),
    original_text    MEDIUMTEXT   NOT NULL,
    word_count       INT          NOT NULL DEFAULT 0,
    status           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    topic_prompt     TEXT,
    submitted_at     DATETIME(6),
    processed_at     DATETIME(6),
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    deleted_at       DATETIME(6),
    CONSTRAINT fk_entry_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_writing_user_status ON writing_entries(user_id, status);
CREATE INDEX idx_writing_user_mode   ON writing_entries(user_id, mode);
CREATE INDEX idx_writing_created     ON writing_entries(user_id, created_at);
CREATE INDEX idx_writing_status      ON writing_entries(status);

CREATE TABLE writing_revisions (
    id               CHAR(36)    NOT NULL PRIMARY KEY,
    writing_entry_id CHAR(36)    NOT NULL,
    revision_number  INT         NOT NULL DEFAULT 1,
    revised_text     MEDIUMTEXT  NOT NULL,
    word_count       INT         NOT NULL DEFAULT 0,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_revision (writing_entry_id, revision_number),
    CONSTRAINT fk_revision_entry FOREIGN KEY (writing_entry_id) REFERENCES writing_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_revision_entry ON writing_revisions(writing_entry_id);
