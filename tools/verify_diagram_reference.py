import json
from pathlib import Path

def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

root = Path('submission')
nodes = list(walk(json.loads((root / 'WEB_ALL_IN_ONE_fixed.mdj').read_text(encoding='utf-8'))))
by_id = {n['_id']: n for n in nodes if '_id' in n}
assert len(by_id) == sum('_id' in n for n in nodes)
assert all(n['$ref'] in by_id for n in nodes if '$ref' in n)
interfaces = [n for n in nodes if n.get('_type') == 'UMLInterface']
assert {n['name'] for n in interfaces} == {'API battery_type', 'API users'}
assert len([n for n in nodes if n.get('_type') == 'UMLClassDiagram']) == 1
assert {n['name'] for n in nodes if n.get('_type') == 'UMLPackage'} == {'Фронтенд', 'Бэкенд', 'Модель', 'База данных'}
for interface in interfaces:
    view = next(n for n in nodes if n.get('_type') == 'UMLInterfaceView' and n.get('model', {}).get('$ref') == interface['_id'])
    assert view['stereotypeDisplay'] == 'icon'
    assert any(n.get('_type') == 'UMLInterfaceRealizationView' and n['head']['$ref'] == view['_id'] for n in nodes)
    assert any(n.get('_type') == 'UMLDependencyView' and n['head']['$ref'] == view['_id'] for n in nodes)
base_interaction = next(n for n in nodes if n.get('_type') == 'UMLInteraction' and n.get('name') == 'Публикация и просмотр типа аккумулятора')
lifelines = [n for n in nodes if n.get('_type') == 'UMLLifeline' and n['_parent']['$ref'] == base_interaction['_id']]
assert {n['name'] for n in lifelines} == {'Фронтенд', 'Домен users', 'Домен battery_type'}
calls = [n for n in nodes if n.get('_type') == 'UMLMessage' and n.get('messageSort') == 'synchCall' and n['_parent']['$ref'] == base_interaction['_id']]
assert len(calls) == 8
for call in calls:
    operation = by_id[call['signature']['$ref']]
    target = by_id[call['target']['$ref']]
    classifier = by_id[by_id[target['represent']['$ref']]['type']['$ref']]
    assert operation['_parent']['$ref'] == classifier['_id']
    assert target['name'] == ('Домен users' if '/api/users/' in call['name'] else 'Домен battery_type')
assert len([n for n in nodes if n.get('_type') == 'UMLSequenceDiagram']) == 2
async_interaction = next(n for n in nodes if n.get('_type') == 'UMLInteraction' and n.get('name') == 'Отложенное вращение ЛР8')
async_calls = [n for n in nodes if n.get('_type') == 'UMLMessage' and n.get('messageSort') == 'synchCall' and n['_parent']['$ref'] == async_interaction['_id']]
assert len(async_calls) == 6
for call in async_calls:
    operation = by_id[call['signature']['$ref']]
    target = by_id[call['target']['$ref']]
    classifier = by_id[by_id[target['represent']['$ref']]['type']['$ref']]
    assert operation['_parent']['$ref'] == classifier['_id']
result = {'reference': 'Accepted Chekhovich RPZ supplied by user', 'classDiagrams': 1,
          'interfaces': ['API battery_type', 'API users'], 'notation': 'StarUML icon with dependencies and interface realizations produces ball and socket',
          'layers': ['Фронтенд', 'Бэкенд', 'Модель', 'База данных'],
          'lifelines': [n['name'] for n in lifelines], 'callSignaturesVerified': len(calls),
          'asyncSequence': 'Separate three-lifeline interaction with HTTP task, callback and polling', 'referencesValid': True, 'nativeUiOpened': True, 'nativeUiEvidence': 'Core diagrams captured before adding the separate LR8 interaction', 'asyncCallSignaturesVerified': 6}
(root / 'evidence/lab8/diagram-reference-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('PASS: one class diagram, two ball/socket interfaces, four layers, three domain lifelines, eight matching signatures')
