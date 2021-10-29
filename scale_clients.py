import time
import subprocess

print('beginning experiment...')

for i in range(15):
    no_clients = i+1
    print(f'\n=== RUNNING WITH {no_clients} CLIENTS === ')
    subprocess.run(['docker-compose', 'up', '--scale', 'jitsi-full=' + str(no_clients)])
    print(f' ...done. Waiting for cooldown.')
    time.sleep(120)  # wait two minutes for the machine to return to baseline

print('finished experiment.')
