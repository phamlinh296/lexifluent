package org.linh.lexi.ai.classification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.linh.lexi.review.domain.RecurringMistake;
import org.linh.lexi.review.repository.RecurringMistakeRepository;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.domain.WritingMode;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassificationEngineTest {

    @Mock
    private RecurringMistakeRepository mistakeRepository;

    @InjectMocks
    private ClassificationEngine engine;

    private final UUID userId = UUID.randomUUID();

    // --- Essay type detection ---

    @ParameterizedTest(name = "[{index}] \"{0}\" → {1}")
    @CsvSource({
            "'To what extent do you agree with this statement?', OPINION",
            "'Do you agree or disagree with the following statement?', OPINION",
            "'Give your opinion on this issue.', OPINION",
            "'Discuss both views and give your own opinion.', DISCUSSION",
            "'Some people think X. Others argue Y. Discuss.', DISCUSSION",
            "'Discuss the advantages and disadvantages of this trend.', ADVANTAGES_DISADVANTAGES",
            "'Do the advantages outweigh the disadvantages?', ADVANTAGES_DISADVANTAGES",
            "'What are the causes of this problem? What solutions can be offered?', PROBLEM_SOLUTION",
            "'What problems does this cause? What solutions exist?', PROBLEM_SOLUTION",
            "'What is the main reason for this? What can governments do about it?', DOUBLE_QUESTION",
            "'Write about the graph below.', DIRECT_QUESTION",
    })
    void detectEssayType_variousPrompts(String prompt, EssayType expected) {
        assertThat(engine.detectEssayType(prompt)).isEqualTo(expected);
    }

    @Test
    void detectEssayType_nullPrompt_returnsDirectQuestion() {
        assertThat(engine.detectEssayType(null)).isEqualTo(EssayType.DIRECT_QUESTION);
    }

    @Test
    void detectEssayType_blankPrompt_returnsDirectQuestion() {
        assertThat(engine.detectEssayType("   ")).isEqualTo(EssayType.DIRECT_QUESTION);
    }

    // --- Task 1 type detection ---

    @ParameterizedTest(name = "[{index}] \"{0}\" → {1}")
    @CsvSource({
            "'The bar chart shows the number of...', BAR_CHART",
            "'The bar graph compares...', BAR_CHART",
            "'The line graph illustrates trends in...', LINE_GRAPH",
            "'The line chart shows changes in...', LINE_GRAPH",
            "'The pie chart shows the proportion of...', PIE_CHART",
            "'The table below shows the number of...', TABLE",
            "'The diagram shows the process of making...', PROCESS",
            "'The stages involved in producing...', PROCESS",
            "'The map below shows changes to a town...', MAP",
            "'The plan shows the layout of...', MAP",
            "'The chart and graph below show...', MIXED_CHART",
    })
    void detectTask1Type_variousPrompts(String prompt, Task1Type expected) {
        assertThat(engine.detectTask1Type(prompt)).isEqualTo(expected);
    }

    @Test
    void detectTask1Type_nullPrompt_returnsLineGraphFallback() {
        assertThat(engine.detectTask1Type(null)).isEqualTo(Task1Type.LINE_GRAPH);
    }

    // --- Target band resolution ---

    @ParameterizedTest(name = "{0} → {1}")
    @CsvSource({
            "IELTS_BAND_6, BAND_6_5",
            "IELTS_BAND_7_8, BAND_7_5",
            "GRAMMAR_CORRECTION, NOT_APPLICABLE",
            "NATURAL_REWRITE, NOT_APPLICABLE",
            "NATIVE_REWRITE, NOT_APPLICABLE",
    })
    void resolveTargetBand(CorrectionStyle style, TargetBand expected) {
        assertThat(engine.resolveTargetBand(style)).isEqualTo(expected);
    }

    // --- Full classify() ---

    @Test
    void classify_task2OpinionBand75_correctClassification() {
        when(mistakeRepository.findByUserIdOrderByOccurrenceCountDesc(userId))
                .thenReturn(List.of(mistake("GRAMMAR", 10), mistake("WORD_CHOICE", 5)));
        WritingEntry entry = entryWith(WritingMode.IELTS_TASK2,
                "To what extent do you agree with this view?");

        WritingClassification result = engine.classify(entry, CorrectionStyle.IELTS_BAND_7_8, userId);

        assertThat(result.mode()).isEqualTo(WritingMode.IELTS_TASK2);
        assertThat(result.essayType()).isEqualTo(EssayType.OPINION);
        assertThat(result.task1Type()).isEqualTo(Task1Type.NOT_APPLICABLE);
        assertThat(result.targetBand()).isEqualTo(TargetBand.BAND_7_5);
        assertThat(result.userWeaknesses()).containsExactly("GRAMMAR", "WORD_CHOICE");
        assertThat(result.isTask2()).isTrue();
    }

    @Test
    void classify_task1BarChart_correctClassification() {
        when(mistakeRepository.findByUserIdOrderByOccurrenceCountDesc(userId))
                .thenReturn(List.of(mistake("GRAMMAR", 10)));
        WritingEntry entry = entryWith(WritingMode.IELTS_TASK1,
                "The bar chart shows the population of five cities.");

        WritingClassification result = engine.classify(entry, CorrectionStyle.IELTS_BAND_6, userId);

        assertThat(result.essayType()).isEqualTo(EssayType.NOT_APPLICABLE);
        assertThat(result.task1Type()).isEqualTo(Task1Type.BAR_CHART);
        assertThat(result.targetBand()).isEqualTo(TargetBand.BAND_6_5);
        assertThat(result.isTask1()).isTrue();
    }

    @Test
    void classify_daily_noIeltsDimensions() {
        WritingEntry entry = entryWith(WritingMode.DAILY_ENGLISH, null);
        when(mistakeRepository.findByUserIdOrderByOccurrenceCountDesc(userId)).thenReturn(List.of());

        WritingClassification result = engine.classify(entry, CorrectionStyle.NATURAL_REWRITE, userId);

        assertThat(result.essayType()).isEqualTo(EssayType.NOT_APPLICABLE);
        assertThat(result.task1Type()).isEqualTo(Task1Type.NOT_APPLICABLE);
        assertThat(result.targetBand()).isEqualTo(TargetBand.NOT_APPLICABLE);
        assertThat(result.userWeaknesses()).isEmpty();
        assertThat(result.isIelts()).isFalse();
    }

    @Test
    void classify_weaknessesCappedAtTwo() {
        when(mistakeRepository.findByUserIdOrderByOccurrenceCountDesc(userId)).thenReturn(List.of(
                mistake("GRAMMAR", 20),
                mistake("WORD_CHOICE", 10),
                mistake("STRUCTURE", 5)   // should be excluded
        ));
        WritingEntry entry = entryWith(WritingMode.IELTS_TASK2, "Do you agree?");

        WritingClassification result = engine.classify(entry, CorrectionStyle.IELTS_BAND_7_8, userId);

        assertThat(result.userWeaknesses()).hasSize(2);
        assertThat(result.userWeaknesses()).doesNotContain("STRUCTURE");
    }

    // --- Helpers ---

    private WritingEntry entryWith(WritingMode mode, String topicPrompt) {
        WritingEntry entry = new WritingEntry();
        entry.setMode(mode);
        entry.setTopicPrompt(topicPrompt);
        return entry;
    }

    private RecurringMistake mistake(String type, int count) {
        return RecurringMistake.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .mistakeType(type)
                .occurrenceCount(count)
                .build();
    }
}
