#!/usr/bin/env python3
"""
paulkuo.tw 封面圖壓縮腳本
目標：將 >2MB 的封面圖壓縮到 ~300-500KB
"""

from PIL import Image
import os
import shutil

COVERS_DIR = "public/images/covers"
BACKUP_DIR = "public/images/covers/_backup_originals"
TARGET_MAX_KB = 450
MAX_DIMENSION = 1600

TARGETS = [
    "us-ai-three-year-countdown.jpg",
    "work-trend-index-2025-taiwan.jpg",
    "jd-ai-supply-chain-revolution.jpg",
    "ai-surpass-human-intelligence-six-years.jpg",
]

def compress_image(filepath, target_kb=TARGET_MAX_KB, max_dim=MAX_DIMENSION):
    img = Image.open(filepath)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    w, h = img.size
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        print(f"  尺寸: {w}x{h} → {new_size[0]}x{new_size[1]}")
    lo, hi = 30, 90
    best_quality = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        img.save(filepath, "JPEG", quality=mid, optimize=True)
        size_kb = os.path.getsize(filepath) / 1024
        if size_kb <= target_kb:
            best_quality = mid
            lo = mid + 1
        else:
            hi = mid - 1
    img.save(filepath, "JPEG", quality=best_quality, optimize=True)
    final_kb = os.path.getsize(filepath) / 1024
    return final_kb, best_quality

def main():
    if not os.path.isdir(COVERS_DIR):
        print(f"❌ 找不到 {COVERS_DIR}，請在 repo 根目錄執行此腳本")
        return
    os.makedirs(BACKUP_DIR, exist_ok=True)
    print(f"📁 備份原圖到 {BACKUP_DIR}/\n")
    for filename in TARGETS:
        filepath = os.path.join(COVERS_DIR, filename)
        backup_path = os.path.join(BACKUP_DIR, filename)
        if not os.path.exists(filepath):
            print(f"⚠️  跳過 {filename}（檔案不存在）")
            continue
        original_kb = os.path.getsize(filepath) / 1024
        print(f"🔄 {filename}")
        print(f"  原始: {original_kb:.0f} KB ({original_kb/1024:.1f} MB)")
        shutil.copy2(filepath, backup_path)
        final_kb, quality = compress_image(filepath)
        ratio = (1 - final_kb / original_kb) * 100
        print(f"  壓縮後: {final_kb:.0f} KB (品質={quality}, 縮小 {ratio:.0f}%)")
        print()
    print("✅ 完成！接下來請：")
    print("  git add public/images/covers/")
    print('  git commit -m "chore: compress oversized cover images"')
    print("  git push")

if __name__ == "__main__":
    main()
