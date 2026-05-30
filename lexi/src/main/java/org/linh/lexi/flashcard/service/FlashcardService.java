package org.linh.lexi.flashcard.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.analytics.domain.UserProgress;
import org.linh.lexi.analytics.repository.UserProgressRepository;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.linh.lexi.flashcard.dto.CreateFlashcardRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.FlashcardStatsDto;
import org.linh.lexi.flashcard.dto.ReviewFlashcardRequest;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository repository;
    private final UserProgressRepository progressRepository;

    @Transactional
    public FlashcardDto create(UUID userId, CreateFlashcardRequest request) {
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
                .phonetic(request.phonetic())
                .vietnameseMeaning(request.vietnameseMeaning())
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
        FlashcardDto result = FlashcardDto.from(repository.save(card));
        updateFlashcardStreak(userId);
        return result;
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

    @Transactional
    public FlashcardDto toggleFavorite(UUID userId, UUID flashcardId) {
        Flashcard card = repository.findById(flashcardId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        card.setFavorite(!card.isFavorite());
        return FlashcardDto.from(repository.save(card));
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> listFavorites(UUID userId) {
        return repository.findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(userId)
                .stream().map(FlashcardDto::from).toList();
    }

    @Transactional(readOnly = true)
    public FlashcardStatsDto getStats(UUID userId) {
        int streak = progressRepository.findByUserId(userId)
                .map(UserProgress::getFlashcardStreak)
                .orElse(0);
        return new FlashcardStatsDto(streak);
    }

    private void updateFlashcardStreak(UUID userId) {
        UserProgress progress = progressRepository.findByUserId(userId)
                .orElseGet(() -> UserProgress.builder().userId(userId).build());
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate last = progress.getLastFlashcardDate();
        if (last == null || last.isBefore(today.minusDays(1))) {
            progress.setFlashcardStreak(1);
        } else if (last.equals(today.minusDays(1))) {
            progress.setFlashcardStreak(progress.getFlashcardStreak() + 1);
        }
        // last == today → already counted, no change
        progress.setLastFlashcardDate(today);
        progressRepository.save(progress);
    }
}
