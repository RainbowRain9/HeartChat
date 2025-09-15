import sys
from pathlib import Path


def find_target(node_dir: Path, pattern: str) -> Path | None:
    matches = list(node_dir.glob(pattern))
    return matches[0] if matches else None


def append_if_missing(target: Path, section_title: str, content: str) -> bool:
    text = target.read_text(encoding='utf-8')
    marker = f"\n{section_title}\n"
    if section_title in text:
        return False
    new_text = text.rstrip() + marker + "\n" + content.strip() + "\n"
    target.write_text(new_text, encoding='utf-8')
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/merge_handwritten_into_nodes.py <node_dir>")
        sys.exit(1)
    node_dir = Path(sys.argv[1])

    # Mapping: handwritten filename -> target pattern (by node id)
    pairs = [
        ("SmallTalk_Agent.md", "*_*_1757933733449.md"),
        ("FAQ_AnswerLLM.md", "*_*_1757939504296.md"),
        ("风险评估LLM.md", "*_*_1757936891962.md"),
    ]

    merged = []
    skipped = []
    for src_name, pattern in pairs:
        src = node_dir / src_name
        if not src.exists():
            skipped.append((src_name, "source not found"))
            continue
        dst = find_target(node_dir, pattern)
        if not dst:
            skipped.append((src_name, f"no target matches {pattern}"))
            continue
        ok = append_if_missing(dst, "\n## 手写补充", src.read_text(encoding='utf-8'))
        if ok:
            merged.append(dst.name)
        else:
            skipped.append((src_name, "already merged"))

    print(f"Merged into {len(merged)} files")
    for n in merged:
        print(f" - {n}")
    if skipped:
        print("Skipped:")
        for s, reason in skipped:
            print(f" - {s}: {reason}")


if __name__ == '__main__':
    main()

