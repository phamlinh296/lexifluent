package org.linh.lexi.common.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic writingSubmittedTopic() {
        return TopicBuilder.name(KafkaTopics.WRITING_SUBMITTED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic aiFeedbackGeneratedTopic() {
        return TopicBuilder.name(KafkaTopics.AI_FEEDBACK_GENERATED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic vocabularyExtractedTopic() {
        return TopicBuilder.name(KafkaTopics.VOCABULARY_EXTRACTED)
                .partitions(2)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic analyticsUpdatedTopic() {
        return TopicBuilder.name(KafkaTopics.ANALYTICS_UPDATED)
                .partitions(2)
                .replicas(1)
                .build();
    }
}
