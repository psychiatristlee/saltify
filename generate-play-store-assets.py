#!/usr/bin/env python3
"""Play Store 에셋 생성 스크립트
- 앱 아이콘: 512x512 PNG (Play Store)
- 앱 아이콘: 600x600 PNG (앱인토스)
- 그래픽 이미지 (Feature Graphic): 1024x500 PNG
- 썸네일: 1932x828 PNG
- 7인치 태블릿 스크린샷: 1080x1920 (9:16)
- 10인치 태블릿 스크린샷: 1440x2560 (9:16)
"""

import os
import glob
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "play-store-assets"
SCREENSHOT_DIR = "appstore-screenshots"
ICON_SRC = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
FOREGROUND_SRC = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"
BG_COLOR = (255, 240, 212)  # #FFF0D4

os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. 앱 아이콘 512x512
print("앱 아이콘 생성 중...")
icon = Image.open(ICON_SRC).convert("RGBA")

# 512x512
icon_512 = icon.resize((512, 512), Image.LANCZOS)
icon_512.save(os.path.join(OUTPUT_DIR, "app-icon-512x512.png"), "PNG")
print(f"  -> {OUTPUT_DIR}/app-icon-512x512.png")

# 600x600 (앱인토스용)
icon_600 = icon.resize((600, 600), Image.LANCZOS)
icon_600.save(os.path.join(OUTPUT_DIR, "app-icon-600x600.png"), "PNG")
print(f"  -> {OUTPUT_DIR}/app-icon-600x600.png")

# 2. 그래픽 이미지 (Feature Graphic) 1024x500
print("그래픽 이미지 생성 중 (1024x500)...")
feature = Image.new("RGBA", (1024, 500), BG_COLOR + (255,))

# 빵 이미지 로드 후 배경색을 투명으로 치환하여 자연스럽게 블렌딩
bread = Image.open(ICON_SRC).convert("RGBA")
pixels = bread.load()
bg_r, bg_g, bg_b = BG_COLOR
for y in range(bread.height):
    for x in range(bread.width):
        r, g, b, a = pixels[x, y]
        # 배경색과의 색상 거리 계산
        dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
        if dist < 30:
            # 배경색에 가까울수록 완전 투명
            pixels[x, y] = (r, g, b, 0)
        elif dist < 60:
            # 경계 부분은 부분 투명 (안티앨리어싱)
            alpha = int(255 * (dist - 30) / 30)
            pixels[x, y] = (r, g, b, min(a, alpha))

# 빵 이미지를 적절한 크기로 리사이즈
target_h = int(500 * 0.72)
ratio = target_h / bread.height
target_w = int(bread.width * ratio)
bread_resized = bread.resize((target_w, target_h), Image.LANCZOS)

