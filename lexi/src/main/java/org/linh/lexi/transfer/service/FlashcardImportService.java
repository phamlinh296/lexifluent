package org.linh.lexi.transfer.service;

import com.opencsv.CSVReaderHeaderAware;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.linh.lexi.transfer.dto.ImportResultDto;
import org.linh.lexi.transfer.dto.ImportRowError;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardImportService {

    private final FlashcardRepository flashcardRepository;

    @Transactional
    public ImportResultDto importCsv(UUID userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new LexiException(ErrorCode.VALIDATION_FAILED, "File is empty");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new LexiException(ErrorCode.VALIDATION_FAILED, "Cannot read file");
        }

        // strip UTF-8 BOM if present
        int offset = 0;
        if (bytes.length >= 3 && bytes[0] == (byte) 0xEF && bytes[1] == (byte) 0xBB && bytes[2] == (byte) 0xBF) {
            offset = 3;
        }

        List<Flashcard> toSave = new ArrayList<>();
        List<ImportRowError> errors = new ArrayList<>();
        int rowNum = 1; // 1-indexed, row 1 is the header
        int skipped = 0;

        try (CSVReaderHeaderAware reader = new CSVReaderHeaderAware(
                new InputStreamReader(new ByteArrayInputStream(bytes, offset, bytes.length - offset), StandardCharsets.UTF_8))) {

            Map<String, String> row;
            while ((row = reader.readMap()) != null) {
                rowNum++;

                String front = trimOrEmpty(row.get("front"));
                String back  = trimOrEmpty(row.get("back"));

                if (front.isBlank()) {
                    errors.add(new ImportRowError(rowNum, "front is empty"));
                    continue;
                }
                if (back.isBlank()) {
                    errors.add(new ImportRowError(rowNum, "back is empty"));
                    continue;
                }

                FlashcardType type;
                String typeStr = trimOrEmpty(row.get("type"));
                try {
                    type = typeStr.isBlank() ? FlashcardType.BASIC : FlashcardType.valueOf(typeStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    errors.add(new ImportRowError(rowNum, "unknown type: " + typeStr));
                    continue;
                }

                if (flashcardRepository.findByUserIdAndFrontIgnoreCase(userId, front).isPresent()) {
                    skipped++;
                    continue;
                }

                String hint     = blankToNull(row.get("hint"));
                String cefrLevel = blankToNull(row.get("cefr_level"));

                toSave.add(Flashcard.builder()
                        .userId(userId)
                        .type(type)
                        .front(front)
                        .back(back)
                        .hint(hint)
                        .cefrLevel(cefrLevel)
                        .source("IMPORT")
                        .build());
            }
        } catch (LexiException e) {
            throw e;
        } catch (Exception e) {
            throw new LexiException(ErrorCode.VALIDATION_FAILED, "Failed to parse CSV: " + e.getMessage());
        }

        flashcardRepository.saveAll(toSave);
        return new ImportResultDto(toSave.size(), skipped, errors.size(), errors);
    }

    private String trimOrEmpty(String s) { return s != null ? s.trim() : ""; }
    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isBlank() ? null : t;
    }
}
