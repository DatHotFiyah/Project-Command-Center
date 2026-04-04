from PIL import Image
import os

img_path = r"E:\openclaw\.openclaw\media\inbound\ccdd18a4-0a62-4eb3-9919-b869dfec5066.png"
out_dir = r"E:\openclaw\workspace\dashboard\assets\characters"

img = Image.open(img_path).convert("RGBA")

# Remove white background
data = img.getdata()
new_data = []
for item in data:
    # If the pixel is very close to white, make it transparent
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
img.putdata(new_data)

# The image is probably 1024x1024, with 4 characters in a row.
# Let's crop into 4 equal sections: x=0..256, 256..512, 512..768, 768..1024
width, height = img.size
w4 = width // 4

for i in range(4):
    box = (i * w4, 0, (i+1) * w4, height)
    crop = img.crop(box)
    
    # Trim transparent borders to get exactly the character
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
        # Save
        crop.save(os.path.join(out_dir, f"new_char_{i+1}.png"))
        print(f"Saved new_char_{i+1}.png, size: {crop.size}")
    else:
        print(f"Empty crop for region {i}")