# 중앙에서 살짝 왼쪽에 빵 배치
bread_x = (1024 // 2 - target_w // 2) - 130
bread_y = (500 - target_h) // 2
feature.paste(bread_resized, (bread_x, bread_y), bread_resized)

# 텍스트 추가
draw = ImageDraw.Draw(feature)

# 한글 지원 폰트 (AppleSDGothicNeo) 사용
korean_font_path = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
en_font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
en_font_regular = "/System/Library/Fonts/Supplemental/Arial.ttf"

try:
    # AppleSDGothicNeo Bold (index 6)
    title_font = ImageFont.truetype(korean_font_path, 72, index=6)
    sub_font = ImageFont.truetype(en_font_path if os.path.exists(en_font_path) else korean_font_path, 28)
except Exception:
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()

# 텍스트 위치 (빵 오른쪽)
text_x = 1024 // 2 + 50
text_color = (139, 90, 43)  # 갈색 톤

# 앱 이름
title = "솔트, 빵"
bbox = draw.textbbox((0, 0), title, font=title_font)
title_h = bbox[3] - bbox[1]
title_y = (500 - title_h) // 2
draw.text((text_x, title_y), title, fill=text_color, font=title_font)

# RGBA -> RGB 변환 후 저장
feature_rgb = Image.new("RGB", feature.size, BG_COLOR)
feature_rgb.paste(feature, mask=feature.split()[3])
feature_rgb.save(os.path.join(OUTPUT_DIR, "feature-graphic-1024x500.png"), "PNG")
print(f"  -> {OUTPUT_DIR}/feature-graphic-1024x500.png")

# 3. 썸네일 1932x828
print("썸네일 생성 중 (1932x828)...")
thumbnail = Image.new("RGBA", (1932, 828), BG_COLOR + (255,))

# 빵 이미지 로드 후 배경색을 투명으로 치환
bread_thumb = Image.open(ICON_SRC).convert("RGBA")
pixels_thumb = bread_thumb.load()
for y in range(bread_thumb.height):
    for x in range(bread_thumb.width):
        r, g, b, a = pixels_thumb[x, y]
        dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
        if dist < 30:
            pixels_thumb[x, y] = (r, g, b, 0)
        elif dist < 60:
            alpha = int(255 * (dist - 30) / 30)
            pixels_thumb[x, y] = (r, g, b, min(a, alpha))

# 빵 이미지 리사이즈 (썸네일용)
thumb_h = int(828 * 0.65)
thumb_ratio = thumb_h / bread_thumb.height
thumb_w = int(bread_thumb.width * thumb_ratio)
bread_thumb_resized = bread_thumb.resize((thumb_w, thumb_h), Image.LANCZOS)

# 중앙에서 왼쪽에 빵 배치
thumb_bread_x = (1932 // 2 - thumb_w // 2) - 200
thumb_bread_y = (828 - thumb_h) // 2
thumbnail.paste(bread_thumb_resized, (thumb_bread_x, thumb_bread_y), bread_thumb_resized)

# 텍스트 추가
draw_thumb = ImageDraw.Draw(thumbnail)

try:
    thumb_title_font = ImageFont.truetype(korean_font_path, 120, index=6)
except Exception:
    thumb_title_font = ImageFont.load_default()

# 텍스트 위치 (빵 오른쪽)
thumb_text_x = 1932 // 2 + 80
thumb_text_color = (139, 90, 43)

# 앱 이름
thumb_title = "솔트, 빵"
bbox_thumb = draw_thumb.textbbox((0, 0), thumb_title, font=thumb_title_font)
thumb_title_h = bbox_thumb[3] - bbox_thumb[1]
thumb_title_y = (828 - thumb_title_h) // 2
draw_thumb.text((thumb_text_x, thumb_title_y), thumb_title, fill=thumb_text_color, font=thumb_title_font)

# RGBA -> RGB 변환 후 저장
thumbnail_rgb = Image.new("RGB", thumbnail.size, BG_COLOR)
thumbnail_rgb.paste(thumbnail, mask=thumbnail.split()[3])
thumbnail_rgb.save(os.path.join(OUTPUT_DIR, "thumbnail-1932x828.png"), "PNG")
print(f"  -> {OUTPUT_DIR}/thumbnail-1932x828.png")

# 4. 태블릿 스크린샷 생성 (iPhone 스크린샷 -> 태블릿 비율로 변환)
TABLET_SIZES = {
    "7inch": (1080, 1920),   # 9:16
    "10inch": (1440, 2560),  # 9:16
}
APP_BG = (255, 248, 231)  # #fff8e7 (앱 배경색)

# 상태바(~130px)와 홈 인디케이터(~100px) 크롭 영역 (1242x2688 기준)
STATUS_BAR_CROP = 130
HOME_INDICATOR_CROP = 100

phone_screenshots = sorted(glob.glob(os.path.join(SCREENSHOT_DIR, "Simulator Screenshot - iPhone*.png")))

if phone_screenshots:
    print(f"\n태블릿 스크린샷 생성 중... (소스: {len(phone_screenshots)}장)")

    for size_name, (tw, th) in TABLET_SIZES.items():
        out_dir = os.path.join(OUTPUT_DIR, f"tablet-{size_name}")
        os.makedirs(out_dir, exist_ok=True)
        print(f"\n  [{size_name} 태블릿] {tw}x{th}")

        for i, src_path in enumerate(phone_screenshots, 1):
            img = Image.open(src_path).convert("RGB")
            sw, sh = img.size

            # 상태바 & 홈 인디케이터 크롭
            img = img.crop((0, STATUS_BAR_CROP, sw, sh - HOME_INDICATOR_CROP))
            sw, sh = img.size

            # 타겟 캔버스에 맞게 스케일 계산 (컨텐츠 영역은 캔버스의 90% 내)
            content_w = int(tw * 0.85)
            content_h = int(th * 0.90)
            scale = min(content_w / sw, content_h / sh)
            new_w = int(sw * scale)
            new_h = int(sh * scale)

            img_resized = img.resize((new_w, new_h), Image.LANCZOS)

            # 배경색 캔버스에 중앙 배치
            canvas = Image.new("RGB", (tw, th), APP_BG)
            x = (tw - new_w) // 2
            y = (th - new_h) // 2
            canvas.paste(img_resized, (x, y))

            out_path = os.path.join(out_dir, f"tablet-{size_name}-{i}.png")
            canvas.save(out_path, "PNG")
            size_kb = os.path.getsize(out_path) / 1024
            print(f"    -> {out_path} ({size_kb:.0f} KB)")
else:
    print("\n경고: iPhone 스크린샷을 찾을 수 없습니다.")

# 파일 크기 확인
print("\n=== 생성된 에셋 요약 ===")
for fname in ["app-icon-512x512.png", "app-icon-600x600.png", "feature-graphic-1024x500.png", "thumbnail-1932x828.png"]:
    fpath = os.path.join(OUTPUT_DIR, fname)
    size_kb = os.path.getsize(fpath) / 1024
    print(f"  {fname}: {size_kb:.1f} KB")

for size_name, (tw, th) in TABLET_SIZES.items():
    out_dir = os.path.join(OUTPUT_DIR, f"tablet-{size_name}")
    if os.path.isdir(out_dir):
        files = sorted(os.listdir(out_dir))
        print(f"  tablet-{size_name}/: {len(files)}장 ({tw}x{th})")

print("\nPlay Store 에셋 생성 완료!")
