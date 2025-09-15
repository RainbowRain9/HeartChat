import sys
import json
from pathlib import Path

try:
    import yaml  # type: ignore
except Exception as e:
    print("ERROR: PyYAML not installed. Please install with 'pip install pyyaml'", file=sys.stderr)
    sys.exit(2)


def load_yaml(path: Path):
    with path.open('r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/parse_dify_workflow.py <workflow.yml>")
        sys.exit(1)
    yml_path = Path(sys.argv[1])
    data = load_yaml(yml_path)

    g = data.get('workflow', {}).get('graph', {})
    nodes = g.get('nodes', [])
    edges = g.get('edges', [])

    # Build node map: id -> {title, type}
    node_map = {}
    for n in nodes:
        nid = n.get('id')
        d = n.get('data', {})
        node_map[nid] = {
            'title': d.get('title', ''),
            'type': d.get('type', ''),
        }

    # Attempt to enrich if-else cases: map case_id -> human condition for the node
    ifelse_cases = {}
    for n in nodes:
        d = n.get('data', {})
        if d.get('type') == 'if-else':
            for case in d.get('cases', []):
                cid = case.get('case_id')
                conds = case.get('conditions', []) or []
                # compress condition summary
                parts = []
                for c in conds:
                    op = c.get('comparison_operator')
                    val = c.get('value')
                    vs = c.get('variable_selector') or []
                    # show only last two selectors for brevity
                    vs_show = ".".join(vs[-2:]) if len(vs) >= 2 else ".".join(vs)
                    parts.append(f"{vs_show} {op} {val}")
                ifelse_cases[(n.get('id'), cid)] = " AND ".join(parts) if parts else ''

    # Build edges summary
    edge_summaries = []
    for e in edges:
        sid = e.get('source')
        tid = e.get('target')
        sh = e.get('sourceHandle')
        src = node_map.get(sid, {'title': sid, 'type': '?'})
        tgt = node_map.get(tid, {'title': tid, 'type': '?'})
        label = ''
        # if edge originates from if-else, try to label with the case
        if node_map.get(sid, {}).get('type') == 'if-else' and sh is not None:
            label = ifelse_cases.get((sid, sh), sh)
        edge_summaries.append({
            'from': f"{src['title']} ({src['type']})",
            'to': f"{tgt['title']} ({tgt['type']})",
            'case_or_handle': label,
        })

    out = {
        'nodes': [
            {'id': nid, 'title': v['title'], 'type': v['type']}
            for nid, v in node_map.items()
        ],
        'edges': edge_summaries,
    }

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

