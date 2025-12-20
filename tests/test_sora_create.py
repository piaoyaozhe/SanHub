"""
Sora API 创建视频测试脚本
测试 sora.chatgpt.com 的 /backend/video_gen 接口
"""

import requests
import json

# 配置
BASE_URL = "https://sora.chatgpt.com"
ENDPOINT = "/backend/video_gen"

# 替换为你的完整 token
AUTHORIZATION = "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfWDh6WTZ2VzJwUTl0UjNkRTduSzFqTDVnSCIsImV4cCI6MTc2NjQ2NDI4NSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7ImNoYXRncHRfY29tcHV0ZV9yZXNpZGVuY3kiOiJub19jb25zdHJhaW50IiwiY2hhdGdwdF9kYXRhX3Jlc2lkZW5jeSI6Im5vX2NvbnN0cmFpbnQiLCJ1c2VyX2lkIjoidXNlci0xd080U25TRGZSbk84TFBtbDNrMUtpb0sifSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9tZmEiOnsicmVxdWlyZWQiOiJ5ZXMifSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9wcm9maWxlIjp7ImVtYWlsIjoiZ2VuejAxMjdAMTYzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwiaWF0IjoxNzY1NjAwMjg0LCJpc3MiOiJodHRwczovL2F1dGgub3BlbmFpLmNvbSIsImp0aSI6ImI1MzZlNjM4LTk2MzktNDhjNi05ODQzLTVlN2M3NjlmYzBlYSIsIm5iZiI6MTc2NTYwMDI4NCwicHdkX2F1dGhfdGltZSI6MTc2NTYwMDI4MzE4Nywic2NwIjpbIm9wZW5pZCIsImVtYWlsIiwicHJvZmlsZSIsIm9mZmxpbmVfYWNjZXNzIiwibW9kZWwucmVxdWVzdCIsIm1vZGVsLnJlYWQiLCJvcmdhbml6YXRpb24ucmVhZCIsIm9yZ2FuaXphdGlvbi53cml0ZSJdLCJzZXNzaW9uX2lkIjoiYXV0aHNlc3NfUExrWlQySzFQdFBVRml5enphV3VtODdQIiwic3ViIjoiYXV0aDB8UllNZ2JTUkt6UTBUVGIxblZYUmFQMk5lIn0.vQZpWuELT6USaa2hn7uR1AQgR8EwE9bacJByUEbm3Bgz5ldr1jLgGKMp6k8JU_-6eWJPTEW2ffiwTXLEskLk8id5NOPxEoBxL5ol-GqsBfTC55QMzukUnz58x4ayLqTQ5RZmAYjcuZg5YYKg5KqqaRQbySBo8fJ2TrVAfxtdhS956uQyICJIuNBHnYQyMVRSog4ew1S9mN3EU6nQExHAfZVngyYi-BilQKeZrCiGoNam1D38JF59rhF8e9mxYxz9_SoG46slV1UCFH_w7K9OkmpxQNXITTHr_6S-azYvNJYothJvEmPxyFlQCiMEJs9OfpfFiDd6QWO3tho-lOiP9aW_61zG3Rs14PAjcg3JocktbKmWd8ia5l9wTmniGVyhtN5nguSjPT1725DhwVNFm1I4GFU3xIvqB4LtHqaENmZXtBwxvEpDZ3MgsB2bn_D3kTqavRen6oozHphgKdaRbzqsJJt4t7sJyou3zlLbxYDIMX6qNX8unpKzsIl1IBRQG-OId3Ysdh-5gSiFlCdMip4A_9wgmBktiSvcsE92bKu6j4nA3Afti02YeQW8pearPtRKnnIqYaxBjnabBK80OGiRzmoxrO4wt-pyqymURZv1_TKnj1xr6AhaSRitFz00e38nrZrvZVT6zS9FCY0VpbKXHrUqHRmS0f2XmnJHoeQ"


# Sentinel Token


def create_video(prompt: str, width: int = 640, height: int = 360, n_frames: int = 600, model: str = "turbo"):
    """
    创建 Sora 视频 (video_gen 接口)
    
    Args:
        prompt: 视频描述
        width: 宽度 (640, 480, 360)
        height: 高度 (360, 480, 640)
        n_frames: 帧数 (300=10s, 450=15s, 600=20s)
        model: 模型 (turbo, default)
    """
    
    # 请求体
    payload = {
        "type": "video_gen",
        "operation": "simple_compose",
        "prompt": prompt,
        "n_variants": 1,
        "n_frames": n_frames,
        "height": height,
        "width": width,
        "inpaint_items": [],
        "model": model,
        "is_storyboard": False
    }
    
    # 请求头
    headers = {
        "accept": "*/*",
        "accept-language": "en-US,en-GB;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6",
        "authorization": AUTHORIZATION,
        "cache-control": "no-cache",
        "content-type": "application/json",
        "oai-device-id": "d48ef499-4e04-4a7e-a152-60484cd6e582",
        "oai-language": "en-US",
        "origin": "https://sora.chatgpt.com",
        "pragma": "no-cache",
        "referer": "https://sora.chatgpt.com/",
        "sec-ch-ua": '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"
    }
    
    url = f"{BASE_URL}{ENDPOINT}"
    
    print(f"请求 URL: {url}")
    print(f"Prompt: {prompt}")
    print(f"尺寸: {width}x{height}, 帧数: {n_frames}, 模型: {model}")
    print("-" * 50)
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=60
        )
        
        print(f"状态码: {response.status_code}")
        print("-" * 50)
        
        if response.status_code == 200:
            data = response.json()
            print("响应数据:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return data
        else:
            print(f"请求失败:")
            print(f"响应头: {dict(response.headers)}")
            print(f"响应体: {response.text[:500]}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
        return None


def create_image(prompt: str, width: int = 640, height: int = 360):
    """创建 Sora 图像"""
    
    payload = {
        "type": "video_gen",
        "operation": "simple_compose",
        "prompt": prompt,
        "n_variants": 1,
        "n_frames": 1,  # 1帧 = 图像
        "height": height,
        "width": width,
        "inpaint_items": [],
        "model": "turbo",
        "is_storyboard": False
    }
    
    headers = {
        "accept": "*/*",
        "authorization": AUTHORIZATION,
        "content-type": "application/json",
        "oai-device-id": "d48ef499-4e04-4a7e-a152-60484cd6e582",
        "oai-language": "en-US",
        "openai-sentinel-token": SENTINEL_TOKEN,
        "origin": "https://sora.chatgpt.com",
        "referer": "https://sora.chatgpt.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    url = f"{BASE_URL}{ENDPOINT}"
    
    print(f"创建图像: {prompt}")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=payload, headers=headers, cookies=COOKIES, timeout=30)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return data
        else:
            print(f"失败: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"异常: {e}")
        return None


if __name__ == "__main__":
    # 测试创建视频 (20秒, 640x360, turbo模型)
    result = create_video(
        prompt="小猫咪",
        width=1280,
        height=720,
        n_frames=150,  # 20秒
        model="turbo"
    )
    
    # 测试创建图像
    # result = create_image("可爱的小猫咪")
