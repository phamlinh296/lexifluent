package org.linh.lexi.ai.orchestration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiRequestEntity;
import org.linh.lexi.ai.domain.AiRequestStatus;
import org.linh.lexi.ai.repository.AiRequestRepository;
import org.linh.lexi.writing.repository.WritingEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiFailureMarkingService {

    private final WritingEntryRepository writingEntryRepository;
    private final AiRequestRepository aiRequestRepository;

    // REQUIRES_NEW: commit ngay cả khi transaction cha đang rollback
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID entryId, AiRequestEntity aiRequest, String errorMessage, int latencyMs) {
        writingEntryRepository.findById(entryId).ifPresent(entry -> {
            entry.markFailed();
            writingEntryRepository.save(entry);
            log.info("Marked writing entry {} as FAILED", entryId);
        });

        if (aiRequest != null && aiRequest.getId() != null) {
            aiRequestRepository.findById(aiRequest.getId()).ifPresent(req -> {
                req.setStatus(AiRequestStatus.FAILED);
                req.setErrorMessage(errorMessage);
                req.setLatencyMs(latencyMs);
                aiRequestRepository.save(req);
            });
        }
    }
}
