import sys,struct,wave
import numpy as np
pcm="/tmp/rwsnd.pcm"
raw=open(pcm,"rb").read()
a=np.frombuffer(raw,dtype="<i2").astype(np.float32)
rate=44100
dur=len(a)/rate
print(f"samples={len(a)} dur={dur:.1f}s peak={np.abs(a).max():.0f} rms={np.sqrt((a**2).mean()):.1f}")
# per-1s segment RMS/peak to locate sound activity
seg=rate
for i in range(0,len(a),seg):
    ch=a[i:i+seg]
    if len(ch)==0: continue
    pk=np.abs(ch).max(); rms=np.sqrt((ch**2).mean())
    bar="#"*int(min(40,rms/50))
    if pk>5:
        print(f"t={i//rate:3d}s peak={pk:6.0f} rms={rms:7.1f} {bar}")
# write a wav for listening
w=wave.open("/tmp/rwsnd.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
w.writeframes(a.astype("<i2").tobytes()); w.close()
print("wrote /tmp/rwsnd.wav")
