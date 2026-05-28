package org.linh.lexi.user.dto;

public record UserSettingsRequest(
        String openaiApiKey,   // null = no change, "" = clear key
        String geminiApiKey    // null = no change, "" = clear key
) {}
