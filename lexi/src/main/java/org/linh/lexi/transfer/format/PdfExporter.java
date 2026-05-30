package org.linh.lexi.transfer.format;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Component
public class PdfExporter implements FlashcardExporter {

    private static final Color HEADER_BG  = new Color(48, 79, 254);
    private static final Color ODD_BG     = new Color(245, 247, 255);
    private static final Color BORDER     = new Color(210, 210, 210);
    private static final float[] COL_WIDTHS = {10f, 25f, 25f, 25f, 9f};

    @Override
    public byte[] export(List<Flashcard> flashcards) {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 30, 30, 45, 35);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, bos);
            writer.setPageEvent(new PageFooter());
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Color.DARK_GRAY);
            Paragraph title = new Paragraph("LexiFluent — Flashcard Export", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4f);
            doc.add(title);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
            Paragraph sub = new Paragraph(flashcards.size() + " card(s)", subFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(14f);
            doc.add(sub);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(COL_WIDTHS);
            table.setHeaderRows(1);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            for (String h : new String[]{"Type", "Front", "Back", "Hint", "CEFR"}) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(HEADER_BG);
                cell.setPadding(6f);
                cell.setBorderColor(BORDER);
                table.addCell(cell);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f);
            for (int i = 0; i < flashcards.size(); i++) {
                Flashcard card = flashcards.get(i);
                Color bg = (i % 2 != 0) ? ODD_BG : Color.WHITE;
                addCell(table, card.getType().name(), bodyFont, bg);
                addCell(table, card.getFront(), bodyFont, bg);
                addCell(table, card.getBack(), bodyFont, bg);
                addCell(table, orEmpty(card.getHint()), bodyFont, bg);
                addCell(table, orEmpty(card.getCefrLevel()), bodyFont, bg);
            }

            doc.add(table);
        } catch (Exception e) {
            throw new RuntimeException("PDF export failed", e);
        } finally {
            doc.close();
        }
        return bos.toByteArray();
    }

    private void addCell(PdfPTable table, String text, Font font, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(5f);
        cell.setBorderColor(BORDER);
        table.addCell(cell);
    }

    @Override public String contentType() { return "application/pdf"; }
    @Override public String filename()    { return "flashcards.pdf"; }

    private String orEmpty(String s) { return s != null ? s : ""; }

    private static class PageFooter extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document doc) {
            Font font = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
            Phrase p = new Phrase("Page " + writer.getPageNumber(), font);
            float x = (doc.right() - doc.left()) / 2 + doc.leftMargin();
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_CENTER, p, x, doc.bottom() - 12, 0);
        }
    }
}
