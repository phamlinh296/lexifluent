package org.linh.lexi.transfer.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.transfer.dto.ImportResultDto;
import org.linh.lexi.transfer.format.ExportFormat;
import org.linh.lexi.transfer.service.FlashcardExportService;
import org.linh.lexi.transfer.service.FlashcardImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
public class FlashcardTransferController {

    private final FlashcardImportService importService;
    private final FlashcardExportService exportService;

    @PostMapping("/import")
    public ApiResponse<ImportResultDto> importCsv(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(importService.importCsv(principal.userId(), file));
    }

    // GET /api/v1/flashcards/import/template — download a blank CSV with the correct headers
    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String csv = "﻿type,front,back,hint,cefr_level\r\n"
                   + "BASIC,example word,example definition,,B1\r\n"
                   + "CLOZE,I ___ to school every day,walk,,A2\r\n"
                   + "GRAMMAR_CORRECTION,He go to school,He goes to school,,\r\n";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"flashcards_template.csv\"")
                .body(csv.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "CSV") ExportFormat format,
            @RequestParam(required = false) UUID groupId) {
        FlashcardExportService.ExportResult result = exportService.export(principal.userId(), groupId, format);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + "\"")
                .body(result.data());
    }
}
