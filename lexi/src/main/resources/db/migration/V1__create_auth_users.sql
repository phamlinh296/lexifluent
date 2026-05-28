-- ============================================================
-- V1: Auth & Users
-- ============================================================

CREATE TABLE users (
    id               CHAR(36)     NOT NULL PRIMARY KEY,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    display_name     VARCHAR(100),
    avatar_url       VARCHAR(500),
    role             VARCHAR(20)  NOT NULL DEFAULT 'USER',
    cefr_level       VARCHAR(10),
    writing_streak   INT          NOT NULL DEFAULT 0,
    last_active_date DATE,
    onboarded        TINYINT(1)   NOT NULL DEFAULT 0,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    deleted_at       DATETIME(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_active_date ON users(last_active_date);

CREATE TABLE audit_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     CHAR(36),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   CHAR(36),
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    metadata    JSON,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action   ON audit_logs(action);
CREATE INDEX idx_audit_created  ON audit_logs(created_at);
