#!/usr/bin/env python3
"""
TQEF eval_runner.py — Translation Quality Evaluation Framework
Reads corpus.json, translates via api.paulkuo.tw, scores via Claude Haiku 4.5.
Outputs per-sentence scores + overall average as terminal table + JSON.

Usage:
  python eval_runner.py --dry-run              # Worker mode (default, uses invite code)
  python eval_runner.py                        # Full 29-sentence eval
  ANTHROPIC_API_KEY=sk-... python eval_runner.py  # Direct Anthropic SDK mode
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

anthropic = None
try:
    import anthropic as _anthropic
    anthropic = _anthropic
except ImportError:
    pass

try:
    from tabulate import tabulate
except ImportError:
    tabulate = None

WORKER_URL = "https://api.paulkuo.tw"
CORPUS_PATH = Path(__file__).parent / "public" / "tools" / "tqef" / "corpus.json"
SCORING_MODEL = "claude-haiku-4-5-20251001"

TW_PP = [
    ("阿爾茲海默病","阿茲海默症"),("阿爾茲海默症","阿茲海默症"),("老年癡呆症","失智症"),("磁共振成像","磁振造影"),("磁共振","磁振造影"),("超聲波","超音波"),("線粒體","粒線體"),("氨基酸","胺基酸"),("間充質幹細胞","間質幹細胞"),("間充質","間質"),("細胞因子","細胞激素"),("單克隆抗體","單株抗體"),("多克隆抗體","多株抗體"),("透明質酸","玻尿酸"),("誘導多能幹細胞","誘導性多能幹細胞"),("隨訪","追蹤回診"),("標靶細胞","標的細胞"),("收量","產量"),("傳代次數","繼代數"),("傳代數","繼代數"),("藥物送達系統","藥物遞送系統"),("藥物送達","藥物遞送"),("電解精鍊","電解精煉"),("精鍊","精煉"),("空氣清淨度","空氣潔淨度"),("空氣清潔度","空氣潔淨度"),("成長因子","生長因子"),("阿司匹林","阿斯匹靈"),("維生素","維他命"),("極紫外光刻","EUV 微影"),("深紫外光刻","DUV 微影"),("光刻技術","微影技術"),("光刻機","微影機"),("光刻膠","光阻劑"),("光刻","微影"),("門全環繞結構","環繞式閘極結構"),("門全環繞","環繞式閘極"),("閘極全周圍","環繞式閘極"),("全閘極結構","環繞式閘極結構"),("全閘極","環繞式閘極"),("溝道長度","通道長度"),("芯片","晶片"),("集成電路","積體電路"),("CVD裝置","CVD 設備"),("預防性保全","預防性保養"),("預防保全","預防性保養"),("製造工程","製造製程"),("極紫外光微影","EUV 微影"),("腔室","腔體"),("濕法冶金","濕式精煉法"),("火法冶金","乾式精煉法"),("濕式冶煉法","濕式精煉法"),("濕式冶煉","濕式精煉"),("冶煉","精煉"),("城市礦山","都市礦山"),("碳信用額度","碳權"),("碳信用","碳權"),("透明化","可視化"),("可持續發展","永續發展"),("ESG評價","ESG 評估"),("ESG評等","ESG 評估"),
]

MEDICAL_TRIGGERS = ["治療","クリニック","薬剤","医療","診所","醫療","エクソソーム","幹細胞","MSC","自由診療","再生医療","点鼻薬","スプレー","外泌體","藥劑","噴霧","細胞","抗体","免疫","臨床","投与","処方"]
SEMICONDUCTOR_TRIGGERS = ["ウェーハ","半導体","FinFET","GAA","EUV","CVD","CoWoS","HBM","歩留まり","晶圓","製程","良率","蝕刻","封裝","電晶體"]
CIRCULAR_TRIGGERS = ["リサイクル","回収率","精錬","精煉","カーボン","碳權","ESG","都市鉱山","ライフサイクル","Scope"]
BUSINESS_TRIGGERS = ["契約","見積","納期","発注","商談","取引","NDA","MOU","LOI","ご提案","ご検討","ドラフト","秘密保持"]

def tw_post(text):
    for s,d in TW_PP: text = text.replace(s,d)
    return text

def is_med_ctx(g):
    if not g: return False
    c = " ".join(f"{x.get('term','')} {x.get('translation','')}" for x in g)
    return any(k in c for k in MEDICAL_TRIGGERS)

def detect_ctx(g, src):
    gt = " ".join(f"{x.get('term','')} {x.get('translation','')}" for x in g) if g else ""
    c = f"{gt} {src or ''}"
    return {"med":is_med_ctx(g),"semi":any(k in c for k in SEMICONDUCTOR_TRIGGERS),"circ":any(k in c for k in CIRCULAR_TRIGGERS),"biz":any(k in c for k in BUSINESS_TRIGGERS)}

def build_translate_prompt(g, src):
    p = "You are a professional real-time interpreter. Translate the following into Traditional Chinese (Taiwan). Output ONLY the translated text. Use Traditional Chinese with Taiwanese vocabulary.\nPreserve widely-used English abbreviations (NDA,MOU,LOI,IP,ROI,KPI,ESG,OEM,ODM) as-is."
    if is_med_ctx(g):
        p += "\n\n[MEDICAL/CLINICAL CONTEXT] Apply strictly:\nMSC=間質幹細胞, HSC=造血幹細胞, iPSC=誘導型多能幹細胞, Exosome/EV=外泌體\n製品=產品, 薬物送達システム=藥物遞送系統, リポソーム製劑=脂質體製劑, エクソソーム=外泌體\nOutput: 繁體中文."
    ctx = detect_ctx(g, src)
    if ctx["semi"] and not is_med_ctx(g):
        p += "\n\n[SEMICONDUCTOR] プロセス=製程, ウェーハ=晶圓, 歩留まり=良率, パッケージング=封裝, トランジスタ=電晶體, ロジックチップ=邏輯晶片, 集成電路→積體電路, 芯片→晶片"
    if ctx["circ"] and not is_med_ctx(g) and not ctx["semi"]:
        p += "\n\n[CIRCULAR ECONOMY] 精錬=精煉, 都市鉱山=都市礦山, カーボンクレジット=碳權, 電気銅=電解銅"
    if ctx["biz"] and not is_med_ctx(g) and not ctx["semi"] and not ctx["circ"]:
        p += "\n\n[BUSINESS] 契約書=合約, ドラフト=草稿, 納期=交期, 単価=單價, 初期ロット=初期批次, 秘密保持期間=保密期間"
    if g:
        p += "\nUse these terminology translations: " + ", ".join(f"{x['term']} → {x['translation']}" for x in g) + "."
    return p

def build_judge_prompt(item, actual):
    return f"""Evaluate this Japanese→Traditional Chinese (Taiwan) translation.

