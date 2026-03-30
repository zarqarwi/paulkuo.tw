#!/usr/bin/env python3
"""Formosa ESG 2026 — 第三輪驗證測試報告 PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import os

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

NAVY = HexColor('#1a2744')
BLUE = HexColor('#2563eb')
GREEN = HexColor('#16a34a')
RED = HexColor('#dc2626')
ORANGE = HexColor('#ea580c')
GRAY = HexColor('#6b7280')
LIGHT_GRAY = HexColor('#f3f4f6')
LIGHT_GREEN = HexColor('#dcfce7')
LIGHT_RED = HexColor('#fee2e2')
WHITE = HexColor('#ffffff')

OUTPUT = os.path.expanduser('~/Desktop/Formosa-ESG-2026-驗證測試報告-R3.pdf')

def build_styles():
    styles = getSampleStyleSheet()
    for name, sz, ld, clr, align, sa, sb in [
        ('CJKTitle', 22, 28, NAVY, TA_CENTER, 6, 0),
        ('CJKSubtitle', 12, 16, GRAY, TA_CENTER, 10, 0),
        ('CJKHeading', 16, 22, NAVY, TA_LEFT, 4, 6),
        ('CJKHeading2', 13, 18, BLUE, TA_LEFT, 3, 4),
        ('CJKBody', 10, 16, NAVY, TA_LEFT, 3, 0),
        ('CJKSmall', 8.5, 13, GRAY, TA_LEFT, 2, 0),
        ('CJKNote', 9, 14, ORANGE, TA_LEFT, 3, 0),
        ('CJKAlert', 10, 16, RED, TA_LEFT, 3, 0),
    ]:
        styles.add(ParagraphStyle(
            name, fontName='STSong-Light', fontSize=sz,
            leading=ld, textColor=clr, alignment=align,
            spaceAfter=sa*mm, spaceBefore=sb*mm,
            leftIndent=10*mm if name == 'CJKNote' else 0
        ))
    return styles

def make_table(data, col_widths, header_color=NAVY):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'STSong-Light'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t

def build_report():
    styles = build_styles()
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=20*mm, bottomMargin=20*mm)
    story = []
    W = A4[0] - 36*mm

    # ── Page 1: Title + Critical Finding ──
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph('Formosa ESG 2026', styles['CJKTitle']))
    story.append(Paragraph(
        u'\u7b2c\u4e09\u8f2a\u9a57\u8b49\u6e2c\u8a66\u5831\u544a\u2002\u2014\u2002\u771f\u5be6\u4e16\u754c\u98a8\u96aa\u9a57\u8b49',
        styles['CJKTitle']
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'\u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u2002\u2014\u2002\u6253\u5361\u7cfb\u7d71 D1 \u8cc7\u6599\u5b8c\u6574\u6027\u8207\u591a\u7aef\u9ede\u6df7\u5408\u8ca0\u8f09\u6e2c\u8a66',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u65e5\u671f\uff1a2026-03-26\u2002|\u2002\u67b6\u69cb\uff1aCloudflare Workers + D1 (SQLite)',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6 + Wrangler D1 Query\u2002|\u2002\u5831\u544a\u7522\u751f\uff1aClaude Code',
        styles['CJKSubtitle']
    ))

    # Critical finding box
    story.append(Spacer(1, 6*mm))
    conc_style_c = ParagraphStyle('cc', fontName='STSong-Light', fontSize=15,
        leading=20, alignment=TA_CENTER, textColor=RED, spaceAfter=4*mm)
    story.append(Paragraph(u'\u26a0\ufe0f \u91cd\u5927\u767c\u73fe', conc_style_c))

    alert_items = [
        [Paragraph(u'\u767c\u73fe\u4e09\u500b\u751f\u7522\u74b0\u5883\u98a8\u96aa\uff0c\u5fc5\u9808\u5728 4/12 \u524d\u8655\u7406\uff1a',
            ParagraphStyle('ab', fontName='STSong-Light', fontSize=11, leading=18, alignment=TA_CENTER, textColor=RED))],
        [Spacer(1, 2*mm)],
        [Paragraph(u'\u2776 D1 \u5beb\u5165\u5ef6\u9072\u56b4\u91cd\uff1a\u56de\u61c9 200 \u5f8c\u8cc7\u6599\u9700\u6578\u5206\u9418\u624d\u5beb\u5165',
            ParagraphStyle('al', fontName='STSong-Light', fontSize=11, leading=18, textColor=NAVY))],
        [Paragraph(u'\u2777 D1 \u7522\u751f\u91cd\u8907\u5beb\u5165\uff1a24,837 \u7b46\u8acb\u6c42\u7522\u751f 37,462 \u7b46\u8a18\u9304\uff08+51%\uff09',
            ParagraphStyle('al2', fontName='STSong-Light', fontSize=11, leading=18, textColor=NAVY))],
        [Paragraph(u'\u2778 \u6df7\u5408\u8ca0\u8f09\u4e0b\u5beb\u5165\u5b8c\u5168\u6d88\u5931\uff1aData API \u91cd\u8b80\u5c0e\u81f4 72,300 \u7b46\u6253\u5361 D1 \u8a18\u9304 = 0',
            ParagraphStyle('al3', fontName='STSong-Light', fontSize=11, leading=18, textColor=NAVY))],
    ]
    conc_t = Table(alert_items, colWidths=[W * 0.85])
    conc_t.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 2, RED),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_RED),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(conc_t)
    story.append(PageBreak())

    # ── Page 2: Test 1 — DI-500 ──
    story.append(Paragraph(u'\u4e00\u3001DI-500\uff1aD1 \u8cc7\u6599\u5b8c\u6574\u6027\u9a57\u8b49', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u78ba\u8a8d checkin API \u56de HTTP 200 \u7684\u8acb\u6c42\u662f\u5426\u771f\u7684\u5beb\u5165 D1\u3002'
        u'500 VU \u6301\u7e8c 2 \u5206\u9418\uff0c\u4e8b\u5f8c\u7528 Wrangler \u67e5\u8a62 D1 \u5be6\u969b\u8a18\u9304\u6578\u3002',
        styles['CJKBody']
    ))

    # DI results table
    di_data = [
        [u'\u6307\u6a19', u'\u6578\u503c', u'\u8aaa\u660e'],
        [u'\u7e3d\u8acb\u6c42', '24,851', ''],
        ['HTTP 200', '24,837', u'\u56de\u61c9\u6210\u529f\u7684\u8acb\u6c42'],
        ['Timeout', '14', u'\u50c5 0.06% \u5931\u6557'],
        ['5xx', '0', u'Worker \u672a\u5d29\u6f70'],
        ['P95', '1,711ms', u'\u504f\u9ad8\uff08\u57fa\u7dda\u70ba 821ms\uff09'],
        ['', '', ''],
        [u'D1 \u8a18\u9304\u6578\uff08\u5373\u6642\uff09', '10,388', u'\u6e2c\u8a66\u7d50\u675f\u5f8c\u7acb\u5373\u67e5\u8a62'],
        [u'D1 \u8a18\u9304\u6578\uff08+5\u5206\uff09', '22,310', u'\u6301\u7e8c\u589e\u9577\u4e2d'],
        [u'D1 \u8a18\u9304\u6578\uff08+10\u5206\uff09', '37,462', u'\u8d85\u904e HTTP 200 \u6578\uff01'],
        [u'Unique user_id', '21,747', u'\u53bb\u91cd\u5f8c\u7684\u5be6\u969b\u7528\u6236\u6578'],
        [u'\u91cd\u8907\u5beb\u5165', '~15,715', u'37,462 - 21,747 = \u91cd\u8907\u8a18\u9304'],
    ]
    cw3 = [W*0.25, W*0.2, W*0.45]
    story.append(make_table(di_data, cw3))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(u'DI-500 \u554f\u984c\u5206\u6790', styles['CJKHeading2']))
    di_issues = [
        u'\u2022 D1 \u5beb\u5165\u5ef6\u9072\uff1a\u5f9e\u6e2c\u8a66\u7d50\u675f\u5230\u8cc7\u6599\u5b8c\u6574\u5beb\u5165\uff0c\u5ef6\u9072\u8d85\u904e 10 \u5206\u9418',
        u'\u2022 \u91cd\u8907\u5beb\u5165\uff1a\u540c\u4e00\u7b46 checkin \u88ab\u5beb\u5165 D1 \u591a\u6b21\uff08\u5e73\u5747 1.7 \u6b21\uff09',
        u'\u2022 \u53ef\u80fd\u539f\u56e0\uff1aD1 WAL (Write-Ahead Log) \u5728\u9ad8\u4e26\u767c\u4e0b checkpoint \u7570\u5e38\uff0c\u5c0e\u81f4\u91cd\u64ad',
        u'\u2022 \u751f\u7522\u5f71\u97ff\uff1a\u6253\u5361\u6578\u64da\u53ef\u80fd\u91cd\u8907\u8a08\u7b97\uff0c\u5f71\u97ff\u7b49\u7d1a\u3001\u91cc\u7a0b\u3001\u78b3\u8db3\u8de1\u7d71\u8a08',
    ]
    for line in di_issues:
        story.append(Paragraph(line, styles['CJKBody']))

    story.append(Paragraph(
        u'\u2192 \u5efa\u8b70\uff1a\u5728 checkin INSERT \u524d\u52a0 UNIQUE \u7d04\u675f\u6216\u7528 INSERT OR IGNORE \u907f\u514d\u91cd\u8907\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ── Page 3: Test 2 — MX-500 / MX-1000 ──
    story.append(Paragraph(u'\u4e8c\u3001MX-500 / MX-1000\uff1a\u591a\u7aef\u9ede\u6df7\u5408\u8ca0\u8f09', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6a21\u64ec\u771f\u5be6\u4f7f\u7528\u60c5\u5883\uff0c\u540c\u6642\u767c\u9001 checkin\u3001\u67e5\u8a62 Data API\u3001\u67e5\u8a62 User API\u3002'
        u'\u6bd4\u4f8b\uff1a60% checkin / 30% data / 10% user\u3002',
        styles['CJKBody']
    ))

    mx_data = [
        [u'\u6307\u6a19', 'MX-500', 'MX-1000'],
        [u'\u7e3d\u8acb\u6c42', '41,138', '79,327'],
        [u'\u6574\u9ad4\u6210\u529f\u7387', '59.88%', '60.18%'],
        ['', '', ''],
        [u'Checkin \u6210\u529f', '24,597', '47,703'],
        [u'Checkin \u5931\u6557', '1', '127'],
        [u'Checkin P95', '1,404ms', '2,151ms'],
        ['', '', ''],
        [u'Data API \u6210\u529f', '7', '8'],
        [u'Data API \u5931\u6557', '12,295', '23,669'],
        [u'Data API \u5931\u6557\u7387', '99.9%', '99.97%'],
        ['', '', ''],
        [u'User API \u6210\u529f', '28', '28'],
        [u'User API \u5931\u6557', '4,210', '7,792'],
        ['', '', ''],
        ['5xx \u932f\u8aa4', '15,276', '30,111'],
        [u'D1 \u5beb\u5165\u8a18\u9304', '0', '0'],
    ]
    cw2 = [W*0.3, W*0.28, W*0.28]
    t = make_table(mx_data, cw2)
    # Highlight critical rows
    t.setStyle(TableStyle([
        ('BACKGROUND', (-2, -1), (-1, -1), LIGHT_RED),
        ('TEXTCOLOR', (-2, -1), (-1, -1), RED),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(u'\u6df7\u5408\u8ca0\u8f09\u554f\u984c\u5206\u6790', styles['CJKHeading2']))
    mx_issues = [
        u'\u2022 Data API \u57f7\u884c 5 \u6b21 D1 \u67e5\u8a62\uff08COUNT + SELECT 200 \u7b46 + \u5716\u8868\u8cc7\u6599\uff09\uff0c\u7af6\u722d D1 \u55ae\u4e00\u5beb\u5165\u8005\u9396',
        u'\u2022 User API \u57f7\u884c 3\u20134 \u6b21 D1 \u67e5\u8a62\uff08\u7528\u6236\u8cc7\u6599 + GPS \u9ede\u6b77\u53f2 + \u554f\u5377\uff09',
        u'\u2022 Checkin \u672c\u8eab\u6bcf\u6b21\u57f7\u884c 3\u20134 \u6b21 D1 \u64cd\u4f5c\uff08migration + rate limit + INSERT + COUNT\uff09',
        u'\u2022 500 VU \u6df7\u5408\u8ca0\u8f09 = \u6bcf\u79d2 ~500 \u6b21 D1 \u64cd\u4f5c\uff0c\u8d85\u904e D1 SQLite \u55ae\u57f7\u884c\u7dd2\u4e0a\u9650',
        u'\u2022 \u7d50\u679c\uff1aData/User API 5xx \u5d29\u6f70\uff0cCheckin \u56de 200 \u4f46\u8cc7\u6599\u672a\u5beb\u5165 D1',
    ]
    for line in mx_issues:
        story.append(Paragraph(line, styles['CJKBody']))

    story.append(Paragraph(
        u'\u2192 \u6700\u5371\u96aa\u7684\u767c\u73fe\uff1a72,300 \u7b46 Checkin \u56de HTTP 200\uff0c\u4f46 D1 \u8a18\u9304\u6578\u70ba 0\u3002'
        u'\u7528\u6236\u770b\u5230\u300c\u6253\u5361\u6210\u529f\u300d\u4f46\u8cc7\u6599\u5b8c\u5168\u4e1f\u5931\u3002',
        styles['CJKAlert']
    ))
    story.append(PageBreak())

    # ── Page 4: Root Cause + Fix Plan ──
    story.append(Paragraph(u'\u4e09\u3001\u6839\u56e0\u5206\u6790\u8207\u4fee\u5fa9\u65b9\u6848', styles['CJKHeading']))

    story.append(Paragraph(u'3.1 \u6839\u56e0\uff1aD1 SQLite \u55ae\u4e00\u5beb\u5165\u8005\u9650\u5236', styles['CJKHeading2']))
    root_cause = [
        u'\u2022 D1 \u57fa\u65bc SQLite\uff0c\u540c\u4e00\u6642\u9593\u53ea\u5141\u8a31\u4e00\u500b\u5beb\u5165\u64cd\u4f5c',
        u'\u2022 \u7576\u591a\u500b\u7aef\u9ede\u540c\u6642\u8b80\u5beb D1\uff0c\u5beb\u5165\u88ab\u8b80\u53d6\u963b\u585e\uff0c\u5c0e\u81f4\uff1a',
        u'  \u2013 .run() Promise \u89e3\u6790\u6210\u529f\u4f46\u5beb\u5165\u672a\u6301\u4e45\u5316\uff08D1 \u5167\u90e8\u4f47\u5217\u6ea2\u51fa\uff09',
        u'  \u2013 WAL checkpoint \u7570\u5e38\u5c0e\u81f4\u91cd\u64ad\uff0c\u7522\u751f\u91cd\u8907\u8a18\u9304',
        u'  \u2013 \u7576\u524d\u67b6\u69cb\u6c92\u6709 KV \u7de9\u885d\u5c64\uff0ccheckin \u76f4\u63a5\u5beb D1',
    ]
    for line in root_cause:
        story.append(Paragraph(line, styles['CJKBody']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(u'3.2 \u5efa\u8b70\u4fee\u5fa9\u65b9\u6848\uff08\u4f9d\u512a\u5148\u7d1a\uff09', styles['CJKHeading2']))

    fix_data = [
        [u'\u512a\u5148\u7d1a', u'\u4fee\u5fa9\u65b9\u6848', u'\u6548\u679c', u'\u5de5\u4f5c\u91cf'],
        ['[P0]', u'Checkin \u6539\u7528 KV Buffer + Cron \u5237\u5165 D1',
         u'\u6d88\u9664\u5beb\u5165\u5ef6\u9072\u3001\u907f\u514d D1 \u7af6\u722d', u'2\u20133 \u5c0f\u6642'],
        ['[P0]', u'formosa_gps_points \u52a0 UNIQUE(user_id, timestamp)',
         u'\u907f\u514d\u91cd\u8907\u5beb\u5165', u'30 \u5206\u9418'],
        ['[P1]', u'Data API \u52a0\u5feb\u53d6\uff08KV cache 60s\uff09',
         u'\u6e1b\u5c11 D1 \u8b80\u53d6\u58d3\u529b', u'1 \u5c0f\u6642'],
        ['[P1]', u'\u79fb\u9664 migrateFormosa() \u5728\u6bcf\u6b21 checkin \u57f7\u884c',
         u'\u6e1b\u5c11 1 \u6b21 D1 \u64cd\u4f5c', u'15 \u5206\u9418'],
        ['[P2]', u'Rate limit \u6539\u7528 KV \u8a08\u6578\u5668\u53d6\u4ee3 D1 COUNT',
         u'\u6e1b\u5c11 1 \u6b21 D1 \u8b80\u53d6', u'1 \u5c0f\u6642'],
    ]
    cw4 = [W*0.1, W*0.38, W*0.3, W*0.12]
    ft = make_table(fix_data, cw4)
    ft.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'STSong-Light'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(ft)
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'3.3 KV Buffer \u67b6\u69cb\u8aaa\u660e', styles['CJKHeading2']))
    kv_lines = [
        u'\u76ee\u524d\uff1aCheckin \u2192 D1 INSERT\uff08\u6bcf\u6b21 3\u20134 \u6b21 D1 \u64cd\u4f5c\uff09',
        u'\u5efa\u8b70\uff1aCheckin \u2192 KV.put (1 \u6b21)\u2002\u2192\u2002Cron \u6bcf\u5206\u9418 batch INSERT D1',
        u'',
        u'\u512a\u52e2\uff1a',
        u'\u2022 KV \u5beb\u5165\u7121\u9396\u7af6\u722d\uff0c\u5ef6\u9072 < 50ms',
        u'\u2022 Cron \u55ae\u57f7\u884c\u7dd2\u5beb D1\uff0c\u907f\u514d\u4e26\u767c\u7af6\u722d',
        u'\u2022 \u7b2c\u4e8c\u8f2a\u6e2c\u8a66\u5df2\u9a57\u8b49 KV 1-op \u5728 500 VU \u4e0b\u6210\u529f\u7387 100%',
    ]
    for line in kv_lines:
        if line == '':
            story.append(Spacer(1, 2*mm))
        else:
            story.append(Paragraph(line, styles['CJKBody']))
    story.append(PageBreak())

    # ── Page 5: Real-world Impact + Timeline ──
    story.append(Paragraph(u'\u56db\u3001\u751f\u7522\u74b0\u5883\u5f71\u97ff\u8a55\u4f30', styles['CJKHeading']))

    story.append(Paragraph(u'4.1 4/12 \u8d77\u99d5\u7576\u5929\u98a8\u96aa\u5206\u6790', styles['CJKHeading2']))
    risk_data = [
        [u'\u60c5\u5883', u'\u9810\u4f30 VU', u'\u98a8\u96aa', u'\u5f71\u97ff'],
        [u'\u4e00\u822c\u884c\u9032\uff08\u50c5\u6253\u5361\uff09', '200\u2013500',
         u'\u4f4e', u'D1 \u53ef\u61c9\u4ed8\uff0c\u4f46\u53ef\u80fd\u6709\u91cd\u8907\u8a18\u9304'],
        [u'\u884c\u9032 + \u67e5 Tracker', '200\u2013500',
         u'\u9ad8', u'Data API \u5927\u91cf\u8b80\u53d6\u53ef\u80fd\u5c0e\u81f4\u6253\u5361\u8cc7\u6599\u4e1f\u5931'],
        [u'\u8d77\u99d5\u77ac\u9593', '1,000\u20133,000',
         u'\u6975\u9ad8', u'\u8cc7\u6599\u4e1f\u5931 + D1 \u5d29\u6f70\u98a8\u96aa'],
    ]
    cw5 = [W*0.22, W*0.15, W*0.12, W*0.41]
    rt = make_table(risk_data, cw5)
    rt.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'STSong-Light'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (2, 2), (2, 2), LIGHT_RED),
        ('BACKGROUND', (2, 3), (2, 3), LIGHT_RED),
    ]))
    story.append(rt)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        u'\u2192 \u95dc\u9375\u98a8\u96aa\u4e0d\u662f\u300c\u6253\u5361\u6703\u4e0d\u6703\u6210\u529f\u300d\uff0c\u800c\u662f\u300c\u6253\u5361\u986f\u793a\u6210\u529f\u4f46\u8cc7\u6599\u6c92\u5b58\u300d\u3002'
        u'\u9019\u5c0d\u7528\u6236\u4fe1\u4efb\u50b7\u5bb3\u66f4\u5927\u3002',
        styles['CJKAlert']
    ))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'4.2 \u4fee\u5fa9\u6642\u7a0b\u5efa\u8b70', styles['CJKHeading2']))
    timeline = [
        u'\u2022 3/27\u20133/28\uff1a\u5be6\u4f5c KV Buffer + UNIQUE \u7d04\u675f\uff08P0\uff09',
        u'\u2022 3/29\uff1a\u91cd\u65b0\u57f7\u884c R3 \u9a57\u8b49\u6e2c\u8a66\uff0c\u78ba\u8a8d\u4fee\u5fa9\u6548\u679c',
        u'\u2022 3/30\u20134/05\uff1aData API \u5feb\u53d6 + \u79fb\u9664 migration per-request\uff08P1\uff09',
        u'\u2022 4/06\u20134/11\uff1a\u7dda\u4e0a\u76e3\u63a7\u8a2d\u5b9a + \u6700\u7d42\u9a57\u8b49',
    ]
    for line in timeline:
        story.append(Paragraph(line, styles['CJKBody']))
    story.append(PageBreak())

    # ── Page 6: Test Summary + Methodology ──
    story.append(Paragraph(u'\u4e94\u3001\u6e2c\u8a66\u65b9\u6cd5\u8ad6', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u672c\u8f2a\u6e2c\u8a66\u8ddd\u96e2 R2 \u7684\u5dee\u7570\uff1a\u4e0d\u50c5\u6e2c\u300c\u8acb\u6c42\u6210\u529f\u7387\u300d\uff0c'
        u'\u66f4\u6e2c\u300c\u8cc7\u6599\u662f\u5426\u771f\u7684\u5beb\u5165\u300d\u548c\u300c\u591a\u7aef\u9ede\u4e92\u4e92\u5f71\u97ff\u300d\u3002',
        styles['CJKBody']
    ))

    method_data = [
        [u'\u6e2c\u8a66', u'\u65b9\u6cd5', u'\u9a57\u8b49\u76ee\u6a19'],
        ['DI-500', u'500 VU checkin 2\u5206\u9418 \u2192 Wrangler \u67e5 D1 \u8a18\u9304',
         u'HTTP 200 \u2248 D1 \u8a18\u9304\u6578\uff1f'],
        ['MX-500', u'500 VU \u6df7\u5408\uff0860% checkin + 30% data + 10% user\uff09',
         u'\u591a\u7aef\u9ede\u662f\u5426\u4e92\u76f8\u5e72\u64fe\uff1f'],
        ['MX-1000', u'1000 VU \u6df7\u5408\uff0c\u540c\u4e0a', u'\u627f\u8f09\u4e0a\u9650\u4e0b\u7684\u5e72\u64fe\u7a0b\u5ea6\uff1f'],
    ]
    cw6 = [W*0.15, W*0.45, W*0.3]
    story.append(make_table(method_data, cw6))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'\u516d\u3001\u7e3d\u7d50\uff1a\u4e09\u8f2a\u6e2c\u8a66\u6574\u9ad4\u5716\u50cf', styles['CJKHeading']))
    overall = [
        [u'\u8f2a\u6b21', u'\u7126\u9ede', u'\u7d50\u8ad6'],
        [u'R1 \u5bb9\u91cf\u6e2c\u8a66', u'HTTP \u5c64\u9762\u7684\u6700\u5927\u8655\u7406\u80fd\u529b',
         u'10K\u201350K\u2013100K \u8acb\u6c42\u53ef\u8655\u7406'],
        [u'R2 \u884c\u70ba\u6e2c\u8a66', u'\u771f\u5be6\u5834\u666f\u6a21\u64ec\uff08\u57fa\u7dda/\u7206\u767c/\u6ce2\u6d6a\uff09',
         u'800 VU \u7a69\u5b9a\uff0c3000 VU \u7206\u767c\u53ef\u627f\u53d7'],
        [u'R3 \u9a57\u8b49\u6e2c\u8a66', u'\u8cc7\u6599\u5b8c\u6574\u6027 + \u591a\u7aef\u9ede\u5e72\u64fe',
         u'\u2757 D1 \u8cc7\u6599\u4e1f\u5931 + \u91cd\u8907\u5beb\u5165\u554f\u984c'],
    ]
    cw7 = [W*0.18, W*0.37, W*0.35]
    story.append(make_table(overall, cw7))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(
        u'\u2192 R1/R2 \u770b\u8d77\u4f86\u6c92\u554f\u984c\uff0c\u662f\u56e0\u70ba\u53ea\u6e2c\u4e86\u300cHTTP \u56de\u61c9\u662f\u5426\u6210\u529f\u300d\u3002'
        u'R3 \u6df1\u5165\u9a57\u8b49\u5f8c\u767c\u73fe\uff1a\u300c\u56de\u61c9\u6210\u529f\u300d\u2260\u300c\u8cc7\u6599\u5df2\u5b58\u300d\u3002'
        u'\u9019\u662f\u5178\u578b\u7684\u300c\u865b\u5047\u6210\u529f\u300d\u554f\u984c\uff0c\u5fc5\u9808\u5728\u4e0a\u7dda\u524d\u4fee\u5fa9\u3002',
        styles['CJKNote']
    ))
    story.append(Spacer(1, 10*mm))

    story.append(Paragraph(u'\u2500' * 60, styles['CJKSmall']))
    story.append(Paragraph(
        u'\u5831\u544a\u7522\u751f\uff1aClaude Code\u2002|\u2002\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6 + Wrangler D1\u2002|\u2002'
        u'\u65e5\u671f\uff1a2026-03-26',
        styles['CJKSmall']
    ))

    doc.build(story)
    print(f'Report saved to: {OUTPUT}')

if __name__ == '__main__':
    build_report()
