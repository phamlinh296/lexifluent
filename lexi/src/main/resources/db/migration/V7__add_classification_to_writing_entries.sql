-- ============================================================
-- V7: Add explicit classification fields to writing_entries
-- Allows FE to send essay_type / task1_type / target_band directly
-- instead of relying on keyword detection from topic_prompt
-- ============================================================

ALTER TABLE writing_entries
    ADD COLUMN essay_type   VARCHAR(30) NULL AFTER correction_style,
    ADD COLUMN task1_type   VARCHAR(30) NULL AFTER essay_type,
    ADD COLUMN target_band  VARCHAR(20) NULL AFTER task1_type;

ALTER TABLE writing_entries
    ADD CONSTRAINT chk_essay_type CHECK (essay_type IN (
        'OPINION','DISCUSSION','ADVANTAGES_DISADVANTAGES',
        'PROBLEM_SOLUTION','DOUBLE_QUESTION','DIRECT_QUESTION','NOT_APPLICABLE'
    )),
    ADD CONSTRAINT chk_task1_type CHECK (task1_type IN (
        'LINE_GRAPH','BAR_CHART','PIE_CHART','TABLE',
        'MIXED_CHART','PROCESS','MAP','NOT_APPLICABLE'
    )),
    ADD CONSTRAINT chk_target_band CHECK (target_band IN (
        'BAND_6_0','BAND_6_5','BAND_7_0','BAND_7_5','BAND_8_0','BAND_8_5','NOT_APPLICABLE'
    ));
