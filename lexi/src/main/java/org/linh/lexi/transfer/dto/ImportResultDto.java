package org.linh.lexi.transfer.dto;

import java.util.List;

public record ImportResultDto(int imported, int skipped, int failed, List<ImportRowError> errors) {}
