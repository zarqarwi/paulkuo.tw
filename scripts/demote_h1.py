#!/usr/bin/env python3
"""
Demote all h1 headings (# ) to h2 (## ) in markdown article files.
Only modifies lines AFTER the frontmatter (second ---).
Also demotes ## -> ###, ### -> ####, etc. to maintain hierarchy.
"""
import os
import re
import glob

ARTICLES_DIR = "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/articles"

def demote_headings(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split frontmatter from body
    parts = content.split('---', 2)
    if len(parts) < 3:
        return False  # No frontmatter
    
    frontmatter = parts[1]
    body = parts[2]
    
    # Check if body has any h1 (# not followed by another #)
    if not re.search(r'^# [^#]', body, re.MULTILINE):
        return False
    
    # Demote all headings by one level: # -> ##, ## -> ###, ### -> ####, etc.
    # Process from highest to lowest to avoid double-demoting
    new_body = body
    for level in range(5, 0, -1):  # ##### -> ######, ..., # -> ##
        pattern = r'^' + '#' * level + r' '
        replacement = '#' * (level + 1) + ' '
        new_body = re.sub(pattern, replacement, new_body, flags=re.MULTILINE)
    
    if new_body == body:
        return False
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f'---{frontmatter}---{new_body}')
    
    return True

# Find all .md files recursively
md_files = glob.glob(os.path.join(ARTICLES_DIR, '**', '*.md'), recursive=True)
modified = 0
for fp in sorted(md_files):
    if demote_headings(fp):
        modified += 1
        print(f"  ✓ {os.path.relpath(fp, ARTICLES_DIR)}")

print(f"\nDone: {modified} files modified out of {len(md_files)} total.")
