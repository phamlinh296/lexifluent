package org.linh.lexi.transfer.format;

import com.opencsv.CSVWriter;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CsvExporter implements FlashcardExporter {

    private static final String[] HEADERS = {"type", "front", "back", "hint", "cefr_level"};
    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    @Override
    public byte[] export(List<Flashcard> flashcards) {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.writeBytes(UTF8_BOM); // for Excel compatibility
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(bos, StandardCharsets.UTF_8))) {
            writer.writeNext(HEADERS);
            for (Flashcard card : flashcards) {
                writer.writeNext(new String[]{
                        card.getType().name(),
                        card.getFront(),
                        card.getBack(),
                        orEmpty(card.getHint()),
                        orEmpty(card.getCefrLevel())
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed", e);
        }
        return bos.toByteArray();
    }

    @Override public String contentType() { return "text/csv;charset=UTF-8"; }
    @Override public String filename()    { return "flashcards.csv"; }

    private String orEmpty(String s) { return s != null ? s : ""; }
}
