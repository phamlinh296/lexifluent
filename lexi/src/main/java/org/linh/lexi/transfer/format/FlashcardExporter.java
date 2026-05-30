package org.linh.lexi.transfer.format;

import org.linh.lexi.flashcard.domain.Flashcard;

import java.util.List;

public interface FlashcardExporter {
    byte[] export(List<Flashcard> flashcards);
    String contentType();
    String filename();
}
