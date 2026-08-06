import subprocess

# 추출 대상 데이터셋 구조화 (URL 및 타임코드)
# 출처:
# 1. 묻고 더블로 가: https://www.youtube.com/ywatch?v=u7QVKK2fGw0
# 2. 손은 눈보다 빠르니까: https://www.youtube.com/shorts/pkYgRTXYh5E
audio_targets = [

   

   {
        "file_name": "hwato",
        "url": "https://www.youtube.com/watch?v=nyLl_SY1EtY",
        "start_time": "00:00:30",
        "duration": "00:02:00" # 1분 24초부터 3초간
    },
    {
        "file_name": "do_you_know_goni",
        "url": "https://www.youtube.com/shorts/pxW0zCr5Sbs",
        "start_time": "00:00:30",
        "duration": "00:00:05" # 1분 24초부터 3초간
    },
    {
        "file_name": "mutgo_double",
        "url": "https://www.youtube.com/watch?v=u7QVKK2fGw0",
        "start_time": "00:01:24",
        "duration": "00:00:03" # 1분 24초부터 3초간
    },
    {
        "file_name": "son_eun_nun",
        "url": "https://www.youtube.com/shorts/pkYgRTXYh5E",
        "start_time": "00:00:02",
        "duration": "00:00:05" # 2초부터 3초간
    }
]

def extract_audio(target):
    print(f"[{target['file_name']}] 음성 데이터 추출 연산을 시작합니다.")
    
    # yt-dlp와 ffmpeg를 파이프라이닝하여 타겟 구간만 렌더링
    command = [
        "yt-dlp",
        "-f", "bestaudio",
        "--external-downloader", "ffmpeg",
        "--external-downloader-args", f"ffmpeg_i:-ss {target['start_time']} -t {target['duration']}",
        "--extract-audio",
        "--audio-format", "mp3",
        "-o", f"{target['file_name']}.%(ext)s",
        target["url"]
    ]
    
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    print(f"완료: {target['file_name']}.mp3 파일이 로컬에 저장되었습니다.\n")

# 배열 순회 및 함수 호출
for target in audio_targets:
    extract_audio(target)