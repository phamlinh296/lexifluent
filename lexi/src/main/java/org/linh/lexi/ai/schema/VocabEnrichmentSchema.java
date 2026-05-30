package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class VocabEnrichmentSchema {
    private String word;
    private String phonetic;
    private String vietnameseMeaning;
    private String definition;
    private String exampleSentence;
    private String cefrLevel;
    private String topic;
    private List<String> collocations;
}
