from pathlib import Path

for p in Path('dify').glob('*.yml'):
    print(p.name)

