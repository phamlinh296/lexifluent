package org.linh.lexi.transfer.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.linh.lexi.transfer.format.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardExportService {

    private final FlashcardRepository flashcardRepository;
    private final CsvExporter csvExporter;
    private final XlsxExporter xlsxExporter;
    private final PdfExporter pdfExporter;

    @Transactional(readOnly = true)
    public ExportResult export(UUID userId, UUID groupId, ExportFormat format) {
        List<Flashcard> cards = groupId != null
                ? flashcardRepository.findByUserIdAndGroupId(userId, groupId)
                : flashcardRepository.findByUserIdOrderByCreatedAtDesc(userId);

        FlashcardExporter exporter = switch (format) {
            case CSV  -> csvExporter;
            case XLSX -> xlsxExporter;
            case PDF  -> pdfExporter;
        };

        return new ExportResult(exporter.export(cards), exporter.contentType(), exporter.filename());
    }

    public record ExportResult(byte[] data, String contentType, String filename) {}
}
