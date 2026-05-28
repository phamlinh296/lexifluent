package org.linh.lexi.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Auth
    INVALID_CREDENTIALS("AUTH_001", "Invalid email or password", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("AUTH_002", "Token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("AUTH_003", "Token is invalid", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_INVALID("AUTH_004", "Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED),
    EMAIL_ALREADY_EXISTS("AUTH_005", "Email is already registered", HttpStatus.CONFLICT),
    ACCOUNT_DISABLED("AUTH_006", "Account is disabled", HttpStatus.FORBIDDEN),

    // User
    USER_NOT_FOUND("USER_001", "User not found", HttpStatus.NOT_FOUND),

    // Writing
    WRITING_NOT_FOUND("WRITING_001", "Writing entry not found", HttpStatus.NOT_FOUND),
    WRITING_ALREADY_SUBMITTED("WRITING_002", "Writing entry is already submitted", HttpStatus.CONFLICT),
    WRITING_TEXT_TOO_SHORT("WRITING_003", "Writing text is too short (minimum 20 words)", HttpStatus.BAD_REQUEST),

    // AI
    AI_PROVIDER_UNAVAILABLE("AI_001", "AI provider is currently unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    AI_QUOTA_EXCEEDED("AI_002", "Daily AI usage quota exceeded", HttpStatus.TOO_MANY_REQUESTS),
    AI_RESPONSE_INVALID("AI_003", "AI returned an invalid response", HttpStatus.INTERNAL_SERVER_ERROR),
    AI_REQUEST_NOT_FOUND("AI_004", "AI request not found", HttpStatus.NOT_FOUND),

    // Flashcard
    FLASHCARD_NOT_FOUND("FLASHCARD_001", "Flashcard not found", HttpStatus.NOT_FOUND),

    // Generic
    VALIDATION_FAILED("VALIDATION_001", "Request validation failed", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("GENERIC_001", "Resource not found", HttpStatus.NOT_FOUND),
    ACCESS_DENIED("GENERIC_002", "Access denied", HttpStatus.FORBIDDEN),
    INTERNAL_ERROR("GENERIC_003", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    RATE_LIMIT_EXCEEDED("GENERIC_004", "Too many requests", HttpStatus.TOO_MANY_REQUESTS);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }
}
