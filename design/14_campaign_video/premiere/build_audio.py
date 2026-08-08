#!/usr/bin/env python3
"""ElevenLabs_hwatro.aaf → Premiere용 오디오 트랙 + 마스터 믹스 재생성.

Premiere의 AAF 임포트는 임베디드 에센스를 못 풀어서 162개 클립이 전부
오프라인(무음)으로 들어온다. 이 스크립트가 AAF를 직접 파싱해 실제 오디오를
꺼내고, 스테레오 쌍으로 합쳐 타임라인 위치와 함께 내놓는다.

    pip install pyaaf2
    python3 build_audio.py

산출물 (전부 .gitignore 대상 — 이 스크립트로 언제든 재생성):
    audio-clips/_aaf_essence/stereo/A{쌍}_{순번}.wav   81개, Premiere A1~A15
    audio-clips/_aaf_essence/plan.json                 배치 좌표
    audio-clips/hwatro_master_mix.wav                  Premiere A16 (들리는 마스터)

마스터 체인은 승인본(ElevenLabs_hwatro-7.mp4)에 맞춰 결정했다:
    유니티 합산 → PRE_GAIN_DB → alimiter(limit=LIMIT)
    → 구간별 -0.11~+0.47 dB, 지연 0 ms, 피크 0.874

주의: AAF의 slot 75~80(약 10MB)은 파일 안에서 전부 0이다. 추출 오류가 아니라
원본이 그렇게 나갔다. 승인본과의 잔차가 -78 dB이므로 최종 믹스에서도 뮤트였다.
"""
import json, os, struct, subprocess, sys

import aaf2

HERE = os.path.dirname(os.path.abspath(__file__))
AAF = os.path.join(HERE, '../../../docs/ElevenLabs_hwatro.aaf')
OUT = os.path.join(HERE, '../audio-clips/_aaf_essence')
MASTER = os.path.join(HERE, '../audio-clips/hwatro_master_mix.wav')

PRE_GAIN_DB = -1.10          # 프리게인 스윕(-0.4~-2.6)에서 승인본에 가장 근접
LIMIT = 0.79                 # 리미터 임계값 스윕(0.55~0.891)에서 선정
SR = 44100


def wav_header(nbytes, sr, bits, ch):
    ba = ch * bits // 8
    return (b'RIFF' + struct.pack('<I', 36 + nbytes) + b'WAVEfmt ' +
            struct.pack('<IHHIIHH', 16, 1, ch, sr, sr * ba, ba, bits) +
            b'data' + struct.pack('<I', nbytes))


def main():
    if not os.path.exists(AAF):
        sys.exit(f'AAF 없음: {AAF}')
    os.makedirs(os.path.join(OUT, 'stereo'), exist_ok=True)

    f = aaf2.open(AAF, 'r')
    master = next(m for m in f.content.mobs if type(m).__name__ == 'MasterMob')
    comp = next(m for m in f.content.mobs if type(m).__name__ == 'CompositionMob')
    srcmobs = {m.mob_id: m for m in f.content.mobs if type(m).__name__ == 'SourceMob'}
    essence = {e.mob_id: e for e in f.content.essencedata}

    # MasterMob 슬롯(1~162) → 모노 에센스. 컴포지션은 SourceMobSlotID로 이걸 가리킨다.
    mono = {}
    for i in range(len(master.slots)):
        slot = master.slots[i]
        sm = srcmobs.get(slot.segment.mob_id)
        ed = essence.get(sm.mob_id) if sm else None
        if ed is None:
            continue
        d = sm.descriptor
        pcm = ed.open('r').read()
        path = os.path.join(OUT, f'src{slot.slot_id:03d}.wav')
        with open(path, 'wb') as fh:
            fh.write(wav_header(len(pcm), int(d['SampleRate'].value),
                                int(d['QuantizationBits'].value),
                                int(d['Channels'].value)) + pcm)
        mono[slot.slot_id] = path
    print(f'모노 에센스 {len(mono)}개 추출')

    # 컴포지션 30트랙 → 클립 위치 (edit_rate = 44100, 샘플 단위)
    tl = []
    for ti in range(len(comp.slots)):
        slot = comp.slots[ti]
        rate, pos = int(slot.edit_rate), 0
        for c in slot.segment.components:
            L = int(c.length or 0)
            if type(c).__name__ == 'SourceClip':
                sid = c['SourceMobSlotID'].value
                tl.append({'track': ti, 'start': round(pos / rate, 4),
                           'dur': round(L / rate, 4), 'slot': sid})
            pos += L

    # 30 모노 트랙 = 15 스테레오 쌍. 쌍끼리 타이밍이 동일한지 검증한다.
    by = {}
    for x in tl:
        by.setdefault(x['track'], []).append(x)
    for k in by:
        by[k].sort(key=lambda z: z['start'])

    plan = []
    for pi, a in enumerate(range(0, len(comp.slots), 2)):
        for j, (l, r) in enumerate(zip(by[a], by[a + 1])):
            assert abs(l['start'] - r['start']) < 1e-6, f'쌍 {pi+1} 타이밍 불일치'
            dst = os.path.join(OUT, 'stereo', f'A{pi+1:02d}_{j+1:02d}.wav')
            subprocess.run(['ffmpeg', '-v', 'error', '-y',
                            '-i', mono[l['slot']], '-i', mono[r['slot']],
                            '-filter_complex', '[0:a][1:a]amerge=inputs=2[a]',
                            '-map', '[a]', '-c:a', 'pcm_s16le', '-ar', str(SR),
                            dst], check=True)
            plan.append({'track': pi, 'start': l['start'], 'dur': l['dur'],
                         'name': os.path.basename(dst), 'path': dst})
    json.dump(plan, open(os.path.join(OUT, 'plan.json'), 'w'), indent=0)
    print(f'스테레오 {len(plan)}개 / {len(by)//2}트랙, 총 '
          f'{max(p["start"] + p["dur"] for p in plan):.3f}s')

    for p in mono.values():          # 모노 중간물은 남기지 않는다
        os.remove(p)

    # 마스터: 위치대로 합산 → 프리게인 → 리미터
    import wave
    import numpy as np
    n = int((max(p['start'] + p['dur'] for p in plan) + 0.1) * SR)
    mix = np.zeros((n, 2))
    for p in plan:
        with wave.open(p['path']) as w:
            a = np.frombuffer(w.readframes(w.getnframes()),
                              dtype='<i2').reshape(-1, 2) / 32768.0
        i = int(round(p['start'] * SR))
        mix[i:i + len(a)] += a
    mix *= 10 ** (PRE_GAIN_DB / 20)
    print(f'프리마스터 피크 {np.abs(mix).max():.3f} — 리미터가 처리')

    d = (np.clip(mix, -1, 1) * 8388607).astype('<i4').tobytes()
    d = b''.join(d[i:i + 3] for i in range(0, len(d), 4))
    tmp = os.path.join(OUT, '_premaster.wav')
    with open(tmp, 'wb') as fh:
        fh.write(wav_header(len(d), SR, 24, 2) + d)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af',
                    f'alimiter=limit={LIMIT}:attack=1:release=60:level=disabled',
                    '-c:a', 'pcm_s24le', '-ar', '48000', MASTER], check=True)
    os.remove(tmp)
    print(f'마스터 → {MASTER}')


if __name__ == '__main__':
    main()
