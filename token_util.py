#!/usr/bin/env python3
"""
从特定格式的字符串中提取 Refresh Token (rt_xxx)
格式: email----xxx----sess-xxx----rt_xxx----org-xxx----sk-xxx----app_xxx
"""

import re
import sys
from pathlib import Path


def extract_rt(text: str) -> list[str]:
    """提取所有 rt_ 开头的 token，只保留 rt 那一段"""
    tokens: list[str] = []
    for line in text.splitlines():
        # 先按 ---- 切成多段
        parts = line.split("----")
        for part in parts:
            part = part.strip()
            if part.startswith("rt_"):
                tokens.append(part)
    return tokens


def main():
    # 默认从当前目录的 tokens.txt 读取
    in_path = Path("tokens.txt")
    out_path = Path("rt_tokens.txt")

    # 也允许通过命令行参数指定输入文件
    if len(sys.argv) > 1:
        in_path = Path(sys.argv[1])

    if not in_path.exists():
        print(f"输入文件不存在: {in_path}")
        print("请在当前目录放一个 tokens.txt，或者: python token.py your_tokens.txt")
        return

    text = in_path.read_text(encoding="utf-8", errors="ignore")

    tokens = extract_rt(text)

    if not tokens:
        print("未找到任何 Refresh Token")
        return

    # 去重并保持顺序
    seen = set()
    unique_tokens: list[str] = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            unique_tokens.append(t)

    # 写入输出文件，一行一个
    out_path.write_text("\n".join(unique_tokens) + "\n", encoding="utf-8")

    print(f"已从 {in_path} 中提取 {len(tokens)} 个 RT，去重后 {len(unique_tokens)} 个。")
    print(f"已写入: {out_path} (一行一个)")

if __name__ == "__main__":
    main()
