-- ============================================================
-- V3: AI Requests, Feedbacks, Prompts, Usage
-- ============================================================

CREATE TABLE prompt_templates (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    mode             VARCHAR(30),
    correction_style VARCHAR(30),
    version          INT          NOT NULL DEFAULT 1,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    system_prompt    MEDIUMTEXT   NOT NULL,
    user_prompt      MEDIUMTEXT   NOT NULL,
    variables        JSON,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_prompt_name_version (name, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prompt_active ON prompt_templates(mode, correction_style, is_active);

CREATE TABLE ai_requests (
    id                 CHAR(36)    NOT NULL PRIMARY KEY,
    user_id            CHAR(36)    NOT NULL,
    writing_entry_id   CHAR(36),
    prompt_template_id CHAR(36),
    provider           VARCHAR(20) NOT NULL,
    model              VARCHAR(80) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    prompt_tokens      INT,
    completion_tokens  INT,
    total_tokens       INT,
    latency_ms         INT,
    retry_count        INT         NOT NULL DEFAULT 0,
    error_message      TEXT,
    raw_response       JSON,
    created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_aireq_user  FOREIGN KEY (user_id)          REFERENCES users(id),
    CONSTRAINT fk_aireq_entry FOREIGN KEY (writing_entry_id) REFERENCES writing_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ai_req_user    ON ai_requests(user_id);
CREATE INDEX idx_ai_req_entry   ON ai_requests(writing_entry_id);
CREATE INDEX idx_ai_req_status  ON ai_requests(status);
CREATE INDEX idx_ai_req_created ON ai_requests(created_at);

CREATE TABLE ai_feedbacks (
    id                     CHAR(36)    NOT NULL PRIMARY KEY,
    writing_entry_id       CHAR(36)    NOT NULL,
    ai_request_id          CHAR(36)    NOT NULL,
    schema_version         VARCHAR(10) NOT NULL DEFAULT '1.0',
    corrected_text         MEDIUMTEXT,
    corrections            JSON,
    vocabulary_suggestions JSON,
    rewritten_sentences    JSON,
    ielts_score            JSON,
    analytics              JSON,
    confidence             DECIMAL(3,2),
    created_at             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_feedback_entry   FOREIGN KEY (writing_entry_id) REFERENCES writing_entries(id),
    CONSTRAINT fk_feedback_request FOREIGN KEY (ai_request_id)    REFERENCES ai_requests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_feedback_entry   ON ai_feedbacks(writing_entry_id);
CREATE INDEX idx_feedback_request ON ai_feedbacks(ai_request_id);

CREATE TABLE ai_usage_logs (
    id                BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id           CHAR(36)    NOT NULL,
    ai_request_id     CHAR(36),
    provider          VARCHAR(20) NOT NULL,
    model             VARCHAR(80) NOT NULL,
    prompt_tokens     INT         NOT NULL DEFAULT 0,
    completion_tokens INT         NOT NULL DEFAULT 0,
    usage_date        DATE        NOT NULL DEFAULT (CURRENT_DATE),
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_usage_user_date ON ai_usage_logs(user_id, usage_date);