## Context
- Industry: {item['industry']}
- Difficulty: {item['difficulty']}

## Texts
- Source (JA): {item['source_ja']}
- Reference: {item['reference_zh_tw']}
- To evaluate: {actual}
- Critical terms: {json.dumps(item.get('critical_terms',{}), ensure_ascii=False)}
- Critical numbers: {json.dumps(item.get('critical_numbers',[]), ensure_ascii=False)}

## Scoring (1-5)
### terminology (40%): Domain terms → Taiwan-standard?
5=all correct 4=mostly 3=1 error 2=2+ errors 1=critical
### fidelity (30%): Complete meaning preserved?
5=fully faithful 4=minor diff 3=one omission 2=multiple 1=severe
### critical_data (20%): Numbers/amounts/dates correct?
5=all correct 4=format diff 3=1 error 2=multiple 1=wrong
### naturalness (10%): Reads like native Taiwanese Chinese?
5=natural 4=occasional 3=noticeable 2=needs re-reading 1=machine

## Output (JSON only):
{{"evaluation":"brief","scores":{{"terminology":0,"fidelity":0,"critical_data":0,"naturalness":0}},"weighted_total":0.0,"errors":[{{"type":"TERM_ERR|CN_TERM|OMISSION|ADDITION|NUM_ERR|DISTORT|UNNATURAL","severity":"critical|major|minor","expected":"","actual":"","note":""}}]}}"""

def call_worker(model, system, user, max_tokens, code):
    r = requests.post(f"{WORKER_URL}/tqef/claude?code={code}", json={"model":model,"max_tokens":max_tokens,"system":system,"user":user}, timeout=60)
    r.raise_for_status()
    return r.json().get("text","")

def parse_score_json(raw):
    raw = raw.strip()
    if raw.startswith("```"): raw = "\n".join(raw.split("\n")[1:])
    if raw.endswith("```"): raw = raw[:raw.rfind("```")]
    result = json.loads(raw.strip())
    s = result.get("scores",{})
    result["weighted_total"] = round(s.get("terminology",0)*0.4 + s.get("fidelity",0)*0.3 + s.get("critical_data",0)*0.2 + s.get("naturalness",0)*0.1, 2)
    return result

def translate_w(src, g, code): return tw_post(call_worker("claude-haiku-4-5-20251001","",build_translate_prompt(g,src)+"\n\n"+src[:2000],1024,code))
def score_w(item, actual, code): return parse_score_json(call_worker(SCORING_MODEL,"You are a professional Japanese-Chinese translation quality evaluator. Output valid JSON only — no markdown, no backticks.",build_judge_prompt(item,actual),2000,code))

def translate_a(src, g, client):
    msg = client.messages.create(model="claude-haiku-4-5-20251001",max_tokens=1024,messages=[{"role":"user","content":build_translate_prompt(g,src)+"\n\n"+src[:2000]}])
    return tw_post(msg.content[0].text)

def score_a(item, actual, client):
    msg = client.messages.create(model=SCORING_MODEL,max_tokens=2000,system="You are a professional Japanese-Chinese translation quality evaluator. Output valid JSON only — no markdown, no backticks.",messages=[{"role":"user","content":build_judge_prompt(item,actual)}])
    return parse_score_json(msg.content[0].text)

def main():
    parser = argparse.ArgumentParser(description="TQEF Evaluation Runner")
    parser.add_argument("--dry-run", action="store_true", help="只跑前 3 句")
    parser.add_argument("--corpus", type=str, default=str(CORPUS_PATH))
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--code", type=str, default="tqef-eval", help="Worker invite code")
    args = parser.parse_args()

    corpus_path = Path(args.corpus)
    if not corpus_path.exists():
        print(f"❌ 找不到 corpus：{corpus_path}"); sys.exit(1)
    with open(corpus_path,"r",encoding="utf-8") as f: corpus = json.load(f)

    total = len(corpus)
    if args.dry_run: corpus = corpus[:3]; print(f"🧪 DRY RUN — 前 3 句（共 {total} 句）\n")
    else: print(f"🔬 完整評估 — {total} 句\n")

    use_worker = True; client = None
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key and anthropic:
        use_worker = False; client = anthropic.Anthropic(api_key=api_key); print("📡 Anthropic SDK\n")
    else: print(f"📡 Worker API (code={args.code})\n")

    results, errors_all = [], []
    for i, item in enumerate(corpus):
        sid = item["id"]; print(f"  [{i+1}/{len(corpus)}] {sid} ...", end=" ", flush=True)
        try:
            tr = translate_w(item["source_ja"],item.get("glossary",[]),args.code) if use_worker else translate_a(item["source_ja"],item.get("glossary",[]),client)
            if not tr: raise ValueError("empty")
            j = score_w(item,tr,args.code) if use_worker else score_a(item,tr,client)
            s,wt,errs = j["scores"],j["weighted_total"],j.get("errors",[])
            results.append({"id":sid,"industry":item["industry"],"difficulty":item["difficulty"],"source_ja":item["source_ja"],"reference_zh_tw":item["reference_zh_tw"],"haiku_output":tr,"judgment":j})
            crits = [e for e in errs if e.get("severity")=="critical"]
            marker = "✓" if wt>=4.0 else ("△" if wt>=3.5 else "✗")
            print(f"{marker} {wt:.2f}  T:{s['terminology']} F:{s['fidelity']} D:{s['critical_data']} N:{s['naturalness']}{f' ⚠ {len(crits)} critical' if crits else ''}")
            errors_all.extend([{**e,"sentence_id":sid} for e in errs if e.get("severity") in ("critical","major")])
            time.sleep(0.3)
        except Exception as e:
            print(f"✗ ERROR: {e}"); results.append({"id":sid,"industry":item["industry"],"error":str(e)})

    scored = [r for r in results if "judgment" in r]
    if not scored: print("\n❌ 無成功評分"); sys.exit(1)

    avg = lambda v: sum(v)/len(v) if v else 0
    overall = avg([r["judgment"]["weighted_total"] for r in scored])
    term_avg = avg([r["judgment"]["scores"]["terminology"] for r in scored])
    fid_avg = avg([r["judgment"]["scores"]["fidelity"] for r in scored])
    data_avg = avg([r["judgment"]["scores"]["critical_data"] for r in scored])
    nat_avg = avg([r["judgment"]["scores"]["naturalness"] for r in scored])
    total_crits = sum(len([e for e in r["judgment"].get("errors",[]) if e.get("severity")=="critical"]) for r in scored)

    print("\n"+"═"*60+"\n📊 TQEF 評估結果\n"+"═"*60)
    headers = ["ID","Industry","Overall","Term","Fid","Data","Nat","Crit"]
    rows = []
    for r in scored:
        j,s = r["judgment"],r["judgment"]["scores"]
        c = len([e for e in j.get("errors",[]) if e.get("severity")=="critical"])
        rows.append([r["id"],r["industry"].replace("_"," "),f"{j['weighted_total']:.2f}",s["terminology"],s["fidelity"],s["critical_data"],s["naturalness"],c or ""])
    if tabulate: print(tabulate(rows,headers=headers,tablefmt="simple"))
    else:
        print("  ".join(f"{h:<10}" for h in headers))
        for row in rows: print("  ".join(f"{str(v):<10}" for v in row))

    industries = {}
    for r in scored:
        ind = r["industry"]
        if ind not in industries: industries[ind]={"s":[],"t":[]}
        industries[ind]["s"].append(r["judgment"]["weighted_total"]); industries[ind]["t"].append(r["judgment"]["scores"]["terminology"])

    print(f"\n{'─'*60}\n🏭 產業分析\n{'─'*60}")
    for ind in sorted(industries):
        d = industries[ind]; print(f"  {ind.replace('_',' '):<24} Overall: {avg(d['s']):.2f}  Term: {avg(d['t']):.2f}  ({len(d['s'])} 句)")

    status = "PASS ✅" if overall>=4.0 and total_crits==0 else "WARNING ⚠️"
    print(f"\n{'═'*60}")
    print(f"  Overall:       {overall:.2f}  {status}")
    print(f"  Terminology:   {term_avg:.2f}  (40%)")
    print(f"  Fidelity:      {fid_avg:.2f}  (30%)")
    print(f"  Critical Data: {data_avg:.2f}  (20%)")
    print(f"  Naturalness:   {nat_avg:.2f}  (10%)")
    print(f"  Critical Errs: {total_crits}")
    print(f"  Evaluated:     {len(scored)}/{len(corpus)}")
    print(f"{'═'*60}")

    if errors_all:
        print(f"\n⚠️ 嚴重錯誤 ({len(errors_all)} 項):")
        for e in errors_all:
            print(f"  [{e['sentence_id']}] {e.get('severity','').upper()} {e.get('type','')}")
            print(f"    期望「{e.get('expected','')}」→ 實際「{e.get('actual','')}」")
            if e.get("note"): print(f"    {e['note']}")

    out_data = {"timestamp":time.strftime("%Y-%m-%dT%H:%M:%S"),"mode":"dry-run" if args.dry_run else "full","corpus_size":total,"evaluated":len(scored),"summary":{"overall":round(overall,2),"terminology":round(term_avg,2),"fidelity":round(fid_avg,2),"critical_data":round(data_avg,2),"naturalness":round(nat_avg,2),"critical_errors":total_crits,"status":status},"industry_breakdown":{ind:{"overall":round(avg(d["s"]),2),"terminology":round(avg(d["t"]),2),"count":len(d["s"])} for ind,d in sorted(industries.items())},"results":results}
    out_path = args.output or f"tqef-{time.strftime('%Y-%m-%d')}{'-dryrun' if args.dry_run else ''}.json"
    with open(out_path,"w",encoding="utf-8") as f: json.dump(out_data,f,ensure_ascii=False,indent=2)
    print(f"\n💾 {out_path}")

if __name__ == "__main__": main()
