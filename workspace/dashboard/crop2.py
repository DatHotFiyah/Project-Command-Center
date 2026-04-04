from PIL import Image
import os

img_path = r"E:\openclaw\.openclaw\media\inbound\ccdd18a4-0a62-4eb3-9919-b869dfec5066.png"
out_dir = r"E:\openclaw\workspace\dashboard\assets\characters"

img = Image.open(img_path).convert("RGBA")

# Remove white background
data = img.getdata()
new_data = []
for item in data:
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
img.putdata(new_data)

width, height = img.size
w4 = width // 4

for i in range(4):
    box = (i * w4, 0, (i+1) * w4, height)
    crop = img.crop(box)
    
    # get active area
    bbox = crop.getbbox()
    if bbox:
        # Just grab the top chunk since some pixel might be far down
        left, top, right, bottom = bbox
        if (bottom - top) > 400: # if it's too tall, limit it
            bottom = top + 370 
        final_crop = crop.crop((left, top, right, bottom))
        # Ensure it scales to standard 90x128 proportion if possible or just let CSS do it
        final_crop.save(os.path.join(out_dir, f"new_char_{i+1}.png"))
        print(f"Saved new_char_{i+1}.png, size: {final_crop.size}")
