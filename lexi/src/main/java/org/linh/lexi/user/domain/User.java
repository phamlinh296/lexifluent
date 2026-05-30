package org.linh.lexi.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.linh.lexi.common.audit.BaseEntity;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.USER;

    // LOCAL = email/password, GOOGLE = OAuth2
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @JsonIgnore
    @Column(name = "google_id")
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level")
    private CefrLevel cefrLevel;

    @Column(name = "writing_streak")
    @Builder.Default
    private int writingStreak = 0;

    @Column(name = "last_active_date")
    private LocalDate lastActiveDate;

    @Builder.Default
    private boolean onboarded = false;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @JsonIgnore
    @Column(name = "token_version")
    @Builder.Default
    private int tokenVersion = 0;

    // BYOK: stored encrypted (AES-256-GCM), never returned in API responses
    @JsonIgnore
    @Column(name = "openai_api_key_encrypted", length = 512)
    private String openaiApiKeyEncrypted;

    @JsonIgnore
    @Column(name = "gemini_api_key_encrypted", length = 512)
    private String geminiApiKeyEncrypted;

    public void incrementTokenVersion() {
        this.tokenVersion++;
    }

    @JsonProperty("openaiKeyConfigured")
    public boolean isOpenaiKeyConfigured() {
        return openaiApiKeyEncrypted != null && !openaiApiKeyEncrypted.isBlank();
    }

    @JsonProperty("geminiKeyConfigured")
    public boolean isGeminiKeyConfigured() {
        return geminiApiKeyEncrypted != null && !geminiApiKeyEncrypted.isBlank();
    }
}
