import time
import subprocess

print('beginning experiment...')
subprocess.run(['xhost', '+'])

for i in range(15):
    no_clients = i+1
    print(f'\n=== RUNNING WITH {no_clients} CLIENTS === ')
    subprocess.run(['docker-compose', 'up', '--scale', 'jitsi-full=' + str(no_clients), '--scale', 'jitsi-puppet-video=0'])
    print(f' ...done. Waiting for cooldown.')
    time.sleep(120)  # wait two minutes for the machine to return to baseline

subprocess.run(['xhost', '-'])
print('finished experiment.')
