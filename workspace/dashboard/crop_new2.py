from PIL import Image
import os

img_path = r"E:\openclaw\.openclaw\media\inbound\f81fdbe7-4d7a-4695-8281-e5f398687477.png"
out_dir = r"E:\openclaw\workspace\dashboard\assets\characters"

img = Image.open(img_path).convert("RGBA")
data = img.getdata()
new_data = []

# White background removal (threshold 240)
for item in data:
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
img.putdata(new_data)

width, height = img.size
w4 = width // 4

roles = ['green_dev', 'pink_manager', 'blue_designer', 'orange_admin']

for i in range(4):
    box = (i * w4, 0, (i+1) * w4, height)
    crop = img.crop(box)
    
    bbox = crop.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        if bottom - top > 700:
            bottom = top + 682 # Limit to max height
        crop = crop.crop((left, top, right, bottom))
        out_name = f"atari_char_{roles[i]}.png"
        out_path = os.path.join(out_dir, out_name)
        crop.save(out_path)
        print(f"Saved {out_name}, size: {crop.size}")
