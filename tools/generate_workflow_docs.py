import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

try:
    import yaml  # type: ignore
except Exception:
    print("Missing dependency: PyYAML. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


def load_yaml(p: Path) -> Dict[str, Any]:
    return yaml.safe_load(p.read_text(encoding='utf-8'))


def edge_label_for_if_else(source_handle: Any, cases_idx: Dict[Tuple[str, str], str], src_id: str) -> str:
    if source_handle is None:
        return ''
    key = (src_id, str(source_handle))
    return cases_idx.get(key, str(source_handle))


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


def escape_md(text: str) -> str:
    return text.replace('<', '&lt;').replace('>', '&gt;')


def main():
    if len(sys.argv) < 3:
        print("Usage: python tools/generate_workflow_docs.py <workflow.yml> <out.md>")
        sys.exit(1)
    yml_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])

    data = load_yaml(yml_path)
    app = data.get('app', {})
    wf = data.get('workflow', {})
    graph = wf.get('graph', {})
    nodes = graph.get('nodes', [])
    edges = graph.get('edges', [])

    node_map = {n.get('id'): n for n in nodes}
    cases_idx, cases_dump = build_cases_index(nodes)

    incoming: Dict[str, List[Dict[str, Any]]] = {nid: [] for nid in node_map}
    outgoing: Dict[str, List[Dict[str, Any]]] = {nid: [] for nid in node_map}
    for e in edges:
        sid = e.get('source')
        tid = e.get('target')
        incoming.setdefault(tid, []).append(e)
        outgoing.setdefault(sid, []).append(e)

    # Build Mermaid graph
    mermaid_lines = ["graph TD"]
    def node_label(nid: str) -> str:
        n = node_map[nid]
        t = n.get('data', {}).get('type', '')
        title = n.get('data', {}).get('title', '')
        safe = title if title else nid
        return f"{safe}\\n({t})"

    for e in edges:
        sid = e.get('source')
        tid = e.get('target')
        label = ''
        if node_map.get(sid, {}).get('data', {}).get('type') == 'if-else':
            label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, sid)
        mermaid_lines.append(f"  \"{node_label(sid)}\" -->|{escape_md(label)}| \"{node_label(tid)}\"")

    # Build Markdown
    lines: List[str] = []
    lines.append(f"# 心语精灵｜主工作流节点详解")
    lines.append("")
    lines.append(f"- 应用名: {app.get('name', '')}")
    lines.append(f"- 模式: {app.get('mode', '')}")
    lines.append(f"- 版本: {data.get('version', '')}")
    lines.append("")

    # Conversation variables
    conv_vars = wf.get('conversation_variables', [])
    if conv_vars:
        lines.append("## 会话变量")
        for v in conv_vars:
            lines.append(f"- {v.get('name')}: {v.get('value')} ({v.get('value_type')})  selector={'.'.join(v.get('selector') or [])}")
        lines.append("")

    # Nodes list
    lines.append("## 节点总览")
    for n in nodes:
        d = n.get('data', {})
        lines.append(f"- {d.get('title','')} ({d.get('type','')})｜id={n.get('id')}")
    lines.append("")

    # Edges summary
    lines.append("## 连线总览")
    for e in edges:
        sid = e.get('source'); tid = e.get('target')
        sn = node_map.get(sid, {}); tn = node_map.get(tid, {})
        s_title = sn.get('data', {}).get('title', sid)
        t_title = tn.get('data', {}).get('title', tid)
        label = ''
        if sn.get('data', {}).get('type') == 'if-else':
            label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, sid)
            lines.append(f"- {s_title} -> {t_title} ｜ 条件: {label}")
        else:
            lines.append(f"- {s_title} -> {t_title}")
    lines.append("")

    # Mermaid diagram
    lines.append("## 数据流图（Mermaid）")
    lines.append("```mermaid")
    lines.extend(mermaid_lines)
    lines.append("```")
    lines.append("")

    # Node details
    for nid, n in node_map.items():
        d = n.get('data', {})
        title = d.get('title', '')
        ntype = d.get('type', '')
        lines.append(f"### {title}｜{ntype}｜id={nid}")
        # prev/next
        prevs = incoming.get(nid, [])
        nexts = outgoing.get(nid, [])
        if prevs:
            lines.append("- 上游：")
            for e in prevs:
                sid = e.get('source'); sn = node_map.get(sid, {})
                s_title = sn.get('data', {}).get('title', sid)
                if sn.get('data', {}).get('type') == 'if-else':
                    label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, sid)
                    lines.append(f"  - {s_title} ｜条件: {label}")
                else:
                    lines.append(f"  - {s_title}")
        if nexts:
            lines.append("- 下游：")
            for e in nexts:
                tid = e.get('target'); tn = node_map.get(tid, {})
                t_title = tn.get('data', {}).get('title', tid)
                if ntype == 'if-else':
                    label = edge_label_for_if_else(e.get('sourceHandle'), cases_idx, nid)
                    lines.append(f"  - {t_title} ｜条件: {label}")
                else:
                    lines.append(f"  - {t_title}")

        # Internals by type
        if ntype == 'llm':
            model = d.get('model', {})
            lines.append(f"- 模型：{model.get('provider','')}/{model.get('name','')} ({model.get('mode','')})")
            cp = model.get('completion_params', {})
            if cp:
                lines.append(f"- 参数：{cp}")
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

        lines.append("")

    # Append TODO for missing links (design suggestions placeholder)
    lines.append("## 待补充与对齐建议（按总体方案）")
    lines.append("- 风险路由：为“条件分支 2”配置 4/3/2/1/0 的去向（例如：4/3-now-possible → 人工转交/热线提示；3 → 加强建议+回访；1-2 → 自助资源+行为任务；0 → 正常流程）。")
    lines.append("- FAQ 与反馈：FAQ_Answer、Feedback_Extractor 的输出可路由至 Answer 或下游处理管道（工单/表单/DB 记录）。")
    lines.append("- 行为闭环：从“汇总、总结与建议生成”的 actionable_suggestions 触发“行为闭环-任务创建与跟踪”子流程，形成任务→提醒→回执→回访闭环。")

    out_path.write_text("\n".join(lines), encoding='utf-8')
    print(f"Wrote {out_path}")


if __name__ == '__main__':
    main()

