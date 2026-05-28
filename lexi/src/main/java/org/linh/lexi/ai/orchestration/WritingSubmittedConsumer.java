package org.linh.lexi.ai.orchestration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.common.config.KafkaTopics;
import org.linh.lexi.writing.event.WritingSubmittedMessage;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WritingSubmittedConsumer {

    private final AiOrchestrationService orchestrationService;

    @KafkaListener(
            topics = KafkaTopics.WRITING_SUBMITTED,
            groupId = "ai-feedback-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(@Payload WritingSubmittedMessage message,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        log.info("Consumed writing.submitted: entryId={} partition={}", message.writingEntryId(), partition);
        try {
            java.util.UUID feedbackId = orchestrationService.processWriting(message);
            orchestrationService.publishVocabularyEvent(message.writingEntryId(), feedbackId, message.userId());
            ack.acknowledge();
        } catch (Exception ex) {
            // Log but don't ack — Kafka will redeliver (up to retry config)
            log.error("Failed to process writing entry {}: {}", message.writingEntryId(), ex.getMessage(), ex);
            throw ex;  // re-throw triggers retry/DLT
        }
    }
}
