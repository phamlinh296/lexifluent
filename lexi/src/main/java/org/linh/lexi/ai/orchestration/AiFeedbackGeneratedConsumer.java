package org.linh.lexi.ai.orchestration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.event.AiFeedbackGeneratedMessage;
import org.linh.lexi.common.config.KafkaTopics;
import org.linh.lexi.vocabulary.service.VocabularyExtractorService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiFeedbackGeneratedConsumer {

    private final VocabularyExtractorService vocabularyExtractorService;

    @KafkaListener(
            topics = KafkaTopics.AI_FEEDBACK_GENERATED,
            groupId = "vocabulary-group"
    )
    public void consume(@Payload AiFeedbackGeneratedMessage message, Acknowledgment ack) {
        log.info("Consumed ai.feedback.generated: feedbackId={}", message.aiFeedbackId());
        try {
            vocabularyExtractorService.extractFromFeedback(message.aiFeedbackId(), message.userId());
            ack.acknowledge();
        } catch (Exception ex) {
            log.error("Vocab extraction failed for feedback {}: {}", message.aiFeedbackId(), ex.getMessage(), ex);
            throw ex;
        }
    }
}
