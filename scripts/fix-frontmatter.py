#!/usr/bin/env python3
"""Fix YAML frontmatter quoting for fields containing colons."""
import os
import glob

base = 'src/content/articles'
fixed = 0

for p in glob.glob(os.path.join(base, '**', '*.md'), recursive=True):
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    
    if not c.startswith('---'):
        continue
    
    try:
        end = c.index('---', 3)
    except ValueError:
        continue
    
    fm = c[3:end]
    body = c[end:]
    changed = False
    lines = []
    
    for line in fm.split('\n'):
        for fld in ['title: ', 'description: ']:
            if line.startswith(fld):
                val = line[len(fld):]
                if not (val.startswith('"') or val.startswith("'")):
                    if ':' in val:
                        val = val.replace('"', "'")
                        line = fld + '"' + val + '"'
                        changed = True
                break
        lines.append(line)
    
    if changed:
        with open(p, 'w', encoding='utf-8') as f:
            f.write('---' + '\n'.join(lines) + body)
        fixed += 1
        print(f'  Fixed: {p}')

print(f'Fixed {fixed} YAML frontmatter files')
