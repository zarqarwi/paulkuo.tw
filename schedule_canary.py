# -*- coding: utf-8 -*-
import urllib.request, urllib.parse, json

API_KEY = 'b58e111aff13f0b054b2'
CAT_ID = '171342'
BASE = 'https://www.oneupapp.io/api'
SCHEDULE = '2026-02-25 00:30'

WIDE_IMG = 'https://iili.io/qKg7WQ4.png'
SQ_IMG = 'https://iili.io/qKg7bwJ.png'

IDS = {
    'X': 'zarqarwi_twitter',
    'LI': 'urn:li:person:wrlK3lGrJP',
    'TH': '26024801023795076',
    'BS': 'did:plc:vag6mnwt2upj3ftlberu73la',
    'FB': '26970717712518471',
    'IG': 'zarqarwi_insta',
}

posts = {
    'X': {
        'ids': [IDS['X']],
        'img': WIDE_IMG,
        'content': '史丹佛研究：AI 爆發後，22-25歲年輕人在高AI暴露職業中就業率跌13%，35-49歲反而升9%。\n\n年輕人不是比較弱，是他們被訓練出來的能力，剛好站在AI的射程正中央。\n\n金絲雀已經在哀鳴。你做了什麼改變？\n\n#AI #就業 #教育轉型',
    },
    'LI': {
        'ids': [IDS['LI']],
        'img': WIDE_IMG,
        'content': '一位人資朋友跟我說，她們公司開了三個初階數據分析師職缺，面試後主管說：「我讓 Claude 跑了一下，發現核心產出兩個模型加一個 Python 腳本就能處理。」三個職缺變一個，而且職責描述完全改寫。\n\n史丹佛數位經濟實驗室的研究印證了這個現象：22-25歲年輕人在高AI暴露職業中就業率下降13%，而35-49歲中年員工反而上升9%。\n\n原因其實很直覺：AI最擅長的，恰好是年輕人帶進職場的東西——標準化的、可編碼的、來自課本和證照的知識。資深員工的隱性經驗——判斷力、人際溝通、在模糊情境下的決策——這些AI眭前還複製不了。\n\n但最關鍵的發現是：同一項AI技術，企業選擇「自動化」還是「增強化」，結果截然不同。選增強的企業，年輕人就業率反而上升最快。\n\n金絲雀已經在哀鳴。身為父母、教師、或企業主管，你打算做什麼改變？\n\n全文 → paulkuo.tw\n\n#AI #就業衝擊 #教育轉型 #人機協作',
    },
    'TH': {
        'ids': [IDS['TH']],
        'img': SQ_IMG,
        'content': '史丹佛研究發現：AI爆發後，22-25歲年輕人就業率跌13%，35-49歲反升9%。\n\n跟你想的完全相反。\n\n不是年輕人比較弱，是他們被訓練出來的能力——標準化知識、SOP執行、考試能力——恰好是AI最擅長取代的。\n\n但同一項技術，企業選擇讓AI「墝強」人而非「取代」人時，年輕人成長反而最快。\n\n金絲雀已經在哀鳴。你做了什麼改變？\n\n#AI #就業 #教育',
    },
    'BS': {
        'ids': [IDS['BS']],
        'img': WIDE_IMG,
        'content': '史丹佛研究：AI爆發後，22-25歲就業率跌13%，35-49歲反升9%。\n\n年輕人不是比較弱，是被訓練出的能力剛好在AI射程正中央。\n\n金絲雀已在哀鳴。\n\n#AI #就業 #教育轉型',
    },
    'FB': {
        'ids': [IDS['FB']],
        'img': WIDE_IMG,
        'content': '一位人資朋友跟我吃飯時講了一件事。她們公司開了三個初階數據分析師職缺，收到兩百多封履歷。面試後，主管來找她說：「我讓 Claude 跑了一下，這三個職位的核心產出，兩個模型加一個 Python 腳本就能處理。」\n\n職缺從三個變一個。兩百多個應徵者裡，大部分剛畢業一兩年的年輕人，履歷上寫的技能恰好就是被砍掉的那兩個職位在做的事。\n\n史丹佛的研究數據更驚人：22-25歲年輕人在高AI暴露職業中就業率掉13%，35-49歲反而升9%。在軟體領域，年輕人跌幅高達20%。\n\n年輕人不是比較弱，是他們被訓練出來的能力，剛好站在AI的射程正中央——標準化知識、SOP執行、考試和背誦。這些恰好是AI最擅長的。\n\n但好消息是：同一項技術，企業選擇「增強」而非「取代」時，年輕人成長反而最快。在製造業的經驗裡，資淺且願意學習的工程師進步最快，因為AI把模式辨識說清楚了，讓他們更快進入判斷的層次。\n\n金絲雀已經在哀鳴。身為父母，你希望怎麼調整孩子的教育方式？若你是教師，怎麼讓花在學生身上的時間更有意義？你若是老闆，怎麼組建新團隊來應對現在？\n\n歡迎交流。全文在 paulkuo.tw\n\n#AI #就業衝擊 #教育轉型 #人機協作 #煤礦裡的金絲雀',
    },
    'IG': {
        'ids': [IDS['IG']],
        'img': SQ_IMG,
        'content': 'AI不是取代最弱的人，而是取代最「標準化」的人。\n\n史丹佛研究：22-25歲就業率跌13%，35-49歲反升9%。年輕人不是能力不足，是被訓練出的能力站在AI射程正中央。\n\n但當企業選擇讓AI增強人，而非取代人——年輕人成長反而最快。\n\n金絲雀已經在哀鳴。你做了什麼改變？\n\n全文連結在 bio 👆\n\n#AI #就業衝擊 #教育轉型 #人機協作 #史丹佛研究',
    },
}

results = []
for platform, data in posts.items():
    ids_json = json.dumps(data['ids'])
    params = {
        'apiKey': API_KEY,
        'category_id': CAT_ID,
        'social_network_id': ids_json,
        'scheduled_date_time': SCHEDULE,
        'content': data['content'],
        'image_url': data['img'],
    }
    encoded = urllib.parse.urlencode(params).encode('utf-8')
    endpoint = BASE + '/scheduleimagepost'
    try:
        req = urllib.request.Request(endpoint, data=encoded, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
        error = resp.get('error', False)
        msg = resp.get('message', str(resp))
        status = 'FAIL' if error else 'OK'
        results.append(f'{platform}: {status} - {msg}')
    except Exception as e:
        results.append(f'{platform}: ERROR - {str(e)}')

for r in results:
    print(r)
