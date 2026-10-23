import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
import wave

SR = 48000
DUR = 21.5
N = int(SR * DUR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def idx(t): return int(round(t * SR))

dry = np.zeros((N, 2))   # direct signal
send = np.zeros((N, 2))  # reverb send

def place(buf, t0, sig, gain=1.0, pan=0.0):
    i = idx(t0)
    if i >= N: return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414

def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)

def env_adsr(n, a, d, s, r, sus_len):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, int(sus_len * SR) - a_n - d_n)
    e = np.concatenate([np.linspace(0, 1, a_n, endpoint=False), np.linspace(1, s, d_n, endpoint=False), np.full(s_n, s), np.linspace(s, 0, r_n)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))

# ── harmony ─────────────────────────────────────────────
CH = {
    'Am': [57, 60, 64], 'F': [57, 60, 65], 'C': [55, 60, 64], 'G': [55, 59, 62],
}
ROOT = {'Am': 45, 'F': 41, 'C': 48, 'G': 43}
TL = [(0, 2, 'F'), (2, 3, 'G'), (3, 5, 'Am'), (5, 7, 'F'), (7, 9, 'C'), (9, 11, 'G'), (11, 13, 'Am'),
      (13, 15, 'F'), (15, 17, 'C'), (17, 19, 'F'), (19, 20, 'G'), (20, DUR, 'C')]
def chord_at(t):
    for a, b, c in TL:
        if a <= t < b: return c
    return 'C'

# ── kick times & sidechain ──────────────────────────────
kicks = [3.0 + 0.5 * k for k in range(int((20.0 - 3.0) / 0.5) + 1)]
kicks = [k for k in kicks if not (16.5 <= k < 17.0)]
duck = np.ones(N)
for k in kicks:
    i = idx(k); n = int(0.35 * SR)
    seg = 1 - 0.55 * np.exp(-np.arange(n) / (0.09 * SR))
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: N - i] if i + n > N else seg)

# ── pad ─────────────────────────────────────────────────
pad = np.zeros(N)
for a, b, c in TL:
    n = idx(b) - idx(a) + int(0.6 * SR)
    tt = np.arange(n) / SR
    sig = np.zeros(n)
    for m in CH[c]:
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            for h in range(1, 7):
                sig += np.sin(2 * np.pi * f * h * tt + rng.uniform(0, 6.28)) / (h ** 1.3)
    sig *= env_adsr(n, 0.35 if a > 0 else 0.6, 0.3, 0.85, 0.6, b - a)
    seg = pad[idx(a):idx(a) + n]
    seg += sig[: len(seg)]
pad = lp(pad, 3000) / 14
pad_fade = np.clip(t_all / 1.2, 0, 1)
place(dry, 0, pad * duck * pad_fade, 0.26, -0.1)
place(send, 0, pad * duck * pad_fade, 0.12)

# ── arp (8ths, plucked) ─────────────────────────────────
arp = np.zeros(N)
pattern = [0, 1, 2, 3, 2, 1, 3, 2]
for k in range(int(DUR / 0.25)):
    t0 = k * 0.25
    if t0 >= 20.0: break
    c = chord_at(t0 + 0.01)
    notes = CH[c] + [CH[c][0] + 12]
    m = notes[pattern[k % 8]] + 12
    n = int(0.5 * SR); tt = np.arange(n) / SR
    f = hz(m)
    sig = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) + 0.12 * np.sin(2 * np.pi * 3 * f * tt) + 0.07 * np.sin(2 * np.pi * 4 * f * tt) + 0.04 * np.sin(2 * np.pi * 5 * f * tt))
    sig *= np.exp(-tt / 0.16) * np.minimum(1, tt / 0.004)
    acc = 1.0 if k % 2 == 0 else 0.72
    arp[idx(t0):idx(t0) + n] += sig[: max(0, min(n, N - idx(t0)))] * acc
# open the filter over the intro: dark at first, full at the drop
cut = np.where(t_all < 3.0, 500 + (t_all / 3.0) ** 2 * 5500, 6000)
arp_dark, arp_bright = lp(arp, 600), lp(arp, 6000)
mix = np.clip((cut - 500) / 5500, 0, 1)
arp = arp_dark * (1 - mix) + arp_bright * mix
arp_gain = np.where(t_all < 3.0, 0.5 + 0.5 * t_all / 3.0, 1.0)
place(dry, 0, arp * duck * arp_gain, 0.2, 0.25)
place(send, 0, arp * duck * arp_gain, 0.14)

