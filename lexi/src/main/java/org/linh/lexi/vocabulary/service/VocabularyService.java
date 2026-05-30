package org.linh.lexi.vocabulary.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.dto.TopicCountDto;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VocabularyService {

    private final VocabularyItemRepository repository;

    @Transactional(readOnly = true)
    public Page<VocabularyItem> list(UUID userId, String topic, Pageable pageable) {
        if (topic != null && !topic.isBlank()) {
            return repository.findByUserIdAndTopicTagOrderByCreatedAtDesc(userId, topic.toLowerCase().trim(), pageable);
        }
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<TopicCountDto> getTopicStats(UUID userId) {
        return repository.countByTopicForUser(userId).stream()
                .map(row -> new TopicCountDto((String) row[0], (Long) row[1]))
                .toList();
    }

    @Transactional
    public VocabularyItem markMastered(UUID userId, UUID itemId, boolean mastered) {
        VocabularyItem item = repository.findById(itemId)
                .orElseThrow(() -> new LexiException(ErrorCode.RESOURCE_NOT_FOUND));
        if (!item.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }
        item.setMastered(mastered);
        return repository.save(item);
    }
}
