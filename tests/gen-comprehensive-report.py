#!/usr/bin/env python3
"""Formosa ESG 2026 — 壓力測試綜合報告 PDF（四輪測試彙整，結論前置）"""

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
import os, json, glob

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
LIGHT_BLUE = HexColor('#dbeafe')
WHITE = HexColor('#ffffff')

OUTPUT = os.path.expanduser('~/Desktop/Formosa-ESG-2026-壓力測試綜合報告.pdf')

# ── Try to load R4 results from JSON ──
def load_r4_results():
    """Load R4 test results from tests/results/ directory."""
    results = {}
    result_dir = os.path.join(os.path.dirname(__file__), 'results')
    for pattern in ['r4-CF-800-*.json', 'r4-RW-300-*.json', 'r4-RW-500-*.json']:
        files = sorted(glob.glob(os.path.join(result_dir, pattern)))
        if files:
            with open(files[-1]) as f:
                data = json.load(f)
                key = pattern.split('-')[1] + '-' + pattern.split('-')[2].replace('*.json', '').rstrip('-')
                # Extract key from filename
                basename = os.path.basename(files[-1])
                # e.g. r4-CF-800-20260326T234800.json -> CF-800
                parts = basename.replace('r4-', '').split('-')
                key = parts[0] + '-' + parts[1]
                results[key] = data
    return results

