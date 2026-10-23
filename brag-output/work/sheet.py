import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob('stills/*.jpg'), key=lambda f: float(f.split('t')[-1][:-4]))
cols, w, h = 3, 640, 360
for s in range(0, len(files), 12):
    chunk = files[s:s+12]
    rows = (len(chunk)+cols-1)//cols
    sheet = Image.new('RGB', (cols*w, rows*h), 'black')
    for i, f in enumerate(chunk):
        im = Image.open(f).resize((w, h))
        d = ImageDraw.Draw(im); d.rectangle([0,0,90,26], fill='black'); d.text((6,6), f.split('t')[-1][:-4]+'s', fill='yellow')
        sheet.paste(im, ((i%cols)*w, (i//cols)*h))
    sheet.save(f'sheet{s//12}.jpg', quality=88)
print('ok')
