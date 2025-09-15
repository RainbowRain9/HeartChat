import sys
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    import yaml  # type: ignore
except Exception:
    print("Missing dependency: PyYAML. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


def load_yaml(p: Path) -> Dict[str, Any]:
    return yaml.safe_load(p.read_text(encoding='utf-8'))


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    # Remove characters not allowed in filenames on Windows and others
    name = re.sub(r'[\\/:*?"<>|]', '_', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:150]


def short_condition(c: Dict[str, Any]) -> str:
    op = c.get('comparison_operator')
    val = c.get('value')
    vs = c.get('variable_selector') or []
    vs_show = ".".join(vs[-3:]) if len(vs) >= 3 else ".".join(vs)
    return f"{vs_show} {op} {val}"


def build_cases_index(nodes: List[Dict[str, Any]]):
    idx: Dict[Tuple[str, str], str] = {}
    cases_dump: Dict[str, List[str]] = {}
    for n in nodes:
        d = n.get('data', {})
        if d.get('type') == 'if-else':
            nid = n.get('id')
            for case in d.get('cases', []) or []:
                cid = str(case.get('case_id'))
                conds = [short_condition(x) for x in (case.get('conditions') or [])]
                idx[(nid, cid)] = ' AND '.join(conds) if conds else cid
            cases_dump[nid] = [f"{str(case.get('case_id'))}: " + ' AND '.join([short_condition(x) for x in (case.get('conditions') or [])]) for case in (d.get('cases') or [])]
    return idx, cases_dump


def edge_label_for_if_else(source_handle: Any, cases_idx: Dict[Tuple[str, str], str], src_id: str) -> str:
    if source_handle is None:
        return ''
    key = (src_id, str(source_handle))
    return cases_idx.get(key, str(source_handle))


def write_node_page(outdir: Path, node: Dict[str, Any], node_map: Dict[str, Dict[str, Any]], incoming, outgoing, cases_idx, cases_dump):
    nid = node.get('id')
    d = node.get('data', {})
    title = d.get('title', '') or nid
    ntype = d.get('type', '')

    fname = f"{sanitize_filename(title)}_{ntype}_{nid}.md"
    fpath = outdir / fname

    lines: List[str] = []
    lines.append(f"# {title}｜{ntype}｜id={nid}")
    lines.append("")

    # 上游
    prevs = incoming.get(nid, [])
    lines.append("## 上游")
    if prevs:
        for e in prevs:
            sid = e.get('source'); sn = node_map.get(sid, {})
            s_title = sn.get('data', {}).get('title', sid)
            if sn.get('data', {}).get('type') == 'if-else':
                label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, sid)
                lines.append(f"- {s_title} ｜条件: {label}")
            else:
                lines.append(f"- {s_title}")
    else:
        lines.append("- （无）")
    lines.append("")

    # 下游
    nexts = outgoing.get(nid, [])
    lines.append("## 下游")
    if nexts:
        for e in nexts:
            tid = e.get('target'); tn = node_map.get(tid, {})
            t_title = tn.get('data', {}).get('title', tid)
            if ntype == 'if-else':
                label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, nid)
                lines.append(f"- {t_title} ｜条件: {label}")
            else:
                lines.append(f"- {t_title}")
    else:
        lines.append("- （无）")
    lines.append("")

    # 内部信息
    lines.append("## 内部信息")
    if ntype == 'llm':
        model = d.get('model', {})
        lines.append(f"- 模型：{model.get('provider','')}/{model.get('name','')} ({model.get('mode','')})")
        cp = model.get('completion_params', {})
        if cp:
            lines.append(f"- 参数：{cp}")
        ctx = d.get('context', {})
        if ctx:
            lines.append(f"- 上下文启用：{ctx.get('enabled')}  selector={ctx.get('variable_selector')} ")
        mem = d.get('memory', {})
        if mem:
            lines.append(f"- 记忆窗口：{mem.get('window', {})}")
        # prompts
        pts = d.get('prompt_template', [])
        for pt in pts:
            if pt.get('role') == 'system':
                lines.append("- 提示词（system）：")
                lines.append("```")
                lines.append(pt.get('text',''))
                lines.append("```")
        # structured output
        if d.get('structured_output_enabled'):
            lines.append("- 结构化输出 Schema：")
            lines.append("```json")
            lines.append(yaml.safe_dump(d.get('structured_output', {}).get('schema', {}), allow_unicode=True))
            lines.append("```")
    elif ntype == 'knowledge-retrieval':
        lines.append(f"- 数据集：{d.get('dataset_ids', [])}")
        lines.append(f"- 检索模式：{d.get('retrieval_mode', '')}")
        if d.get('multiple_retrieval_config'):
            lines.append(f"- 多路检索配置：{d.get('multiple_retrieval_config')}")
        if d.get('metadata_model_config'):
            lines.append(f"- 元数据模型：{d.get('metadata_model_config')}")
    elif ntype == 'agent':
        params = d.get('agent_parameters', {})
        lines.append(f"- 插件：{d.get('plugin_unique_identifier', '')}")
        lines.append(f"- 策略：{d.get('agent_strategy_label','')} ({d.get('agent_strategy_name','')})")
        inst = params.get('instruction', {}).get('value', '')
        if inst:
            lines.append("- 指令：")
            lines.append("```")
            lines.append(inst)
            lines.append("```")
    elif ntype == 'assigner':
        lines.append("- 变量写入：")
        for it in d.get('items', []) or []:
            var_sel = '.'.join(it.get('variable_selector') or [])
            lines.append(f"  - {var_sel} {it.get('operation')} {it.get('value')}")
    elif ntype == 'answer':
        lines.append("- 回答模板：")
        lines.append("```")
        lines.append(str(d.get('answer','')))
        lines.append("```")
    elif ntype == 'if-else':
        lines.append("- 分支条件：")
        for row in cases_dump.get(nid, []):
            lines.append(f"  - {row}")
    else:
        lines.append("- （无）")

    fpath.write_text("\n".join(lines), encoding='utf-8')
    return fpath


def main():
    if len(sys.argv) < 3:
        print("Usage: python tools/generate_node_pages.py <workflow.yml> <outdir>")
        sys.exit(1)
    yml = Path(sys.argv[1])
    outdir = Path(sys.argv[2])
    ensure_dir(outdir)

    data = load_yaml(yml)
    graph = data.get('workflow', {}).get('graph', {})
    nodes = graph.get('nodes', [])
    edges = graph.get('edges', [])
    node_map = {n.get('id'): n for n in nodes}

    cases_idx, cases_dump = build_cases_index(nodes)
    incoming = {nid: [] for nid in node_map}
    outgoing = {nid: [] for nid in node_map}
    for e in edges:
        sid = e.get('source'); tid = e.get('target')
        incoming.setdefault(tid, []).append(e)
        outgoing.setdefault(sid, []).append(e)

    written = []
    for n in nodes:
        p = write_node_page(outdir, n, node_map, incoming, outgoing, cases_idx, cases_dump)
        written.append(p)

    print(f"Generated {len(written)} node pages into {outdir}")


if __name__ == '__main__':
    main()

