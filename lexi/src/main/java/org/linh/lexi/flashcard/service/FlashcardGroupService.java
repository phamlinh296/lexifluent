package org.linh.lexi.flashcard.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardGroup;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.linh.lexi.flashcard.dto.CreateFlashcardGroupRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.FlashcardGroupDto;
import org.linh.lexi.flashcard.repository.FlashcardGroupRepository;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardGroupService {

    private final FlashcardGroupRepository groupRepository;
    private final FlashcardRepository flashcardRepository;
    private final VocabularyItemRepository vocabularyItemRepository;

    @Transactional(readOnly = true)
    public List<FlashcardGroupDto> list(UUID userId) {
        return groupRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream().map(FlashcardGroupDto::from).toList();
    }

    @Transactional
    public FlashcardGroupDto create(UUID userId, CreateFlashcardGroupRequest request) {
        if (groupRepository.existsByUserIdAndName(userId, request.name())) {
            throw new LexiException(ErrorCode.FLASHCARD_GROUP_DUPLICATE);
        }
        FlashcardGroup group = FlashcardGroup.builder()
                .userId(userId)
                .name(request.name())
                .build();
        return FlashcardGroupDto.from(groupRepository.save(group));
    }

    @Transactional
    public void delete(UUID userId, UUID groupId) {
        FlashcardGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_GROUP_NOT_FOUND));
        if (!group.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        groupRepository.delete(group);
    }

    @Transactional
    public FlashcardDto addCard(UUID userId, UUID groupId, UUID cardId) {
        FlashcardGroup group = findOwnedGroup(userId, groupId);
        Flashcard card = findOwnedCard(userId, cardId);
        card.getGroups().add(group);
        return FlashcardDto.from(flashcardRepository.save(card));
    }

    @Transactional
    public FlashcardDto removeCard(UUID userId, UUID groupId, UUID cardId) {
        FlashcardGroup group = findOwnedGroup(userId, groupId);
        Flashcard card = findOwnedCard(userId, cardId);
        card.getGroups().remove(group);
        return FlashcardDto.from(flashcardRepository.save(card));
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> listCards(UUID userId, UUID groupId) {
        findOwnedGroup(userId, groupId);
        return flashcardRepository.findByUserIdAndGroupId(userId, groupId)
                .stream().map(FlashcardDto::from).toList();
    }

    @Transactional
    public FlashcardDto addVocabToGroup(UUID userId, UUID vocabId, UUID groupId) {
        VocabularyItem vocab = vocabularyItemRepository.findById(vocabId)
                .orElseThrow(() -> new LexiException(ErrorCode.RESOURCE_NOT_FOUND));
        if (!vocab.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }

        FlashcardGroup group = findOwnedGroup(userId, groupId);

        // Find existing BASIC card for this vocab, or create one
        Flashcard card = flashcardRepository
                .findFirstByUserIdAndVocabularyItemIdAndType(userId, vocabId, FlashcardType.BASIC)
                .orElseGet(() -> {
                    String back = buildBack(vocab);
                    return flashcardRepository.save(Flashcard.builder()
                            .userId(userId)
                            .vocabularyItemId(vocabId)
                            .type(FlashcardType.BASIC)
                            .front(vocab.getWord())
                            .back(back)
                            .cefrLevel(vocab.getCefrLevel() != null ? vocab.getCefrLevel().name() : null)
                            .source("MANUAL")
                            .build());
                });

        if (!card.getGroups().contains(group)) {
            card.getGroups().add(group);
            card = flashcardRepository.save(card);
        }
        return FlashcardDto.from(card);
    }

    private String buildBack(VocabularyItem vocab) {
        StringBuilder sb = new StringBuilder();
        if (vocab.getDefinition() != null) sb.append(vocab.getDefinition());
        if (vocab.getExampleSentence() != null && !vocab.getExampleSentence().isBlank()) {
            if (!sb.isEmpty()) sb.append('\n');
            sb.append("Ví dụ: ").append(vocab.getExampleSentence());
        }
        return sb.toString().trim();
    }

    private FlashcardGroup findOwnedGroup(UUID userId, UUID groupId) {
        FlashcardGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_GROUP_NOT_FOUND));
        if (!group.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        return group;
    }

    private Flashcard findOwnedCard(UUID userId, UUID cardId) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        return card;
    }
}
