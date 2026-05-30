-- V10: Add phonetic transcription and Vietnamese meaning to vocabulary and flashcards

ALTER TABLE vocabulary_items
    ADD COLUMN phonetic         VARCHAR(100) NULL,
    ADD COLUMN vietnamese_meaning TEXT        NULL;

ALTER TABLE flashcards
    ADD COLUMN phonetic         VARCHAR(100) NULL,
    ADD COLUMN vietnamese_meaning TEXT        NULL;
