package org.linh.lexi.flashcard.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.linh.lexi.flashcard.dto.CreateFlashcardRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.ReviewFlashcardRequest;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository repository;

    @Transactional
    public FlashcardDto create(UUID userId, CreateFlashcardRequest request) {
        // Skip if already saved from same vocab source
        if (request.vocabularyItemId() != null
                && repository.existsByUserIdAndVocabularyItemId(userId, request.vocabularyItemId())) {
            return repository.findByUserIdAndFrontIgnoreCase(userId, request.front())
                    .map(FlashcardDto::from)
                    .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        }

        FlashcardType cardType = FlashcardType.BASIC;
        if (request.type() != null) {
            try { cardType = FlashcardType.valueOf(request.type().toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        Flashcard card = Flashcard.builder()
                .userId(userId)
                .vocabularyItemId(request.vocabularyItemId())
                .type(cardType)
                .front(request.front())
                .back(request.back())
                .cefrLevel(request.cefrLevel())
                .build();
        return FlashcardDto.from(repository.save(card));
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> listAll(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(FlashcardDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> listDue(UUID userId) {
        return repository.findDueByUserId(userId, Instant.now())
                .stream().map(FlashcardDto::from).toList();
    }

    @Transactional
    public FlashcardDto review(UUID userId, UUID flashcardId, ReviewFlashcardRequest request) {
        if (request.quality() < 0 || request.quality() > 5) {
            throw new LexiException(ErrorCode.VALIDATION_FAILED, "quality must be 0-5");
        }
        Flashcard card = repository.findById(flashcardId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        card.applyReview(request.quality());
        return FlashcardDto.from(repository.save(card));
    }

    @Transactional
    public void delete(UUID userId, UUID flashcardId) {
        Flashcard card = repository.findById(flashcardId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        repository.delete(card);
    }
}
