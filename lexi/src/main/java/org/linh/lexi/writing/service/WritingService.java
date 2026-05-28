package org.linh.lexi.writing.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.common.response.PageResponse;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.domain.WritingStatus;
import org.linh.lexi.writing.dto.SubmitWritingRequest;
import org.linh.lexi.writing.dto.WritingEntryDto;
import org.linh.lexi.writing.event.WritingSubmittedApplicationEvent;
import org.linh.lexi.writing.event.WritingSubmittedMessage;
import org.linh.lexi.writing.mapper.WritingMapper;
import org.linh.lexi.writing.repository.WritingEntryRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WritingService {

    private final WritingEntryRepository writingEntryRepository;
    private final UserRepository userRepository;
    private final WritingMapper writingMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public WritingEntryDto submit(UUID userId, SubmitWritingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new LexiException(ErrorCode.USER_NOT_FOUND));

        WritingEntry entry = WritingEntry.builder()
                .user(user)
                .mode(request.mode())
                .correctionStyle(deriveStyle(request))
                .essayType(request.essayType())
                .task1Type(request.task1Type())
                .targetBand(request.targetBand())
                .title(request.title())
                .originalText(request.text())
                .topicPrompt(request.topicPrompt())
                .build();

        entry.submit();
        writingEntryRepository.save(entry);

        // Publish Spring ApplicationEvent — WritingEventListener handles async via @Async("aiTaskExecutor")
        // Không cần Kafka cho MVP; event được publish sau khi transaction commit thành công
        var message = new WritingSubmittedMessage(
                entry.getId(), userId, entry.getMode().name(), entry.getCorrectionStyle().name());
        eventPublisher.publishEvent(new WritingSubmittedApplicationEvent(this, message));

        return writingMapper.toDto(entry);
    }

    @Transactional(readOnly = true)
    public PageResponse<WritingEntryDto> listByUser(UUID userId, WritingMode mode, Pageable pageable) {
        var page = mode != null
                ? writingEntryRepository.findByUserIdAndModeAndDeletedAtIsNullOrderByCreatedAtDesc(userId, mode, pageable)
                : writingEntryRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.of(page.map(writingMapper::toDto));
    }

    @Transactional(readOnly = true)
    public WritingEntryDto getById(UUID userId, UUID entryId) {
        return writingEntryRepository.findByIdAndUserIdAndDeletedAtIsNull(entryId, userId)
                .map(writingMapper::toDto)
                .orElseThrow(() -> new LexiException(ErrorCode.WRITING_NOT_FOUND));
    }

    // IELTS: derive correctionStyle from targetBand (cheap vs strong model decision)
    // Daily English: correctionStyle required (GRAMMAR/NATURAL/NATIVE)
    private CorrectionStyle deriveStyle(SubmitWritingRequest request) {
        if (request.correctionStyle() != null) return request.correctionStyle();
        if (request.targetBand() != null) {
            return switch (request.targetBand()) {
                case BAND_7_5, BAND_8_0, BAND_8_5 -> CorrectionStyle.IELTS_BAND_7_8;
                default -> CorrectionStyle.IELTS_BAND_6;
            };
        }
        return CorrectionStyle.GRAMMAR_CORRECTION;
    }

    @Transactional
    public void softDelete(UUID userId, UUID entryId) {
        WritingEntry entry = writingEntryRepository.findByIdAndUserIdAndDeletedAtIsNull(entryId, userId)
                .orElseThrow(() -> new LexiException(ErrorCode.WRITING_NOT_FOUND));
        if (entry.getStatus() == WritingStatus.AI_PROCESSING) {
            throw new LexiException(ErrorCode.WRITING_ALREADY_SUBMITTED);
        }
        entry.softDelete();
    }
}
