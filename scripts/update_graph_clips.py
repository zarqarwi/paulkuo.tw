#!/usr/bin/env python3
import json

GRAPH_PATH = '/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/graph.json'

with open(GRAPH_PATH, 'r') as f:
    g = json.load(f)

new_nodes = [
    {"id": "clip-claude-agent-sdk-building-agents", "title": "Building Agents with the Claude Agent SDK", "type": "source", "pillar": "ai", "visibility": "public"},
    {"id": "clip-pope-leo-xiv-balanced-view-ai", "title": "教宗 Leo XIV 對人工智慧的平衡立場", "type": "source", "pillar": "faith", "visibility": "public"},
    {"id": "clip-us-dol-ai-literacy-framework", "title": "美國勞工部 AI 素養框架", "type": "source", "pillar": "life", "visibility": "public"},
    {"id": "clip-taiwan-semiconductor-water-sustainability", "title": "台灣半導體產業的水資源永續挑戰", "type": "source", "pillar": "circular", "visibility": "public"},
    {"id": "clip-pcb-circular-economy-profitability", "title": "PCB 廢棄物回收的循環經濟獲利模型", "type": "source", "pillar": "circular", "visibility": "public"},
    {"id": "clip-long-tail-of-ai-contrary", "title": "AI 長尾效應：傳統企業的 AI 採用才是主戰場", "type": "source", "pillar": "startup", "visibility": "public"},
    {"id": "clip-comfort-trap-brain-sabotage", "title": "舒適圈陷阱：大腦如何阻礙你成長", "type": "source", "pillar": "life", "visibility": "public"},
    {"id": "clip-datacamp-ai-literacy-framework-2026", "title": "DataCamp 2026 AI 與資料素養框架", "type": "source", "pillar": "life", "visibility": "public"},
]

new_edges = [
    {"source": "clip-claude-agent-sdk-building-agents", "target": "build-for-models"},
    {"source": "clip-claude-agent-sdk-building-agents", "target": "human-ai-collaboration"},
    {"source": "clip-claude-agent-sdk-building-agents", "target": "one-person-team"},
    {"source": "clip-claude-agent-sdk-building-agents", "target": "ai-agent-economy"},
    {"source": "clip-pope-leo-xiv-balanced-view-ai", "target": "human-judgment-in-ai-era"},
    {"source": "clip-us-dol-ai-literacy-framework", "target": "ai-skill-methodology"},
    {"source": "clip-us-dol-ai-literacy-framework", "target": "ai-education"},
    {"source": "clip-us-dol-ai-literacy-framework", "target": "skill-development"},
    {"source": "clip-us-dol-ai-literacy-framework", "target": "human-judgment-in-ai-era"},
    {"source": "clip-taiwan-semiconductor-water-sustainability", "target": "circular-economy-practice"},
    {"source": "clip-pcb-circular-economy-profitability", "target": "circular-economy-practice"},
    {"source": "clip-long-tail-of-ai-contrary", "target": "heavy-tail-distribution"},
    {"source": "clip-long-tail-of-ai-contrary", "target": "ai-agent-economy"},
    {"source": "clip-long-tail-of-ai-contrary", "target": "enterprise-ai-adoption"},
    {"source": "clip-comfort-trap-brain-sabotage", "target": "steady-state-survival-trap"},
    {"source": "clip-comfort-trap-brain-sabotage", "target": "skill-development"},
    {"source": "clip-datacamp-ai-literacy-framework-2026", "target": "ai-skill-methodology"},
    {"source": "clip-datacamp-ai-literacy-framework-2026", "target": "skill-development"},
    {"source": "clip-datacamp-ai-literacy-framework-2026", "target": "human-judgment-in-ai-era"},
]

# Check for duplicates before adding
existing_ids = {n['id'] for n in g['nodes']}
for n in new_nodes:
    if n['id'] not in existing_ids:
        g['nodes'].append(n)

existing_edges = {(e['source'], e['target']) for e in g['edges']}
for e in new_edges:
    if (e['source'], e['target']) not in existing_edges:
        g['edges'].append(e)

with open(GRAPH_PATH, 'w') as f:
    json.dump(g, f, ensure_ascii=False, indent=2)

print(f"Done. Nodes: {len(g['nodes'])}, Edges: {len(g['edges'])}")
