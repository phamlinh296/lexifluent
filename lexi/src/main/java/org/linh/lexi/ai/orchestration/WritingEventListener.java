package org.linh.lexi.ai.orchestration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.writing.event.WritingSubmittedApplicationEvent;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// MVP: xử lý AI qua @Async — không cần Kafka chạy
// Kafka consumer (WritingSubmittedConsumer) vẫn sẵn sàng cho prod scale
@Slf4j
@Component
@RequiredArgsConstructor
public class WritingEventListener {

    private final AiOrchestrationService orchestrationService;

    // AFTER_COMMIT: đảm bảo WritingEntry đã được commit vào DB trước khi AI pipeline đọc
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("aiTaskExecutor")
    public void onWritingSubmitted(WritingSubmittedApplicationEvent event) {
        log.info("Spring event: processing writing entry {}", event.getMessage().writingEntryId());
        var msg = event.getMessage();
        java.util.UUID feedbackId = orchestrationService.processWriting(msg);
        // Publish Kafka AFTER transaction committed — failure here doesn't affect AI feedback
        orchestrationService.publishVocabularyEvent(msg.writingEntryId(), feedbackId, msg.userId());
    }
}
