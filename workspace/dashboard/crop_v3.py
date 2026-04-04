import os
import glob
from PIL import Image

src_dir = r"E:\openclaw\.openclaw\media\tool-image-generation"
dst_dir = r"E:\openclaw\workspace\dashboard\assets"

files = [
    "sym_circuit_v2---ed12e670-2e1a-4497-9112-b4925a01263c.png",
]

for f in files:
    img_path = os.path.join(src_dir, f)
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []

    for item in data:
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    out_name = f.split("---")[0] + ".png"
    out_path = os.path.join(dst_dir, "symbols", out_name)
    img.save(out_path)
    print(f"Saved {out_name}, size: {img.size}")
