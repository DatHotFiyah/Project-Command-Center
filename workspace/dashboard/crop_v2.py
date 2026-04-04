import os
import glob
from PIL import Image

src_dir = r"E:\openclaw\.openclaw\media\tool-image-generation"
dst_dir = r"E:\openclaw\workspace\dashboard\assets"

files = [
    "sym_lock_v2---f631d501-f632-4ce5-afc0-e27c394a710f.png",
    "sym_signal_v2---b35465ee-43e8-4b89-856e-9f534f7acdd9.png",
    "coffee_station_v2---0f03e3bc-a267-4261-87c4-77c63669961b.png",
    "whiteboard_v2---e61fe979-8daa-4b12-ab9f-ec9a2c5d9fb3.png",
    "sym_db_v2---98b75ade-0631-4eee-af89-3b9254352226.png",
    "server_rack_v2---9a500903-f9b9-4358-95e3-9ddb79165a43.png"
]

for f in files:
    img_path = os.path.join(src_dir, f)
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []

    # White background removal (threshold 230)
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
    if out_name.startswith("sym_"):
        out_path = os.path.join(dst_dir, "symbols", out_name)
    else:
        out_path = os.path.join(dst_dir, "furniture", out_name)
        
    img.save(out_path)
    print(f"Saved {out_name}, size: {img.size}")
