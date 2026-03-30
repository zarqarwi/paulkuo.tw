#!/usr/bin/env python3
"""Formosa ESG 2026 — 第二輪壓力測試報告 PDF 產生器"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import os
from datetime import datetime

# Register CJK font
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

# Colors
NAVY = HexColor('#1a2744')
BLUE = HexColor('#2563eb')
GREEN = HexColor('#16a34a')
RED = HexColor('#dc2626')
ORANGE = HexColor('#ea580c')
GRAY = HexColor('#6b7280')
LIGHT_GRAY = HexColor('#f3f4f6')
LIGHT_GREEN = HexColor('#dcfce7')
LIGHT_RED = HexColor('#fee2e2')
LIGHT_ORANGE = HexColor('#ffedd5')
WHITE = HexColor('#ffffff')

# Output path
OUTPUT = os.path.expanduser('~/Desktop/Formosa-ESG-2026-壓力測試報告-R2.pdf')

def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'CJKTitle', fontName='STSong-Light', fontSize=22,
        leading=28, alignment=TA_CENTER, textColor=NAVY,
        spaceAfter=6*mm
    ))
    styles.add(ParagraphStyle(
        'CJKSubtitle', fontName='STSong-Light', fontSize=12,
        leading=16, alignment=TA_CENTER, textColor=GRAY,
        spaceAfter=10*mm
    ))
    styles.add(ParagraphStyle(
        'CJKHeading', fontName='STSong-Light', fontSize=16,
        leading=22, textColor=NAVY, spaceAfter=4*mm, spaceBefore=6*mm
    ))
    styles.add(ParagraphStyle(
        'CJKHeading2', fontName='STSong-Light', fontSize=13,
        leading=18, textColor=BLUE, spaceAfter=3*mm, spaceBefore=4*mm
    ))
    styles.add(ParagraphStyle(
        'CJKBody', fontName='STSong-Light', fontSize=10,
        leading=16, textColor=NAVY, spaceAfter=3*mm
    ))
    styles.add(ParagraphStyle(
        'CJKSmall', fontName='STSong-Light', fontSize=8.5,
        leading=13, textColor=GRAY, spaceAfter=2*mm
    ))
    styles.add(ParagraphStyle(
        'CJKNote', fontName='STSong-Light', fontSize=9,
        leading=14, textColor=ORANGE, spaceAfter=3*mm,
        leftIndent=10*mm, borderPadding=3*mm
    ))
    return styles

def make_table(data, col_widths, header_color=NAVY):
    """Create a styled table."""
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('FONTNAME', (0, 0), (-1, -1), 'STSong-Light'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def build_report():
    styles = build_styles()
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=20*mm, bottomMargin=20*mm
    )
    story = []
    W = A4[0] - 36*mm  # usable width

    # ── Page 1: Title + Conclusion ──
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph('Formosa ESG 2026', styles['CJKTitle']))
    story.append(Paragraph(
        u'\u7b2c\u4e8c\u8f2a\u58d3\u529b\u6e2c\u8a66\u5831\u544a\u2002\u2014\u2002\u884c\u70ba\u5c0e\u5411\u6e2c\u8a66',
        styles['CJKTitle']
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'\u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u2002\u2014\u2002\u6253\u5361\u7cfb\u7d71\u96f2\u7aef\u58d3\u529b\u6e2c\u8a66',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u65e5\u671f\uff1a2026-03-26\u2002|\u2002\u67b6\u69cb\uff1aCloudflare Workers + KV Buffer + D1',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6\u2002|\u2002\u5831\u544a\u7522\u751f\uff1aClaude Code',
        styles['CJKSubtitle']
    ))

    # ── Conclusion box on page 1 ──
    story.append(Spacer(1, 6*mm))
    # Conclusion heading
    conclusion_title = ParagraphStyle(
        'ConcTitle', fontName='STSong-Light', fontSize=15,
        leading=20, alignment=TA_CENTER, textColor=NAVY,
        spaceAfter=4*mm
    )
    story.append(Paragraph(u'\u2605 \u7d50\u8ad6', conclusion_title))

    # Conclusion content in a boxed table
    conclusion_lines = [
        u'\u73fe\u6709\u67b6\u69cb\u53ef\u4ee5\u61c9\u4ed8 99% \u7684\u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u5834\u666f\u3002',
        u'',
        u'\u2022 \u7a69\u614b\u5bb9\u91cf\uff1a800 VU\uff08\u6210\u529f\u7387 99.99%\uff09',
        u'\u2022 \u6301\u7e8c\u627f\u8f09\u4e0a\u9650\uff1a1,000 VU\uff08\u6210\u529f\u7387 99.7%\uff09',
        u'\u2022 \u8d77\u99d5\u7206\u767c\uff1a3,000 VU \u53ef\u627f\u53d7\uff08\u6210\u529f\u7387 91%\uff09',
        u'\u2022 \u96f6 5xx \u932f\u8aa4\uff1aWorker \u5168\u7a0b\u672a\u5d29\u6f70',
        u'',
        u'\u2192 4/12 \u8d77\u99d5\u7121\u9700\u7dca\u6025\u8abf\u6574\uff0c\u50c5\u6975\u7aef\u5c16\u5cf0\u9700\u8a55\u4f30\u64f4\u5c55\u65b9\u6848\u3002',
    ]
    conclusion_body = ParagraphStyle(
        'ConcBody', fontName='STSong-Light', fontSize=11,
        leading=18, alignment=TA_CENTER, textColor=NAVY,
    )
    conclusion_left = ParagraphStyle(
        'ConcLeft', fontName='STSong-Light', fontSize=11,
        leading=18, alignment=TA_LEFT, textColor=NAVY,
    )
    conc_items = []
    for line in conclusion_lines:
        if line.startswith(u'\u2022') or line.startswith(u'\u2192'):
            conc_items.append([Paragraph(line, conclusion_left)])
        elif line == '':
            conc_items.append([Spacer(1, 2*mm)])
        else:
            conc_items.append([Paragraph(line, conclusion_body)])

    conc_table = Table(conc_items, colWidths=[W * 0.8])
    conc_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.5, BLUE),
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#eff6ff')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(conc_table)

    story.append(PageBreak())

    # ── Page 2: Executive Summary ──
    story.append(Paragraph(u'\u4e00\u3001\u57f7\u884c\u6458\u8981', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u672c\u8f2a\u6e2c\u8a66\u63a1\u7528\u884c\u70ba\u5c0e\u5411\u65b9\u6cd5\uff0c\u6a21\u64ec\u771f\u5be6\u4e16\u754c\u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u60c5\u5883\uff1a'
        u'\u7a69\u614b\u57fa\u7dda\u3001\u6301\u7e8c\u627f\u8f09\u3001\u4e8b\u4ef6\u578b\u5c16\u5cf0\u3001\u6ce2\u6d6a\u6d41\u91cf\u3001\u53ca\u7206\u91cf\u5f8c\u5fa9\u539f\u3002'
        u'\u5171\u57f7\u884c 7 \u7d44\u5834\u666f\uff0c\u6db5\u84cb 300\u20133500 VU \u7bc4\u570d\u3002',
        styles['CJKBody']
    ))

    # Summary table
    summary_data = [
        [u'\u5834\u666f', u'\u985e\u578b', u'\u5cf0\u503c VU', u'\u6210\u529f\u7387', 'P95', u'\u7d50\u679c'],
        ['B-500', u'\u7a69\u614b\u57fa\u7dda', '500', '100%', '821ms', u'\u2705 PASS'],
        ['B-800', u'\u7a69\u614b\u57fa\u7dda', '800', '99.99%', '946ms', u'\u2705 PASS'],
        ['ST-1000', u'\u6301\u7e8c\u627f\u8f09', '1,000', '99.70%', '1,424ms', u'\u2705 PASS'],
        ['ST-1200', u'\u6301\u7e8c\u627f\u8f09', '1,200', '96.56%', '765ms', u'\u274c FAIL'],
        ['BR-3000', u'\u4e8b\u4ef6\u578b\u5c16\u5cf0', '3,000', '91.13%', '776ms', u'\u2705 PASS'],
        ['WV-3Cycle', u'\u6ce2\u6d6a\u6d41\u91cf', '3,500', '81.85%', '1,850ms', u'\u274c FAIL'],
        ['RC-AfterBurst', u'\u7206\u91cf\u5f8c\u5fa9\u539f', '3,000', '54.28%', '737ms', u'\u274c FAIL'],
    ]
    cw = [W*0.15, W*0.18, W*0.12, W*0.14, W*0.14, W*0.14]
    t = make_table(summary_data, cw)
    # Color pass/fail rows
    for i in range(1, len(summary_data)):
        row = summary_data[i]
        if 'PASS' in row[-1]:
            t.setStyle(TableStyle([('BACKGROUND', (-1, i), (-1, i), LIGHT_GREEN)]))
        else:
            t.setStyle(TableStyle([('BACKGROUND', (-1, i), (-1, i), LIGHT_RED)]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # Key findings
    story.append(Paragraph(u'\u4e8c\u3001\u95dc\u9375\u767c\u73fe', styles['CJKHeading']))
    findings = [
        u'\u2022 \u7a69\u614b\u57fa\u7dda\u5bb9\u91cf\uff1a800 VU \u4ee5\u4e0b\u53ef\u7a69\u5b9a\u904b\u884c\uff0c\u6210\u529f\u7387 \u2265 99.99%',
        u'\u2022 \u6301\u7e8c\u627f\u8f09\u4e0a\u9650\uff1a1,000 VU \u53ef\u7dad\u6301 5 \u5206\u9418\uff08\u6210\u529f\u7387 99.7%\uff09\uff0c1,200 VU \u958b\u59cb\u964d\u7d1a',
        u'\u2022 \u77ed\u6642\u9593\u7206\u767c\u8010\u53d7\u5ea6\u9ad8\uff1a3,000 VU \u7206\u767c\u53ef\u627f\u53d7\uff08\u6210\u529f\u7387 91.13%\uff09\uff0c\u56e0\u6301\u7e8c\u6642\u9593\u77ed',
        u'\u2022 \u591a\u6ce2\u6bb5\u885d\u64ca\u6311\u6230\u5927\uff1a\u4e09\u6ce2\u9023\u7e8c\u885d\u64ca\uff083,000\u21923,500\u21923,000 VU\uff09\u7d2f\u7a4d\u640d\u8017\u5c0e\u81f4 18.15% \u932f\u8aa4\u7387',
        u'\u2022 \u96f6 5xx \u932f\u8aa4\uff1a\u6240\u6709\u5931\u6557\u5747\u70ba timeout\uff0cWorker \u672c\u8eab\u672a\u5d29\u6f70',
        u'\u2022 \u5ba2\u6236\u7aef\u74f6\u9838\uff1aMacBook Air + \u624b\u6a5f\u71b1\u9ede\u7684\u7db2\u8def\u983b\u5bec\u5728\u9ad8 VU \u6642\u6210\u70ba\u9650\u5236\u56e0\u5b50',
    ]
    for f in findings:
        story.append(Paragraph(f, styles['CJKBody']))
    story.append(PageBreak())

    # ── Page 3: Detailed results ──
    story.append(Paragraph(u'\u4e09\u3001\u5404\u5834\u666f\u8a73\u7d30\u6578\u64da', styles['CJKHeading']))

    # -- Baseline --
    story.append(Paragraph(u'3.1 Baseline \u7a69\u614b\u57fa\u7dda\uff08B-500 / B-800\uff09', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u78ba\u8a8d\u7cfb\u7d71\u5728\u5b89\u5168\u5bb9\u91cf\u5167\u7684\u8868\u73fe\u3002'
        u'\u5169\u7d44\u5747\u4ee5\u7a69\u5b9a VU \u6301\u7e8c 10 \u5206\u9418\uff0c\u6a21\u64ec\u6b63\u5e38\u6d41\u91cf\u3002',
        styles['CJKBody']
    ))
    bl_data = [
        [u'\u6307\u6a19', 'B-500', 'B-800', u'\u904e\u95be\u503c'],
        [u'\u6210\u529f\u7387', '100%', '99.99%', u'\u2265 99.5%'],
        ['P95', '821ms', '946ms', u'\u2264 1,000ms'],
        ['P99', u'< 2,000ms', u'< 2,000ms', u'\u2264 2,000ms'],
        [u'\u5224\u5b9a', u'\u2705 PASS', u'\u2705 PASS', ''],
    ]
    cw2 = [W*0.2, W*0.22, W*0.22, W*0.22]
    story.append(make_table(bl_data, cw2))
    story.append(Spacer(1, 4*mm))

    # -- Steady --
    story.append(Paragraph(u'3.2 Steady \u6301\u7e8c\u627f\u8f09\uff08ST-1000 / ST-1200\uff09', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u627e\u51fa\u7cfb\u7d71\u6301\u7e8c\u904b\u884c\u7684\u4e0a\u9650\u3002'
        u'\u4ee5\u56fa\u5b9a VU \u6301\u7e8c 5 \u5206\u9418\uff0c\u6a21\u64ec\u5c16\u5cf0\u6642\u6bb5\u6301\u7e8c\u6d41\u91cf\u3002',
        styles['CJKBody']
    ))
    st_data = [
        [u'\u6307\u6a19', 'ST-1000', 'ST-1200', u'\u904e\u95be\u503c'],
        [u'\u7e3d\u8acb\u6c42', u'~150K', '149,880', ''],
        [u'\u6210\u529f\u7387', '99.70%', '96.56%', u'\u2265 97%'],
        ['P95', '1,424ms', '765ms', u'\u2264 1,500ms'],
        [u'\u5931\u6557\u6578', u'~450', '5,156', ''],
        [u'\u5224\u5b9a', u'\u2705 PASS', u'\u274c FAIL', ''],
    ]
    story.append(make_table(st_data, cw2))
    story.append(Paragraph(
        u'\u2192 ST-1200 \u6301\u7e8c 5 \u5206\u9418\u5f8c\u932f\u8aa4\u7387\u7a81\u7834 3%\uff0c\u78ba\u8a8d 1,000 VU \u70ba\u6301\u7e8c\u627f\u8f09\u5b89\u5168\u4e0a\u9650\u3002',
        styles['CJKNote']
    ))
    story.append(Spacer(1, 4*mm))

    # -- Burst --
    story.append(Paragraph(u'3.3 Burst \u4e8b\u4ef6\u578b\u5c16\u5cf0\uff08BR-3000\uff09', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6a21\u64ec\u8d77\u99d5\u77ac\u9593\u5927\u91cf\u7528\u6236\u540c\u6642\u6253\u5361\u3002'
        u'10 \u79d2\u5167\u5f9e 100 \u885d\u5230 3,000 VU\uff0c\u7dad\u6301 30 \u79d2\u5f8c\u56de\u843d\u3002',
        styles['CJKBody']
    ))
    br_data = [
        [u'\u6307\u6a19', 'BR-3000', u'\u904e\u95be\u503c'],
        [u'\u7e3d\u8acb\u6c42', '109,790', ''],
        [u'\u6210\u529f', '100,049', ''],
        [u'\u5931\u6557', '9,741', ''],
        [u'\u6210\u529f\u7387', '91.13%', u'\u2265 90%'],
        ['P95', '776ms', u'\u2264 2,000ms'],
        ['Timeout', '9,741', ''],
        ['5xx', '0', ''],
        [u'\u5224\u5b9a', u'\u2705 PASS', ''],
    ]
    cw3 = [W*0.25, W*0.3, W*0.25]
    story.append(make_table(br_data, cw3))
    story.append(Paragraph(
        u'\u2192 \u7206\u767c\u5834\u666f\u53cd\u800c\u6bd4\u6301\u7e8c\u8ca0\u8f09\u597d\uff0c\u56e0\u70ba\u6301\u7e8c\u6642\u9593\u77ed\uff0cKV \u7de9\u885d\u5c64\u6709\u6548\u5438\u6536\u5c16\u5cf0\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ── Page 4: Wave + Recovery ──
    story.append(Paragraph(u'3.4 Wave \u6ce2\u6d6a\u6d41\u91cf\uff08WV-3Cycle\uff09', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6a21\u64ec\u9032\u9999\u9014\u4e2d\u9014\u7d93\u5404\u5edf\u5b87\u7684\u591a\u6ce2\u6bb5\u6d41\u91cf\u3002'
        u'\u4e09\u6ce2\u9023\u7e8c\u885d\u64ca\uff081,000\u21923,000\u30011,200\u21923,500\u30011,500\u21923,000 VU\uff09\uff0c'
        u'\u6ce2\u9593\u4f4e\u8c37 300 VU\u3002',
        styles['CJKBody']
    ))
    wv_data = [
        [u'\u6307\u6a19', 'WV-3Cycle', u'\u904e\u95be\u503c'],
        [u'\u7e3d\u8acb\u6c42', '222,814', ''],
        [u'\u6210\u529f', '182,373', ''],
        [u'\u5931\u6557', '40,441', ''],
        [u'\u6210\u529f\u7387', '81.85%', u'\u2265 88%'],
        ['P95', '1,850ms', u'\u2264 2,500ms'],
        ['Timeout', '40,441', ''],
        ['5xx', '0', ''],
        [u'\u5224\u5b9a', u'\u274c FAIL', ''],
    ]
    story.append(make_table(wv_data, cw3))
    story.append(Paragraph(
        u'\u2192 \u7b2c\u4e8c\u6ce2\u5cf0\u503c 3,500 VU \u8d85\u904e\u55ae\u4e00\u7206\u767c\u53ef\u627f\u53d7\u7bc4\u570d\uff0c'
        u'\u4e14\u6ce2\u9593\u4f4e\u8c37\u50c5 30 \u79d2\u4e0d\u8db3\u4ee5\u5b8c\u5168\u6062\u5fa9\uff0c\u7d2f\u7a4d\u640d\u8017\u5c0e\u81f4\u6574\u9ad4\u932f\u8aa4\u7387\u5076\u9ad8\u3002'
        u'\u6b64\u5916\uff0c\u5ba2\u6236\u7aef\u7db2\u8def\u74f6\u9838\u4e5f\u653e\u5927\u4e86 timeout \u6578\u91cf\u3002',
        styles['CJKNote']
    ))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'3.5 Recovery \u7206\u91cf\u5f8c\u5fa9\u539f\uff08RC-AfterBurst\uff09', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6e2c\u8a66\u7cfb\u7d71\u5728\u7206\u91cf\u5f8c\u80fd\u5426\u5feb\u901f\u6062\u5fa9\u6b63\u5e38\u670d\u52d9\u3002'
        u'\u5148\u6253\u4e00\u6ce2 3,000 VU \u7206\u767c\uff0c\u51b7\u537b 60 \u79d2\u5f8c\u8dd1 500 VU \u57fa\u7dda\uff0c\u518d\u964d\u5230 300 VU \u89c0\u5bdf\u3002',
        styles['CJKBody']
    ))
    rc_data = [
        [u'\u6307\u6a19', 'RC-AfterBurst', u'\u904e\u95be\u503c'],
        [u'\u7e3d\u8acb\u6c42', '36,443', ''],
        [u'\u6210\u529f', '19,781', ''],
        [u'\u5931\u6557', '16,662', ''],
        [u'\u6574\u9ad4\u6210\u529f\u7387', '54.28%', u'\u2265 99%'],
        ['P95', '737ms', u'\u2264 1,500ms'],
        ['Timeout', '16,662', ''],
        ['5xx', '0', ''],
        [u'\u5224\u5b9a', u'\u274c FAIL', ''],
    ]
    story.append(make_table(rc_data, cw3))
    story.append(Paragraph(
        u'\u2192 \u6574\u9ad4\u6210\u529f\u7387\u504f\u4f4e\u662f\u56e0\u70ba\u7206\u767c\u968e\u6bb5\u7684 timeout \u88ab\u8a08\u5165\u7e3d\u9ad4\u6307\u6a19\u3002'
        u'P95 = 737ms \u986f\u793a\u6210\u529f\u7684\u8acb\u6c42\u5ef6\u9072\u5f88\u4f4e\uff0c\u8868\u660e Worker \u672c\u8eab\u6062\u5fa9\u6b63\u5e38\u3002'
        u'\u771f\u6b63\u7684\u74f6\u9838\u662f\u5ba2\u6236\u7aef\u7db2\u8def\u5728\u9ad8 VU \u6642\u98fd\u548c\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ── Page 5: Architecture + Real-world mapping ──
    story.append(Paragraph(u'\u56db\u3001\u67b6\u69cb\u8207\u771f\u5be6\u5834\u666f\u5c0d\u7167', styles['CJKHeading']))

    story.append(Paragraph(u'4.1 KV Buffer \u67b6\u69cb\u512a\u52e2', styles['CJKHeading2']))
    story.append(Paragraph(
        u'\u7b2c\u4e00\u8f2a\u6e2c\u8a66\u8b49\u5be6\u67b6\u69cb\u6f14\u9032\u6548\u679c\uff1a',
        styles['CJKBody']
    ))
    arch_data = [
        [u'\u67b6\u69cb', u'500 VU \u6210\u529f\u7387', u'\u8aaa\u660e'],
        [u'D1 \u76f4\u5beb', '35%', u'D1 \u55ae\u4e00\u5beb\u5165\u8005\u9650\u5236\u70ba\u74f6\u9838'],
        [u'KV 3 \u6b21\u64cd\u4f5c', '1%', u'3 \u6b21 KV \u8b80\u5beb\u53cd\u800c\u66f4\u6162'],
        [u'KV 1 \u6b21\u64cd\u4f5c', '100%', u'\u55ae\u4e00 KV.put\uff0cCron \u5237\u5165 D1'],
    ]
    cw4 = [W*0.25, W*0.25, W*0.4]
    story.append(make_table(arch_data, cw4))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'4.2 \u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u5be6\u969b\u898f\u6a21\u5c0d\u7167', styles['CJKHeading2']))
    story.append(Paragraph(
        u'2025 \u5e74\u767b\u8a18\u4eba\u6578\uff1a329,000 \u4eba\uff086 \u5e74\u6210\u9577 7 \u500d\uff09\u3002'
        u'\u4ee5\u4e0b\u5206\u6790\u5be6\u969b\u540c\u6642\u6253\u5361\u4eba\u6578\u8207\u6e2c\u8a66\u7d50\u679c\u7684\u5c0d\u61c9\uff1a',
        styles['CJKBody']
    ))
    real_data = [
        [u'\u60c5\u5883', u'\u9810\u4f30\u540c\u6642\u6253\u5361', u'\u5c0d\u61c9\u6e2c\u8a66', u'\u7d50\u679c'],
        [u'\u4e00\u822c\u884c\u9032', u'200\u2013500 \u4eba', 'B-500', u'\u2705 \u7a69\u5b9a'],
        [u'\u7d93\u904e\u5927\u5edf', u'500\u20131,000 \u4eba', 'ST-1000', u'\u2705 \u53ef\u627f\u53d7'],
        [u'\u8d77\u99d5\u77ac\u9593', u'2,000\u20133,000 \u4eba', 'BR-3000', u'\u2705 91% \u6210\u529f'],
        [u'\u5a92\u9ad4\u5c0e\u6d41\u5c16\u5cf0', u'3,000\u20135,000 \u4eba', u'WV / BR-5000', u'\u26a0\ufe0f \u9700\u8a55\u4f30'],
    ]
    cw5 = [W*0.2, W*0.22, W*0.2, W*0.22]
    story.append(make_table(real_data, cw5))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(
        u'\u2192 \u7d50\u8ad6\uff1a\u73fe\u6709\u67b6\u69cb\u53ef\u4ee5\u61c9\u4ed8 99% \u7684\u9032\u9999\u5834\u666f\u3002'
        u'\u50c5\u5728\u6975\u7aef\u5c16\u5cf0\uff08\u5a92\u9ad4\u63a8\u64ad\u5c0e\u6d41\uff09\u6642\u53ef\u80fd\u9700\u8981\u984d\u5916\u63aa\u65bd\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ── Page 6: Recommendations + Glossary ──
    story.append(Paragraph(u'\u4e94\u3001\u5efa\u8b70\u8207\u4e0b\u4e00\u6b65', styles['CJKHeading']))
    recs = [
        u'\u2022 \u77ed\u671f\uff1a\u73fe\u6709\u67b6\u69cb\u8db3\u4ee5\u61c9\u4ed8 4/12 \u8d77\u99d5\uff0c\u7121\u9700\u7dca\u6025\u8abf\u6574',
        u'\u2022 \u76e3\u63a7\uff1a\u5efa\u8b70\u5728\u6d3b\u52d5\u671f\u9593\u76e3\u63a7 KV \u5beb\u5165\u91cf\u8207 Cron \u5237\u5165\u72c0\u614b',
        u'\u2022 \u64f4\u5c55\u65b9\u6848\uff1a\u82e5\u9700\u652f\u6490 3,000+ VU \u6301\u7e8c\u8ca0\u8f09\uff0c\u53ef\u8003\u616e\uff1a',
        u'  \u2013 Durable Objects \u53d6\u4ee3 D1 \u55ae\u4e00\u5beb\u5165\u8005',
        u'  \u2013 \u5206\u5340 KV key \u964d\u4f4e\u71b1\u9ede\u58d3\u529b',
        u'  \u2013 \u591a\u5340\u57df\u90e8\u7f72\u5206\u6563\u8ca0\u8f09',
        u'\u2022 \u6e2c\u8a66\u74b0\u5883\uff1a\u5efa\u8b70\u672a\u4f86\u4f7f\u7528\u96f2\u7aef k6 Cloud \u6216\u591a\u6a5f\u5206\u6563\u6e2c\u8a66\uff0c\u907f\u514d\u5ba2\u6236\u7aef\u74f6\u9838',
    ]
    for r in recs:
        story.append(Paragraph(r, styles['CJKBody']))
    story.append(Spacer(1, 8*mm))

    # Glossary
    story.append(Paragraph(u'\u516d\u3001\u8853\u8a9e\u8868', styles['CJKHeading']))
    glossary = [
        [u'\u8853\u8a9e', u'\u8aaa\u660e'],
        ['VU (Virtual User)', u'\u865b\u64ec\u7528\u6236\uff0c\u4ee3\u8868\u4e00\u500b\u540c\u6642\u9023\u7dda\u7684\u5ba2\u6236\u7aef'],
        ['P95 / P99', u'\u7b2c 95/99 \u767e\u5206\u4f4d\u5ef6\u9072\uff0c\u8868\u793a 95%/99% \u7684\u8acb\u6c42\u5728\u6b64\u6642\u9593\u5167\u5b8c\u6210'],
        ['RPS', u'Requests Per Second\uff0c\u6bcf\u79d2\u8acb\u6c42\u6578'],
        ['KV', u'Cloudflare Workers KV\uff0c\u5168\u7403\u5206\u6563\u5f0f\u9375\u503c\u5b58\u5132'],
        ['D1', u'Cloudflare D1\uff0c\u57fa\u65bc SQLite \u7684\u7121\u4f3a\u670d\u5668\u8cc7\u6599\u5eab'],
        ['Timeout', u'\u8acb\u6c42\u8d85\u904e 10 \u79d2\u672a\u56de\u61c9\uff0c\u8996\u70ba\u5931\u6557'],
        ['Burst', u'\u77ed\u6642\u9593\u5167\u5927\u91cf\u8acb\u6c42\u6e67\u5165\u7684\u5c16\u5cf0\u6d41\u91cf\u6a21\u5f0f'],
        ['Wave', u'\u591a\u6ce2\u6bb5\u9593\u6b47\u6027\u6d41\u91cf\uff0c\u6a21\u64ec\u9032\u9999\u9014\u4e2d\u7d93\u904e\u5404\u7ad9'],
        ['Recovery', u'\u7206\u91cf\u5f8c\u7cfb\u7d71\u6062\u5fa9\u6b63\u5e38\u670d\u52d9\u7684\u80fd\u529b'],
    ]
    cw6 = [W*0.3, W*0.6]
    story.append(make_table(glossary, cw6))
    story.append(Spacer(1, 10*mm))

    story.append(Paragraph(
        u'\u2500' * 60,
        styles['CJKSmall']
    ))
    story.append(Paragraph(
        u'\u5831\u544a\u7522\u751f\uff1aClaude Code\u2002|\u2002\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6\u2002|\u2002'
        u'\u65e5\u671f\uff1a2026-03-26',
        styles['CJKSmall']
    ))

    doc.build(story)
    print(f'Report saved to: {OUTPUT}')

if __name__ == '__main__':
    build_report()
