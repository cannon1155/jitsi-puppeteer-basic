import time
import os

print('beginning experiment...')

for i in range(15):
    no_clients = i+1
    print(f'\n=== RUNNING WITH {no_clients} CLIENTS ===')
    os.system(f'sudo docker-compose up --scale jitsi-puppet-video={no_clients}')
    time.sleep(3600) # wait an hour for the measurements to be taken
    time.sleep(120)  # wait two minutes for the machine to return to baseline

print('finished experiment.')
