import sys
from pathlib import Path
import yaml

def resolve_yaml(arg: str) -> Path:
    p = Path(arg)
    if p.is_file():
        return p
    # try to find a yml with (1).yml in the given dir
    cand = list(Path(arg).glob("* (1).yml"))
    if cand:
        return cand[0]
    raise FileNotFoundError(arg)

def main():
    if len(sys.argv) < 3:
        print("Usage: python tools/print_ifelse_cases.py <workflow.yml or dir> <ifelse_node_id>")
        sys.exit(1)
    yml = resolve_yaml(sys.argv[1])
    nid = str(sys.argv[2])
    data = yaml.safe_load(yml.read_text(encoding='utf-8'))
    nodes = data.get('workflow',{}).get('graph',{}).get('nodes',[])
    for n in nodes:
        if str(n.get('id')) == nid:
            d = n.get('data',{})
            print('node title:', d.get('title'))
            for c in d.get('cases',[]) or []:
                print('case_id:', c.get('case_id'))
                for cond in c.get('conditions',[]) or []:
                    print('  -', cond)
            return
    print('node not found')

if __name__ == '__main__':
    main()
