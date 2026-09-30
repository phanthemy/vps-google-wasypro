from PIL import Image
import numpy as np

src = '/var/www/wasypro/wasypro_logo_original.png'
img = Image.open(src).convert('RGBA')
print(f'Original size: {img.size}')

target_w, target_h = 400, 96

# Resize keeping aspect ratio, fit within 400x96
ratio = min(target_w / img.width, target_h / img.height)
new_w = int(img.width * ratio)
new_h = int(img.height * ratio)
resized = img.resize((new_w, new_h), Image.LANCZOS)

# Light version (transparent background)
light = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 0))
paste_x = (target_w - new_w) // 2
paste_y = (target_h - new_h) // 2
light.paste(resized, (paste_x, paste_y), resized)
light.save('/var/www/wasypro/zalo_logo_light.png')
print(f'Light logo saved: {light.size}')

# Dark version (same logo, transparent background - works on both)
dark = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
dark.paste(resized, (paste_x, paste_y), resized)
dark.save('/var/www/wasypro/zalo_logo_dark.png')
print(f'Dark logo saved: {dark.size}')
