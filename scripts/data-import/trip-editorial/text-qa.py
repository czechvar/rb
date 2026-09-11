"""Verify every authored display string in final saved fixture HTML, without media requests."""
import json
import re
import unicodedata
from pathlib import Path
from urllib.request import urlopen
from bs4 import BeautifulSoup

base = Path(__file__).resolve().parent
output = Path('.scratch/trip-editorial-rollout/qa')
output.mkdir(parents=True, exist_ok=True)

def compact(value):
    text = unicodedata.normalize('NFKC', str(value or '')).lower()
    text = text.translate(str.maketrans({'‘': "'", '’': "'", 'ʼ': "'", '“': '"', '”': '"', '–': '-', '—': '-', '−': '-'}))
    return re.sub(r'\s+', '', text)

results = []
for batch in ['standalone', 'espana', 'rockroad']:
    for manifest in json.loads((base / 'manifests' / f'{batch}.json').read_text()):
        date_id = manifest['target']['eventDateId']
        result = {'id': date_id, 'pass': False}
        try:
            with urlopen(f'http://localhost:4444/editorial-qa/{date_id}', timeout=120) as response:
                html = response.read().decode()
            soup = BeautifulSoup(html, 'html.parser')
            data = json.loads(soup.select_one('#editorial-qa-data').string)
            main = soup.select_one('main')
            for node in main.select('script, style'):
                node.decompose()
            rendered = compact(main.get_text())
            expected = data['expectedText']
            missing = [text for text in expected if compact(text) not in rendered]
            result.update(expectedCount=len(expected), missingText=missing, exactSelection=data['selectedId'] == date_id)
            result['pass'] = not missing and result['exactSelection'] and len(expected) == len(manifest['expectedText'])
        except Exception:
            result['error'] = 'Fixture text check did not complete'
        results.append(result)
        (output / f'text-{date_id}.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps({'id': date_id, 'pass': result['pass'], 'expected': result.get('expectedCount'), 'missing': len(result.get('missingText', []))}), flush=True)

(output / 'text-matrix.json').write_text(json.dumps({'cases': len(results), 'passed': sum(row['pass'] for row in results), 'results': results}, indent=2) + '\n')
raise SystemExit(0 if all(row['pass'] for row in results) else 1)
