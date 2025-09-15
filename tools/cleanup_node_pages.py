import sys
from pathlib import Path
from typing import Dict, Any, Set

try:
    import yaml  # type: ignore
except Exception:
    print("Missing dependency: PyYAML. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


ALLOWED_TYPES = {
    'start',
    'llm',
    'agent',
    'assigner',
    'answer',
    'if-else',
    'knowledge-retrieval',
    'question-classifier',
}


def load_yaml(p: Path) -> Dict[str, Any]:
    return yaml.safe_load(p.read_text(encoding='utf-8'))


def collect_node_ids(yaml_path: Path) -> Set[str]:
    data = load_yaml(yaml_path)
    nodes = (data.get('workflow', {}) or {}).get('graph', {}).get('nodes', [])
    return {str(n.get('id')) for n in nodes if n.get('id') is not None}


def main():
    if len(sys.argv) < 3:
        print("Usage: python tools/cleanup_node_pages.py <workflow.yml> <node_pages_dir>")
        sys.exit(1)
    yml = Path(sys.argv[1])
    node_dir = Path(sys.argv[2])
    keep_ids = collect_node_ids(yml)

    removed = []
    kept = []
    for p in node_dir.glob('*.md'):
        name = p.name
        if not name.lower().endswith('.md'):
            continue
        base = name[:-3]
        parts = base.rsplit('_', 2)
        is_generated = False
        file_id = None
        if len(parts) == 3:
            type_part = parts[1]
            id_part = parts[2]
            if type_part in ALLOWED_TYPES and id_part.isdigit():
                is_generated = True
                file_id = id_part

        if not is_generated:
            kept.append(name)
            continue

        if file_id not in keep_ids:
            try:
                p.unlink()
                removed.append(name)
            except Exception as e:
                print(f"Failed to remove {name}: {e}", file=sys.stderr)
        else:
            kept.append(name)

    # summary
    print(f"Removed {len(removed)} files")
    for r in removed:
        print(f" - {r}")
    print(f"Kept {len(kept)} files")


if __name__ == '__main__':
    main()

