#!/usr/bin/env python3
"""
从特定格式的字符串中提取 Refresh Token (rt_xxx)
格式: email----xxx----sess-xxx----rt_xxx----org-xxx----sk-xxx----app_xxx
"""

import re
import sys

def extract_rt(text: str) -> list[str]:
    """提取所有 rt_ 开头的 token"""
    # 匹配 rt_ 开头，直到遇到 ---- (使用非贪婪匹配)
    pattern = r'rt_[A-Za-z0-9._]+(?=----|\s|$)'
    return re.findall(pattern, text)

def main():
    # 从标准输入或文件读取
    if len(sys.argv) > 1:
        # 从文件读取
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        # 从标准输入读取
        print("请输入内容 (Ctrl+Z 然后回车结束):")
        text = sys.stdin.read()
    
    tokens = extract_rt(text)
    
    if tokens:
        print(f"\n找到 {len(tokens)} 个 Refresh Token:\n")
        for rt in tokens:
            print(rt)
    else:
        print("未找到任何 Refresh Token")

if __name__ == "__main__":
    main()