# ── bass ────────────────────────────────────────────────
bass = np.zeros(N)
for k in range(int((20.0 - 3.0) / 0.25) + 1):
    t0 = 3.0 + k * 0.25
    if 16.5 <= t0 < 17.0: continue
    c = chord_at(t0 + 0.01); f = hz(ROOT[c])
    n = int(0.24 * SR); tt = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)
    sig *= np.minimum(1, tt / 0.006) * np.exp(-tt / 0.22) * np.clip((0.24 - tt) / 0.02, 0, 1)
    bass[idx(t0):idx(t0) + n] += sig[: max(0, min(n, N - idx(t0)))] * (1.0 if k % 2 else 0.8)
# final sustained root
n = int(1.5 * SR); tt = np.arange(n) / SR; f = hz(36)
bass[idx(20.0):idx(20.0) + n] += (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.7)[: n]
place(dry, 0, hp(lp(bass, 900), 45) * duck, 0.13)

# ── drums ───────────────────────────────────────────────
def kick():
    n = int(0.42 * SR); tt = np.arange(n) / SR
    f = 46 + 110 * np.exp(-tt / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-tt / 0.17)
    s += lp(rng.standard_normal(n), 3000) * np.exp(-tt / 0.004) * 0.25
    return s
K = kick()
K = hp(K, 38)
for k in kicks: place(dry, k, K, 0.36)
place(dry, 20.0, K, 0.18)

def clap():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 5000)
    e = np.exp(-tt / 0.06)
    for d in (0.0, 0.011, 0.022): e += 0.6 * np.exp(-np.clip(tt - d, 0, None) / 0.008) * (tt >= d)
    return nz * e / 3
CL = clap()
claps = [3.5 + k for k in range(17) if 6.5 <= 3.5 + k <= 19.5 and not (16.5 <= 3.5 + k < 17.0)]
for c in claps:
    place(dry, c, CL, 0.11, 0.05); place(send, c, CL, 0.05)

def hat():
    n = int(0.06 * SR); tt = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-tt / 0.014)
for k in range(60):
    t0 = 6.75 + 0.5 * k
    if t0 > 19.8: break
    if 16.5 <= t0 < 17.0: continue
    place(dry, t0, hat(), 0.07, 0.35 if k % 2 else -0.35)

# ── sound design (in key, through the same room) ───────
def tick(m, dec=0.05):
    n = int(0.15 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt / dec) * np.minimum(1, tt / 0.0015)
    s += hp(rng.standard_normal(n), 4000) * np.exp(-tt / 0.003) * 0.3
    return s
def bell(ms, dec=1.4):
    n = int(2.6 * SR); tt = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        f = hz(m)
        for ratio, amp, dd in ((1, 1, 1), (2.0, 0.35, 0.5), (3.01, 0.15, 0.3), (4.2, 0.06, 0.2)):
            s += amp * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt / (dec * dd))
    return s * np.minimum(1, tt / 0.003) / len(ms)
def whoosh(dur=0.45, lo=300, hi=3500, up=True):
    n = int(dur * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n); out = np.zeros(n); seg = 512
    for i in range(0, n, seg):
        x = i / n; fc = lo * (hi / lo) ** (x if up else 1 - x)
        out[i:i + seg] = bp(nz[max(0, i - 2048):i + seg], fc * 0.7, min(fc * 1.4, SR / 2 - 200))[-len(out[i:i + seg]):]
    return out * np.sin(np.pi * tt / dur) ** 2
def riser(dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    w = whoosh(dur, 200, 6000, True)
    return w * (tt / dur) ** 2.2

# hook: the drawing pen
pen = bp(rng.standard_normal(int(1.3 * SR)), 2500, 7000) * np.sin(np.linspace(0, np.pi, int(1.3 * SR))) ** 2
place(dry, 0.1, pen, 0.012, -0.3); place(send, 0.1, pen, 0.012)
for i, tt0 in enumerate([0.55, 0.63, 0.71, 0.79]):  # holes appear
    place(dry, tt0 + 0.3, tick(84 + [0, 3, 7, 12][i], 0.04), 0.03, -0.5 + i * 0.33); place(send, tt0 + 0.3, tick(84, 0.04), 0.02)
# rise into the flash, impact on the flash (G chord), whoosh into the drop
place(dry, 1.35, riser(0.65), 0.11); place(send, 1.35, riser(0.65), 0.1)
n = int(1.2 * SR); tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * (43 + 40 * np.exp(-tt / 0.08)).cumsum() / SR) * np.exp(-tt / 0.45)
place(dry, 2.0, boom, 0.26)
place(dry, 2.0, bell([79, 83, 86], 1.2), 0.11); place(send, 2.0, bell([79, 83, 86], 1.2), 0.14)
for c in (3.0, 6.5, 10.0, 14.0):
    w = whoosh(0.42, 2500, 350, False)
    place(dry, c - 0.2, w, 0.05, 0.2); place(send, c - 0.2, w, 0.06)
