package org.linh.lexi.transfer.format;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Component
public class XlsxExporter implements FlashcardExporter {

    private static final String[] HEADERS = {"Type", "Front", "Back", "Hint", "CEFR Level"};
    private static final int[] COL_WIDTHS = {14, 40, 40, 30, 12}; // chars

    @Override
    public byte[] export(List<Flashcard> flashcards) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Flashcards");

            CellStyle headerStyle = buildHeaderStyle(workbook);
            CellStyle evenStyle  = buildRowStyle(workbook, IndexedColors.WHITE);
            CellStyle oddStyle   = buildRowStyle(workbook, IndexedColors.GREY_25_PERCENT);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, COL_WIDTHS[i] * 256);
            }
            sheet.createFreezePane(0, 1);

            for (int i = 0; i < flashcards.size(); i++) {
                Flashcard card = flashcards.get(i);
                Row row = sheet.createRow(i + 1);
                CellStyle style = (i % 2 == 0) ? evenStyle : oddStyle;

                setCell(row, 0, card.getType().name(), style);
                setCell(row, 1, card.getFront(), style);
                setCell(row, 2, card.getBack(), style);
                setCell(row, 3, orEmpty(card.getHint()), style);
                setCell(row, 4, orEmpty(card.getCefrLevel()), style);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("XLSX export failed", e);
        }
    }

    @Override public String contentType() { return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; }
    @Override public String filename()    { return "flashcards.xlsx"; }

    private CellStyle buildHeaderStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private CellStyle buildRowStyle(Workbook wb, IndexedColors bg) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(bg.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setWrapText(true);
        style.setVerticalAlignment(VerticalAlignment.TOP);
        return style;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private String orEmpty(String s) { return s != null ? s : ""; }
}
