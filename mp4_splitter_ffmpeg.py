import os
import sys

# filename should not include prefix!
filename = sys.argv[1]

# default settings
# os.system(f'ffmpeg -i \"media/{filename}.mp4\" -pix_fmt yuv420p -vf scale=320:180 -r 15 -map \"0:v\" \"media/{filename}.y4m\"')
# os.system(f'ffmpeg -i \"media/{filename}.mp4\" -af asetrate=48000,aresample=48000 \"media/{filename}.wav\"')

# custom settings
os.system(f'ffmpeg -i \"media/{filename}.mp4\" -pix_fmt yuv420p -map \"0:v\" \"media/{filename}.y4m\"')
os.system(f'ffmpeg -i \"media/{filename}.mp4\" -af asetrate=48000,aresample=48000 \"media/{filename}.wav\"')

print('Finished converting', filename, 'mp4')
