package org.linh.lexi.vocabulary.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.linh.lexi.ai.repository.AiFeedbackRepository;
import org.linh.lexi.ai.schema.AiFeedbackSchema;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.linh.lexi.user.domain.CefrLevel;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class VocabularyExtractorService {

    private final AiFeedbackRepository aiFeedbackRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final FlashcardRepository flashcardRepository;
    private final ObjectMapper objectMapper;

    // Called by Kafka consumer after ai.feedback.generated
    @Transactional
    public void extractFromFeedback(UUID aiFeedbackId, UUID userId) {
        AiFeedbackEntity feedback = aiFeedbackRepository.findById(aiFeedbackId)
                .orElseThrow(() -> new IllegalStateException("AiFeedback not found: " + aiFeedbackId));

        if (feedback.getVocabularySuggestions() == null) return;

        List<AiFeedbackSchema.VocabularySuggestion> suggestions;
        try {
            suggestions = objectMapper.readValue(
                    feedback.getVocabularySuggestions(),
                    new TypeReference<>() {});
        } catch (Exception ex) {
            log.warn("Could not parse vocabularySuggestions for feedback {}: {}", aiFeedbackId, ex.getMessage());
            return;
        }

        for (AiFeedbackSchema.VocabularySuggestion suggestion : suggestions) {
            if (suggestion.getWord() == null || suggestion.getWord().isBlank()) continue;
            String word = suggestion.getWord().toLowerCase().trim();

            vocabularyItemRepository.findByUserIdAndWord(userId, word).ifPresentOrElse(
                    existing -> vocabularyItemRepository.incrementEncounterCount(userId, word),
                    () -> {
                        VocabularyItem saved = vocabularyItemRepository.save(VocabularyItem.builder()
                                .userId(userId)
                                .writingEntryId(feedback.getWritingEntryId())
                                .word(word)
                                .definition(suggestion.getDefinition())
                                .exampleSentence(suggestion.getExampleSentence())
                                .cefrLevel(parseCefr(suggestion.getCefrLevel()))
                                .build());
                        autoCreateClozeCard(userId, word, suggestion, saved.getId());
                    }
            );
        }
        log.debug("Extracted {} vocab items for user {} from feedback {}", suggestions.size(), userId, aiFeedbackId);
    }

    private void autoCreateClozeCard(UUID userId, String word,
                                      AiFeedbackSchema.VocabularySuggestion suggestion, UUID vocabItemId) {
        String sentence = suggestion.getExampleSentence();
        if (sentence == null || sentence.isBlank()) return;
        // Skip if card already exists for this vocab item
        if (flashcardRepository.existsByUserIdAndVocabularyItemId(userId, vocabItemId)) return;

        String clozeQuestion = sentence.replaceAll("(?i)" + Pattern.quote(word), "_____");
        if (clozeQuestion.equals(sentence)) return; // word not found in sentence

        flashcardRepository.save(Flashcard.builder()
                .userId(userId)
                .vocabularyItemId(vocabItemId)
                .type(FlashcardType.CLOZE)
                .front(clozeQuestion)
                .back(word)
                .cefrLevel(suggestion.getCefrLevel() != null ? suggestion.getCefrLevel().toUpperCase() : null)
                .build());
    }

    private CefrLevel parseCefr(String raw) {
        if (raw == null) return null;
        try { return CefrLevel.valueOf(raw.toUpperCase().trim()); }
        catch (IllegalArgumentException ex) { return null; }
    }
}
