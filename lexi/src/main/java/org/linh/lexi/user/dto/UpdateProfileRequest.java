package org.linh.lexi.user.dto;

import org.linh.lexi.user.domain.CefrLevel;

public record UpdateProfileRequest(String displayName, CefrLevel cefrLevel) {}