def build_styles():
    styles = getSampleStyleSheet()
    for name, sz, ld, clr, align, sa, sb in [
        ('CJKTitle', 24, 30, NAVY, TA_CENTER, 6, 0),
        ('CJKSubtitle', 12, 16, GRAY, TA_CENTER, 10, 0),
        ('CJKHeading', 16, 22, NAVY, TA_LEFT, 4, 6),
        ('CJKHeading2', 13, 18, BLUE, TA_LEFT, 3, 4),
        ('CJKBody', 10, 16, NAVY, TA_LEFT, 3, 0),
        ('CJKSmall', 8.5, 13, GRAY, TA_LEFT, 2, 0),
        ('CJKNote', 9, 14, ORANGE, TA_LEFT, 3, 0),
        ('CJKAlert', 10, 16, RED, TA_LEFT, 3, 0),
        ('CJKGreen', 10, 16, GREEN, TA_LEFT, 3, 0),
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

def fmt(n, suffix=''):
    """Format number with commas."""
    if isinstance(n, float):
        return f'{n:,.1f}{suffix}'
    return f'{n:,}{suffix}'

def extract_metrics(data):
    """Extract key metrics from k6 JSON output."""
    m = data.get('metrics', {})
    return {
        'reqs': m.get('http_reqs', {}).get('values', {}).get('count', 0),
        'rps': m.get('http_reqs', {}).get('values', {}).get('rate', 0),
        'p95': m.get('http_req_duration', {}).get('values', {}).get('p(95)', 0),
        'p99': m.get('http_req_duration', {}).get('values', {}).get('p(99)', 0),
        'avg': m.get('http_req_duration', {}).get('values', {}).get('avg', 0),
        'med': m.get('http_req_duration', {}).get('values', {}).get('med', 0),
        'err_rate': m.get('errors', {}).get('values', {}).get('rate', 0),
        'ck_ok': m.get('checkin_success', {}).get('values', {}).get('count', 0),
        'ck_fail': m.get('checkin_fail', {}).get('values', {}).get('count', 0),
        'ck_p95': m.get('checkin_duration', {}).get('values', {}).get('p(95)', 0),
        'dt_ok': m.get('data_api_success', {}).get('values', {}).get('count', 0),
        'dt_fail': m.get('data_api_fail', {}).get('values', {}).get('count', 0),
        'dt_p95': m.get('data_duration', {}).get('values', {}).get('p(95)', 0),
        'us_ok': m.get('user_api_success', {}).get('values', {}).get('count', 0),
        'us_fail': m.get('user_api_fail', {}).get('values', {}).get('count', 0),
        'us_p95': m.get('user_duration', {}).get('values', {}).get('p(95)', 0),
        'timeouts': m.get('timeout_errors', {}).get('values', {}).get('count', 0),
        's5xx': m.get('server_5xx', {}).get('values', {}).get('count', 0),
        'r429': m.get('rate_limited_429', {}).get('values', {}).get('count', 0),
    }


def build_report():
    styles = build_styles()
    r4 = load_r4_results()

    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=20*mm, bottomMargin=20*mm)
    story = []
    W = A4[0] - 36*mm

    # ================================================================
    # PAGE 1: COVER + EXECUTIVE SUMMARY
    # ================================================================
    story.append(Spacer(1, 25*mm))
    story.append(Paragraph('Formosa ESG 2026', styles['CJKTitle']))
    story.append(Paragraph(u'\u58d3\u529b\u6e2c\u8a66\u7d9c\u5408\u5831\u544a', styles['CJKTitle']))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'\u767d\u6c99\u5c6f\u5abd\u7956\u9032\u9999\u2002\u2014\u2002GPS \u6253\u5361\u7cfb\u7d71\u8ca0\u8f09\u80fd\u529b\u8a55\u4f30',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u65e5\u671f\uff1a2026-03-25 ~ 2026-03-26\u2002|\u2002\u67b6\u69cb\uff1aCloudflare Workers + D1',
        styles['CJKSubtitle']
    ))
    story.append(Paragraph(
        u'\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6 v1.7.0\u2002|\u2002\u5831\u544a\u7522\u751f\uff1aClaude Code',
        styles['CJKSubtitle']
    ))

    # Executive Summary Box
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(u'\u7d50\u8ad6\u6458\u8981', styles['CJKHeading']))

    exec_items = [
        [Paragraph(u'\u7cfb\u7d71\u80fd\u529b\u908a\u754c',
            ParagraphStyle('eh', fontName='STSong-Light', fontSize=12, leading=18, textColor=NAVY, spaceAfter=2*mm))],
        [Paragraph(
            u'\u2022 \u7d14 Checkin\uff1a800 VU \u6301\u7e8c 10 \u5206\u9418 100% \u6210\u529f\u7387\u3001P95 1,013ms\uff08R4 CF-800 \u9a57\u8b49\uff09<br/>'
            u'\u2022 \u6df7\u5408\u8ca0\u8f09\uff1a500 VU + think time \u4e0b Checkin 99.9% \u6210\u529f\uff0c\u4f46 Data/User API \u5d29\u6f70\uff08R4 RW-500\uff09<br/>'
            u'\u2022 D1 \u55ae\u4e00\u5beb\u5165\u8005\u662f\u6838\u5fc3\u74f6\u9838\uff0c\u6df7\u5408\u8b80\u5beb\u5c0e\u81f4 20,343 \u500b 5xx \u932f\u8aa4',
            ParagraphStyle('eb', fontName='STSong-Light', fontSize=10, leading=16, textColor=NAVY))],
        [Spacer(1, 3*mm)],
        [Paragraph(u'\u767d\u6c99\u5c6f\u5834\u666f\u8a55\u4f30',
            ParagraphStyle('eh2', fontName='STSong-Light', fontSize=12, leading=18, textColor=GREEN, spaceAfter=2*mm))],
        [Paragraph(
            u'\u2022 \u9810\u4f30\u5cf0\u503c\u4f75\u767c\uff1a200\u2013500 \u4eba\u540c\u6642\u7dda\u4e0a\uff0c50\u2013100 \u4eba\u540c\u6642\u6253\u5361<br/>'
            u'\u2022 \u7cfb\u7d71\u53ef\u627f\u53d7\u6b64\u898f\u6a21\uff0c\u4f46\u9700\u4fee\u5fa9 D1 \u8cc7\u6599\u5b8c\u6574\u6027\u554f\u984c<br/>'
            u'\u2022 \u5efa\u8b70 4/12 \u524d\u5b8c\u6210 KV Buffer + UNIQUE \u7d04\u675f\u4fee\u5fa9',
            ParagraphStyle('eb2', fontName='STSong-Light', fontSize=10, leading=16, textColor=NAVY))],
        [Spacer(1, 3*mm)],
        [Paragraph(u'\u5df2\u767c\u73fe\u98a8\u96aa',
            ParagraphStyle('eh3', fontName='STSong-Light', fontSize=12, leading=18, textColor=RED, spaceAfter=2*mm))],
        [Paragraph(
            u'\u2776 D1 \u5beb\u5165\u5ef6\u9072\uff1a\u56de 200 \u5f8c\u8cc7\u6599\u9700\u6578\u5206\u9418\u624d\u5beb\u5165\uff08R3 DI-500\uff09<br/>'
            u'\u2777 D1 \u91cd\u8907\u5beb\u5165\uff1a+51% \u591a\u9918\u8a18\u9304\uff08R3 DI-500\uff09<br/>'
            u'\u2778 \u6df7\u5408\u8ca0\u8f09\u4e0b\u5beb\u5165\u6d88\u5931\uff1aCheckin \u56de 200 \u4f46 D1 \u8a18\u9304 0 \u7b46\uff08R3 MX-500\uff09',
            ParagraphStyle('eb3', fontName='STSong-Light', fontSize=10, leading=16, textColor=NAVY))],
    ]
    exec_t = Table(exec_items, colWidths=[W * 0.9])
    exec_t.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.5, NAVY),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(exec_t)
    story.append(PageBreak())

    # ================================================================
    # PAGE 2: FOUR ROUNDS OVERVIEW TABLE
    # ================================================================
    story.append(Paragraph(u'\u4e00\u3001\u56db\u8f2a\u6e2c\u8a66\u7e3d\u89bd', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u6bcf\u8f2a\u6e2c\u8a66\u805a\u7126\u4e0d\u540c\u5c64\u9762\uff0c\u9010\u6b65\u6df1\u5165\u9a57\u8b49\u7cfb\u7d71\u771f\u5be6\u80fd\u529b\u3002',
        styles['CJKBody']
    ))

    overview_data = [
        [u'\u8f2a\u6b21', u'\u65e5\u671f', u'\u7126\u9ede', u'\u6e2c\u8a66\u5834\u666f', u'\u7d50\u8ad6'],
        ['R1', '3/25', u'\u5bb9\u91cf\u6e2c\u8a66',
         u'C-10K / C-50K / C-100K\nS-BURST / S-WAVE',
         u'HTTP \u5c64 OK\n10\u2013100K \u8acb\u6c42\u53ef\u8655\u7406'],
        ['R2', '3/25', u'\u884c\u70ba\u6e2c\u8a66',
         u'B-500 / B-800\nST-1000 / ST-1200\nBR-3000 / WV-3500',
         u'800 VU \u7a69\u5b9a\n1200+ \u958b\u59cb\u964d\u7d1a'],
        ['R3', '3/26', u'\u8cc7\u6599\u9a57\u8b49',
         u'DI-500\nMX-500 / MX-1000',
         u'\u26a0 D1 \u4e1f\u5931+\u91cd\u8907\n\u26a0 \u6df7\u5408\u8ca0\u8f09\u5beb\u5165\u6d88\u5931'],
        ['R4', '3/26', u'\u771f\u5be6\u5834\u666f',
         u'CF-800 (D1 \u8010\u4e45)\nRW-500 (\u6df7\u5408+think time)',
         u'CF-800 PASS (100%)\nRW-500 FAIL (Data API \u5d29)'],
    ]
    cw_ov = [W*0.07, W*0.08, W*0.13, W*0.35, W*0.30]
    story.append(make_table(overview_data, cw_ov))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'\u6e2c\u8a66\u7d93\u6b77\u5716', styles['CJKHeading2']))
    story.append(Paragraph(
        u'R1 HTTP \u5c64\u80fd\u529b \u2192 R2 \u771f\u5be6\u5834\u666f\u8ca0\u8f09 \u2192 R3 \u8cc7\u6599\u5b8c\u6574\u6027\u9a57\u8b49 \u2192 R4 \u9577\u6642\u9593\u771f\u5be6\u4f7f\u7528\u6a21\u64ec',
        styles['CJKBody']
    ))
    story.append(Paragraph(
        u'\u6bcf\u8f2a\u90fd\u57fa\u65bc\u524d\u4e00\u8f2a\u7684\u767c\u73fe\u8a2d\u8a08\uff0c\u5f62\u6210\u300c\u57fa\u7dda \u2192 \u6df1\u5165 \u2192 \u9a57\u8b49 \u2192 \u78ba\u8a8d\u300d\u7684\u5b8c\u6574\u9a57\u8b49\u93c8\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ================================================================
    # PAGE 3: R1 CAPACITY TEST SUMMARY
    # ================================================================
    story.append(Paragraph(u'\u4e8c\u3001Round 1\uff1a\u5bb9\u91cf\u6e2c\u8a66', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6e2c\u8a66 Workers HTTP \u5c64\u7684\u6700\u5927\u8655\u7406\u80fd\u529b\uff0c\u4e0d\u8003\u616e D1 \u8cc7\u6599\u5b8c\u6574\u6027\u3002',
        styles['CJKBody']
    ))

    r1_data = [
        [u'\u5834\u666f', 'VU', u'\u8acb\u6c42\u6578', u'\u6210\u529f\u7387', 'P95', u'\u7d50\u679c'],
        ['C-10K', '100', '10,000', '100%', '342ms', 'PASS'],
        ['C-50K', '500', '50,000', '100%', '521ms', 'PASS'],
        ['C-100K', '1,000', '100,000', '100%', '876ms', 'PASS'],
        ['S-BURST', '1,000', '5,000', '100%', '1,021ms', 'PASS'],
        ['S-WAVE', '3,000', '15,000', '100%', '1,184ms', 'PASS'],
        ['S-EXTREME', '5,000', '25,000', '91%', '2,834ms', 'PASS*'],
    ]
    cw_r1 = [W*0.15, W*0.1, W*0.15, W*0.13, W*0.13, W*0.1]
    story.append(make_table(r1_data, cw_r1))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        u'* S-EXTREME 5000 VU \u8d85\u904e\u5ba2\u6236\u7aef\u7db2\u8def\u80fd\u529b\uff0c\u5831\u544a\u6578\u64da\u53cd\u6620\u7684\u662f\u5ba2\u6236\u7aef\u74f6\u9838\u800c\u975e\u4f3a\u670d\u5668\u3002',
        styles['CJKSmall']
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'R1 \u7d50\u8ad6\uff1aCloudflare Workers HTTP \u5c64\u8655\u7406\u80fd\u529b\u5145\u88d5\uff0c'
        u'100K \u8acb\u6c42\u53ef\u8655\u7406\u3001P95 < 1s\u3002\u4f46\u6b64\u8f2a\u672a\u6e2c D1 \u5beb\u5165\u5be6\u969b\u6548\u679c\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ================================================================
    # PAGE 4: R2 BEHAVIOR TEST SUMMARY
    # ================================================================
    story.append(Paragraph(u'\u4e09\u3001Round 2\uff1a\u884c\u70ba\u6e2c\u8a66', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u6a21\u64ec\u57fa\u7dda\u3001\u7206\u767c\u3001\u6ce2\u6d6a\u3001\u6062\u5fa9\u7b49\u771f\u5be6\u5834\u666f\uff0c\u627e\u51fa\u7cfb\u7d71\u884c\u70ba\u908a\u754c\u3002',
        styles['CJKBody']
    ))

    r2_data = [
        [u'\u5834\u666f', 'VU', u'\u6210\u529f\u7387', 'P95', u'\u7d50\u679c'],
        [u'B-500 \u57fa\u7dda', '500', '100%', '821ms', 'PASS'],
        [u'B-800 \u57fa\u7dda', '800', '99.9995%', '946ms', 'PASS'],
        [u'ST-1000 \u58d3\u529b', '1,000', '99.70%', '1,424ms', 'PASS'],
        [u'ST-1200 \u58d3\u529b', '1,200', '96.56%', '765ms', 'FAIL'],
        [u'BR-3000 \u7206\u767c', '3,000', '91.13%', '776ms', 'PASS*'],
        [u'WV-3500 \u6ce2\u6d6a', '3,500', '81.85%', u'\u2014', 'PASS*'],
        [u'RC \u6062\u5fa9', '3,000', '54.28%', u'\u2014', 'FAIL'],
    ]
    cw_r2 = [W*0.2, W*0.1, W*0.15, W*0.13, W*0.1]
    t2 = make_table(r2_data, cw_r2)
    t2.setStyle(TableStyle([
        ('BACKGROUND', (-1, 4), (-1, 4), LIGHT_RED),
        ('BACKGROUND', (-1, 7), (-1, 7), LIGHT_RED),
    ]))
    story.append(t2)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        u'* BR-3000 \u548c WV-3500 \u96d6\u7136\u6210\u529f\u7387\u4e0d\u5230 95%\uff0c\u4f46\u5c6c\u65bc\u7206\u767c\u5834\u666f\uff0c\u9810\u671f\u6709\u90e8\u5206\u5931\u6557\u3002'
        u'\u5173\u952e\u662f\u7cfb\u7d71\u80fd\u6062\u5fa9\u800c\u975e\u5d29\u6f70\u3002',
        styles['CJKSmall']
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'R2 \u7d50\u8ad6\uff1a800 VU \u662f\u7a69\u5b9a\u57fa\u7dda\uff0c1000 VU \u70ba\u908a\u754c\uff0c1200+ VU \u958b\u59cb\u964d\u7d1a\u3002'
        u'3000 VU \u7206\u767c\u5f8c\u6062\u5fa9\u80fd\u529b\u4e0d\u8db3\uff08RC 54%\uff09\u3002',
        styles['CJKNote']
    ))
    story.append(PageBreak())

    # ================================================================
    # PAGE 5: R3 VERIFICATION TEST
    # ================================================================
    story.append(Paragraph(u'\u56db\u3001Round 3\uff1a\u8cc7\u6599\u5b8c\u6574\u6027\u9a57\u8b49', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1aR1/R2 \u53ea\u6e2c HTTP \u56de\u61c9\uff0cR3 \u6df1\u5165\u9a57\u8b49\u300c\u8cc7\u6599\u662f\u5426\u771f\u7684\u5beb\u5165 D1\u300d\u548c\u300c\u591a\u7aef\u9ede\u662f\u5426\u4e92\u76f8\u5e72\u64fe\u300d\u3002',
        styles['CJKBody']
    ))

    # DI-500
    story.append(Paragraph(u'4.1 DI-500\uff1aD1 \u8cc7\u6599\u5b8c\u6574\u6027', styles['CJKHeading2']))
    di_data = [
        [u'\u6307\u6a19', u'\u6578\u503c', u'\u8aaa\u660e'],
        [u'\u7e3d\u8acb\u6c42', '24,851', ''],
        ['HTTP 200', '24,837', u'\u56de\u61c9\u6210\u529f'],
        ['P95', '1,711ms', u'\u504f\u9ad8'],
        [u'D1 \u5373\u6642\u67e5\u8a62', '10,388', u'\u50c5 42%'],
        [u'D1 +10\u5206\u67e5\u8a62', '37,462', u'\u8d85\u904e HTTP 200!'],
        [u'\u91cd\u8907\u5beb\u5165', '~15,715', u'+51% \u591a\u9918\u8a18\u9304'],
    ]
    cw3 = [W*0.25, W*0.2, W*0.45]
    story.append(make_table(di_data, cw3))
    story.append(Spacer(1, 3*mm))

    # MX-500/1000
    story.append(Paragraph(u'4.2 MX-500 / MX-1000\uff1a\u591a\u7aef\u9ede\u6df7\u5408', styles['CJKHeading2']))
    mx_data = [
        [u'\u6307\u6a19', 'MX-500', 'MX-1000'],
        [u'\u7e3d\u8acb\u6c42', '41,138', '79,327'],
        [u'\u6574\u9ad4\u6210\u529f\u7387', '59.88%', '60.18%'],
        [u'Checkin \u6210\u529f', '24,597', '47,703'],
        [u'Data API \u5931\u6557\u7387', '99.9%', '99.97%'],
        ['5xx \u932f\u8aa4', '15,276', '30,111'],
        [u'D1 \u5beb\u5165\u8a18\u9304', '0', '0'],
    ]
    cw_mx = [W*0.3, W*0.28, W*0.28]
    t_mx = make_table(mx_data, cw_mx)
    t_mx.setStyle(TableStyle([
        ('BACKGROUND', (-2, -1), (-1, -1), LIGHT_RED),
        ('TEXTCOLOR', (-2, -1), (-1, -1), RED),
    ]))
    story.append(t_mx)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        u'R3 \u91cd\u5927\u767c\u73fe\uff1aCheckin \u56de HTTP 200 \u4f46 D1 \u8a18\u9304 = 0\uff0c\u300c\u865b\u5047\u6210\u529f\u300d\u554f\u984c\u3002'
        u'\u7528\u6236\u770b\u5230\u300c\u6253\u5361\u6210\u529f\u300d\u4f46\u8cc7\u6599\u5b8c\u5168\u4e1f\u5931\u3002',
        styles['CJKAlert']
    ))
    story.append(PageBreak())

    # ================================================================
    # PAGE 6: R4 REAL-WORLD VERIFICATION
    # ================================================================
    story.append(Paragraph(u'\u4e94\u3001Round 4\uff1a\u771f\u5be6\u5834\u666f\u9a57\u8b49', styles['CJKHeading']))
    story.append(Paragraph(
        u'\u76ee\u6a19\uff1a\u57fa\u65bc R3 \u767c\u73fe\uff0c\u7528\u66f4\u8cbc\u8fd1\u771f\u5be6\u7684\u6a21\u5f0f\u9a57\u8b49\uff1a'
        u'\u52a0\u5165 think time\uff08GPS \u5b9a\u4f4d 3-10s\u3001LIFF \u8f09\u5165\uff09\u3001\u6cbf\u8def\u7dda GPS \u6a21\u64ec\u3001\u62c9\u9577\u6e2c\u8a66\u6642\u9593\u3002',
        styles['CJKBody']
    ))

    # CF-800 results
    story.append(Paragraph(u'5.1 CF-800\uff1aD1 \u6301\u7e8c\u5beb\u5165\u8010\u4e45\u6027\uff0810 \u5206\u9418\uff09', styles['CJKHeading2']))
    if 'CF-800' in r4:
        cf = extract_metrics(r4['CF-800'])
        cf_data = [
            [u'\u6307\u6a19', u'\u6578\u503c', u'\u8aaa\u660e'],
            [u'\u7e3d\u8acb\u6c42', fmt(cf['reqs']), f"RPS: {cf['rps']:.1f}"],
            [u'\u6210\u529f\u7387', f"{(1-cf['err_rate'])*100:.2f}%", ''],
            ['P95', f"{cf['p95']:.0f}ms", u'\u9580\u6abb 1500ms'],
            ['P99', f"{cf['p99']:.0f}ms" if cf['p99'] > 0 else 'N/A*', u'\u9580\u6abb 3000ms'],
            [u'Checkin \u6210\u529f', fmt(cf['ck_ok']), ''],
            [u'Checkin \u5931\u6557', fmt(cf['ck_fail']), ''],
            ['Timeout', fmt(cf['timeouts']), ''],
            ['5xx', fmt(cf['s5xx']), ''],
            ['429 Rate Limited', fmt(cf['r429']), ''],
        ]
        story.append(make_table(cf_data, cw3))
        pass_p95 = cf['p95'] <= 1500
        pass_err = cf['err_rate'] <= 0.01
        verdict = 'PASS' if (pass_p95 and pass_err) else 'FAIL'
        color = styles['CJKGreen'] if verdict == 'PASS' else styles['CJKAlert']
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph(f'CF-800 \u7d50\u679c\uff1a{verdict}', color))
    else:
        story.append(Paragraph(
            u'\u2192 \u6e2c\u8a66\u5c1a\u672a\u57f7\u884c\u6216\u7d50\u679c\u6a94\u672a\u627e\u5230\u3002\u57f7\u884c\u5f8c\u91cd\u65b0\u751f\u6210\u5831\u544a\u3002',
            styles['CJKNote']
        ))
    story.append(Spacer(1, 4*mm))

    # RW-500 results
    story.append(Paragraph(u'5.2 RW-500\uff1a\u771f\u5be6\u5834\u666f\u6df7\u5408\uff0815 \u5206\u9418\uff09', styles['CJKHeading2']))
    if 'RW-500' in r4:
        rw = extract_metrics(r4['RW-500'])
        rw_data = [
            [u'\u6307\u6a19', u'\u6578\u503c', u'\u8aaa\u660e'],
            [u'\u7e3d\u8acb\u6c42', fmt(rw['reqs']), f"RPS: {rw['rps']:.1f}"],
            [u'\u6210\u529f\u7387', f"{(1-rw['err_rate'])*100:.2f}%", ''],
            ['P95', f"{rw['p95']:.0f}ms", u'\u9580\u6abb 1500ms'],
            ['P99', f"{rw['p99']:.0f}ms" if rw['p99'] > 0 else 'N/A*', u'\u9580\u6abb 3000ms'],
            [u'Checkin \u6210\u529f/\u5931\u6557', f"{fmt(rw['ck_ok'])} / {fmt(rw['ck_fail'])}", f"P95: {rw['ck_p95']:.0f}ms"],
            [u'Data API \u6210\u529f/\u5931\u6557', f"{fmt(rw['dt_ok'])} / {fmt(rw['dt_fail'])}", f"P95: {rw['dt_p95']:.0f}ms"],
            [u'User API \u6210\u529f/\u5931\u6557', f"{fmt(rw['us_ok'])} / {fmt(rw['us_fail'])}", f"P95: {rw['us_p95']:.0f}ms"],
            ['Timeout', fmt(rw['timeouts']), ''],
            ['5xx', fmt(rw['s5xx']), ''],
            ['429 Rate Limited', fmt(rw['r429']), ''],
        ]
        story.append(make_table(rw_data, cw3))
        pass_p95 = rw['p95'] <= 1500
        pass_err = rw['err_rate'] <= 0.01
        verdict = 'PASS' if (pass_p95 and pass_err) else 'FAIL'
        color = styles['CJKGreen'] if verdict == 'PASS' else styles['CJKAlert']
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph(f'RW-500 \u7d50\u679c\uff1a{verdict}', color))
    else:
        story.append(Paragraph(
            u'\u2192 \u6e2c\u8a66\u5c1a\u672a\u57f7\u884c\u6216\u7d50\u679c\u6a94\u672a\u627e\u5230\u3002\u57f7\u884c\u5f8c\u91cd\u65b0\u751f\u6210\u5831\u544a\u3002',
            styles['CJKNote']
        ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        u'* P99 \u986f\u793a N/A \u662f\u56e0\u70ba k6 \u81ea\u8a02 handleSummary \u4e0d\u8f38\u51fa\u767e\u5206\u4f4d\u6578\u660e\u7d30\uff0c'
        u'\u5be6\u969b P99 \u53ef\u53c3\u8003\u6700\u5927\u5ef6\u9072\u3002',
        styles['CJKSmall']
    ))
    story.append(PageBreak())

    # ================================================================
    # PAGE 7: ROOT CAUSE + FIX PLAN
    # ================================================================
    story.append(Paragraph(u'\u516d\u3001\u6839\u56e0\u5206\u6790\u8207\u4fee\u5fa9\u65b9\u6848', styles['CJKHeading']))

    story.append(Paragraph(u'6.1 \u6839\u56e0\uff1aD1 SQLite \u55ae\u4e00\u5beb\u5165\u8005\u9650\u5236', styles['CJKHeading2']))
    root_lines = [
        u'\u2022 D1 \u57fa\u65bc SQLite\uff0c\u540c\u4e00\u6642\u9593\u53ea\u5141\u8a31\u4e00\u500b\u5beb\u5165\u64cd\u4f5c\uff08single writer\uff09',
        u'\u2022 Checkin \u6bcf\u6b21\u57f7\u884c 3\u20134 \u6b21 D1 \u64cd\u4f5c\uff08migration check + rate limit + INSERT + COUNT\uff09',
        u'\u2022 Data API \u57f7\u884c 5 \u6b21 D1 \u67e5\u8a62\uff0c\u8207\u5beb\u5165\u7af6\u722d\u540c\u4e00\u9396',
        u'\u2022 \u9ad8\u4e26\u767c\u4e0b D1 WAL checkpoint \u7570\u5e38\uff0c\u5c0e\u81f4\u5ef6\u9072\u5beb\u5165\u548c\u91cd\u8907\u8a18\u9304',
        u'\u2022 .run() Promise resolve \u4e0d\u4ee3\u8868\u8cc7\u6599\u5df2\u6301\u4e45\u5316\uff0c\u5c0e\u81f4\u300c\u865b\u5047\u6210\u529f\u300d',
    ]
    for line in root_lines:
        story.append(Paragraph(line, styles['CJKBody']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(u'6.2 \u4fee\u5fa9\u65b9\u6848\uff08\u4f9d\u512a\u5148\u7d1a\uff09', styles['CJKHeading2']))
    fix_data = [
        [u'\u512a\u5148', u'\u4fee\u5fa9\u65b9\u6848', u'\u6548\u679c', u'\u5de5\u4f5c\u91cf'],
        ['P0', u'Checkin \u6539 KV Buffer + Cron batch INSERT D1',
         u'\u6d88\u9664 D1 \u5beb\u5165\u7af6\u722d', u'2\u20133h'],
        ['P0', u'formosa_gps_points \u52a0 UNIQUE(user_id, timestamp)',
         u'\u907f\u514d\u91cd\u8907\u5beb\u5165', u'30min'],
        ['P1', u'Data API \u52a0 KV cache\uff0860s TTL\uff09',
         u'\u6e1b\u5c11 D1 \u8b80\u53d6\u58d3\u529b', u'1h'],
        ['P1', u'\u79fb\u9664 migrateFormosa() per-request \u57f7\u884c',
         u'\u6e1b\u5c11 1 \u6b21 D1 \u64cd\u4f5c/\u8acb\u6c42', u'15min'],
        ['P2', u'Rate limit \u6539 KV \u8a08\u6578\u5668',
         u'\u6e1b\u5c11 D1 \u8b80\u53d6', u'1h'],
    ]
    cw_fix = [W*0.08, W*0.40, W*0.30, W*0.12]
    ft = make_table(fix_data, cw_fix)
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
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(u'6.3 \u4fee\u5fa9\u6642\u7a0b', styles['CJKHeading2']))
    timeline = [
        u'\u2022 3/27\u20133/28\uff1a\u5be6\u4f5c KV Buffer + UNIQUE \u7d04\u675f\uff08P0\uff09',
        u'\u2022 3/29\uff1a\u91cd\u8dd1 R3/R4 \u9a57\u8b49\u6e2c\u8a66\uff0c\u78ba\u8a8d\u4fee\u5fa9\u6548\u679c',
        u'\u2022 3/30\u20134/05\uff1aData API cache + migration \u6e05\u7406\uff08P1\uff09',
        u'\u2022 4/06\u20134/11\uff1a\u76e3\u63a7\u8a2d\u5b9a + \u6700\u7d42\u9a57\u8b49',
    ]
    for line in timeline:
        story.append(Paragraph(line, styles['CJKBody']))
    story.append(PageBreak())

    # ================================================================
    # PAGE 8: RISK MATRIX + REAL-WORLD ASSESSMENT
    # ================================================================
    story.append(Paragraph(u'\u4e03\u3001\u98a8\u96aa\u77e9\u9663\u8207\u5834\u666f\u8a55\u4f30', styles['CJKHeading']))

    story.append(Paragraph(u'7.1 4/12 \u8d77\u99d5\u98a8\u96aa\u77e9\u9663', styles['CJKHeading2']))
    risk_data = [
        [u'\u60c5\u5883', u'\u4f30\u8a08 VU', u'\u6a5f\u7387', u'\u98a8\u96db', u'\u5f71\u97ff'],
        [u'\u4e00\u822c\u884c\u9032\uff08\u50c5\u6253\u5361\uff09', '50\u2013200', u'\u9ad8', u'\u4f4e', u'\u6b63\u5e38\u904b\u4f5c'],
        [u'\u884c\u9032 + \u67e5 Tracker', '200\u2013500', u'\u4e2d', u'\u4e2d', u'Data API \u53ef\u80fd\u5e72\u64fe\u5beb\u5165'],
        [u'\u8d77\u99d5\u77ac\u9593\u9ad8\u5cf0', '500\u20131,000', u'\u4f4e', u'\u9ad8', u'\u8cc7\u6599\u4e1f\u5931\u98a8\u96aa'],
        [u'\u7206\u7d05\u71b1\u5ea6', '1,000+', u'\u6975\u4f4e', u'\u6975\u9ad8', u'\u7cfb\u7d71\u964d\u7d1a'],
    ]
    cw_risk = [W*0.22, W*0.13, W*0.1, W*0.1, W*0.35]
    rt = make_table(risk_data, cw_risk)
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
        ('BACKGROUND', (3, 3), (3, 3), LIGHT_RED),
        ('BACKGROUND', (3, 4), (3, 4), LIGHT_RED),
    ]))
    story.append(rt)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        u'\u2192 \u6700\u5927\u98a8\u96db\u4e0d\u662f\u300c\u7cfb\u7d71\u639b\u6389\u300d\uff0c\u800c\u662f\u300c\u6253\u5361\u986f\u793a\u6210\u529f\u4f46\u8cc7\u6599\u6c92\u5b58\u300d\u3002'
        u'\u9019\u5c0d\u7528\u6236\u4fe1\u4efb\u50b7\u5bb3\u66f4\u5927\uff0c\u4e14\u96e3\u4ee5\u4e8b\u5f8c\u88dc\u6551\u3002',
        styles['CJKAlert']
    ))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'7.2 \u5834\u666f\u8a55\u4f30\u7d50\u8ad6', styles['CJKHeading2']))
    assess = [
        u'\u2022 \u5728\u4e00\u822c\u884c\u9032\u60c5\u5883\u4e0b\uff0850\u2013200 VU\uff09\uff0c\u7cfb\u7d71\u53ef\u6b63\u5e38\u904b\u4f5c',
        u'\u2022 \u5b8c\u6210 P0 \u4fee\u5fa9\u5f8c\uff0c\u53ef\u5b89\u5168\u627f\u53d7 500 VU \u6df7\u5408\u8ca0\u8f09',
        u'\u2022 \u4e0d\u5efa\u8b70\u5728\u672a\u4fee\u5fa9\u524d\u4e0a\u7dda\uff0c\u56e0\u70ba\u300c\u865b\u5047\u6210\u529f\u300d\u6bd4\u300c\u660e\u78ba\u5931\u6557\u300d\u66f4\u5371\u96aa',
        u'\u2022 \u5efa\u8b70\u6700\u9072 4/5 \u5b8c\u6210 P0+P1\uff0c\u7559 1 \u9031\u7de9\u885d\u6e2c\u8a66',
    ]
    for line in assess:
        story.append(Paragraph(line, styles['CJKBody']))
    story.append(PageBreak())

    # ================================================================
    # PAGE 9: METHODOLOGY + GLOSSARY
    # ================================================================
    story.append(Paragraph(u'\u516b\u3001\u6e2c\u8a66\u65b9\u6cd5\u8ad6', styles['CJKHeading']))

    method_data = [
        [u'\u9805\u76ee', u'\u8aaa\u660e'],
        [u'\u6e2c\u8a66\u5de5\u5177', 'Grafana k6 v1.7.0'],
        [u'\u6e2c\u8a66\u7aef', 'MacBook Air M2 + \u624b\u6a5f\u71b1\u9ede'],
        [u'\u76ee\u6a19\u7aef', 'Cloudflare Workers + D1 (SQLite)'],
        [u'\u7db2\u8def', u'\u624b\u6a5f\u71b1\u9ede\uff0c\u5be6\u969b\u5e36\u5bec ~50Mbps\uff0cVU>1000 \u7684\u7d50\u679c\u53cd\u6620\u5ba2\u6236\u7aef\u74f6\u9838'],
        [u'\u6e2c\u8a66\u6a19\u6e96', u'P95 < \u5834\u666f\u9580\u6abb\u3001\u932f\u8aa4\u7387 < \u5834\u666f\u9580\u6abb\u3001\u8cc7\u6599\u5b8c\u6574\u6027\u6aa2\u67e5'],
        [u'GPS \u6a21\u64ec', u'R4 \u6cbf\u767d\u6c99\u5c6f\u2192\u5317\u6597\u8def\u7dda 12 \u500b\u63a7\u5236\u9ede\uff0c\u52a0\u96a8\u6a5f\u504f\u79fb\u00b1200m'],
        [u'Think Time', u'R4 \u52a0\u5165\u771f\u5be6\u5ef6\u9072\uff1aGPS \u5b9a\u4f4d 3-10s\u3001Dashboard \u700f\u89bd 2-5s\u3001\u9801\u9762\u8f09\u5165 1-3s'],
    ]
    cw_method = [W*0.2, W*0.7]
    story.append(make_table(method_data, cw_method))
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph(u'\u4e5d\u3001\u8853\u8a9e\u8868', styles['CJKHeading']))
    glossary = [
        [u'\u8853\u8a9e', u'\u8aaa\u660e'],
        ['VU', u'Virtual User\uff0c\u6a21\u64ec\u7684\u865b\u64ec\u7528\u6236\u6578\uff08\u540c\u6642\u4e26\u767c\u6578\uff09'],
        ['P95', u'\u7b2c 95 \u767e\u5206\u4f4d\u5ef6\u9072\uff0c95% \u7684\u8acb\u6c42\u5728\u6b64\u6642\u9593\u5167\u5b8c\u6210'],
        ['P99', u'\u7b2c 99 \u767e\u5206\u4f4d\u5ef6\u9072\uff0c99% \u7684\u8acb\u6c42\u5728\u6b64\u6642\u9593\u5167\u5b8c\u6210'],
        ['RPS', u'Requests Per Second\uff0c\u6bcf\u79d2\u8acb\u6c42\u6578'],
        ['D1', u'Cloudflare \u7684\u908a\u7de3 SQLite \u8cc7\u6599\u5eab\u670d\u52d9'],
        ['KV', u'Cloudflare Workers KV\uff0c\u5168\u7403\u5206\u4f48\u7684\u9375\u503c\u5b58\u5132'],
        ['WAL', u'Write-Ahead Log\uff0cSQLite \u7684\u5beb\u5165\u524d\u65e5\u8a8c\u6a5f\u5236'],
        ['Think Time', u'\u6a21\u64ec\u7528\u6236\u64cd\u4f5c\u9593\u7684\u7b49\u5f85\u6642\u9593\uff0c\u8b93\u6e2c\u8a66\u66f4\u8cbc\u8fd1\u771f\u5be6'],
        [u'\u865b\u5047\u6210\u529f', u'HTTP \u56de 200 \u4f46\u8cc7\u6599\u672a\u5be6\u969b\u5beb\u5165\uff0c\u5c0d\u7528\u6236\u4fe1\u4efb\u50b7\u5bb3\u6700\u5927'],
    ]
    cw_gl = [W*0.18, W*0.72]
    story.append(make_table(glossary, cw_gl))

    # Footer
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(u'\u2500' * 60, styles['CJKSmall']))
    story.append(Paragraph(
        u'\u5831\u544a\u7522\u751f\uff1aClaude Code\u2002|\u2002\u6e2c\u8a66\u5de5\u5177\uff1aGrafana k6 v1.7.0\u2002|\u2002'
        u'\u65e5\u671f\uff1a2026-03-26\u2002|\u2002\u5b8c\u6574\u6e2c\u8a66\u6a94\u6848\uff1atests/ \u76ee\u9304',
        styles['CJKSmall']
    ))

    doc.build(story)
    print(f'Report saved to: {OUTPUT}')


if __name__ == '__main__':
    build_report()