# scene 3: grab, drop thunk, processing ticks, check pop, button click
place(dry, 6.5 + 0.32, tick(81, 0.03), 0.04)
n = int(0.25 * SR); tt = np.arange(n) / SR
thunk = np.sin(2 * np.pi * 150 * tt) * np.exp(-tt / 0.07)
place(dry, 6.5 + 1.5, thunk, 0.22); place(dry, 6.5 + 1.5, tick(76, 0.05), 0.05)
for k in range(4): place(dry, 6.5 + 1.7 + k * 0.125, tick(88, 0.015), 0.012, 0.3)
place(dry, 6.5 + 2.2, tick(84, 0.07), 0.07, 0.3); place(dry, 6.5 + 2.28, tick(91, 0.09), 0.06, 0.3); place(send, 6.5 + 2.2, bell([84, 91], 0.4), 0.05)
place(dry, 6.5 + 2.85, tick(79, 0.04), 0.06, 0.2)
# scene 4: option clicks, calculating ticks, price count, ding
for c, m in zip([0.48, 0.8, 1.12, 1.46], [76, 79, 81, 84]):
    place(dry, 10.0 + c, tick(m, 0.04), 0.06, 0.2); place(send, 10.0 + c, tick(m, 0.04), 0.03)
for k in range(10):
    tk = 12.0 + 0.75 * (1 - (1 - k / 10) ** 2)
    place(dry, tk, tick(81 + (k % 3) * 4 + 12 * (k // 6), 0.02), 0.025, 0.1)
place(dry, 12.75, bell([69, 72, 76, 81], 1.6), 0.15); place(send, 12.75, bell([69, 72, 76, 81], 1.6), 0.15)
# scene 5: cards land
for i in range(3):
    place(dry, 14.0 + 0.32 + i * 0.16, tick(72 + [0, 4, 7][i], 0.05), 0.045, -0.4 + i * 0.4)
for k in range(8):
    place(dry, 14.75 + k * 0.12, tick(88 + (k % 2) * 3, 0.015), 0.012, 0.3)
# break riser into the CTA, lift, logo bell, final chord
place(dry, 16.0, riser(1.0), 0.10); place(send, 16.0, riser(1.0), 0.1)
place(dry, 17.0, boom, 0.18)
place(dry, 17.0, bell([65, 69, 72, 77], 1.6), 0.1); place(send, 17.0, bell([65, 69, 72, 77], 1.6), 0.12)
place(dry, 19.05, bell([79, 83, 86], 1.0), 0.09); place(send, 19.05, bell([79, 83, 86], 1.0), 0.1)
place(dry, 20.0, bell([72, 76, 79, 84], 2.2), 0.14); place(send, 20.0, bell([72, 76, 79, 84], 2.2), 0.18)

# ── room ────────────────────────────────────────────────
ir_n = int(2.2 * SR); itt = np.arange(ir_n) / SR
ir = np.stack([lp(rng.standard_normal(ir_n), 5000) * np.exp(-itt / 0.55) for _ in range(2)], 1)
ir[: int(0.012 * SR)] = 0
ir /= np.sqrt(np.sum(ir ** 2, axis=0))
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], 1)
wet = hp(wet.T, 180).T * 0.55

out = dry + wet
# gentle master: low-cut rumble, light soft-knee limiting, fade the tail
out = hp(out.T, 28).T
out /= np.max(np.abs(out))
knee = 0.6
mag = np.abs(out)
out = np.where(mag > knee, np.sign(out) * (knee + (1 - knee) * np.tanh((mag - knee) / (1 - knee))), out)
fade = np.clip((DUR - t_all) / 0.6, 0, 1) ** 1.5
out *= fade[:, None]
out *= 0.89 / np.max(np.abs(out))

pcm = (np.clip(out, -1, 1) * 32767).astype('<i2')
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
rms = np.sqrt(np.mean(out ** 2)); print('written music.wav, rms dBFS', round(20 * np.log10(rms), 1))
