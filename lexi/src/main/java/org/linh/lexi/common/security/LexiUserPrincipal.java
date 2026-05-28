package org.linh.lexi.common.security;

import java.util.UUID;

public record LexiUserPrincipal(UUID userId, String email) {}
