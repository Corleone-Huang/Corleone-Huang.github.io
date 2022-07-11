import os

from PIL import Image

path = os.path.join("./pics/pdf.gif")

img = Image.open(path)

 

# print(img.format)        # PNG

print(img.size)          # (3500, 3500)