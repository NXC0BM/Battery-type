"""Add the LR8 interaction without changing the accepted three-domain base flow."""
from pathlib import Path

# Reuse native constructors and view templates; add before final serialization.
source = Path('tools/build_diagrams.py').read_text(encoding='utf-8')
exec(source.split('# Integrity:')[0])
interaction = obj('UMLInteraction', model, name='Отложенное вращение ЛР8', ownedElements=[])
model['ownedElements'].append(interaction)
sd = obj('UMLSequenceDiagram', interaction, name='Asyncio HTTP callback и polling', ownedViews=[])
interaction['ownedElements'].append(sd)
lifelines, lv = [], []
xs = [185, 865, 1535]
im = Image.new('RGB', (1740, 1580), 'white')
dr = ImageDraw.Draw(im)
for i, (name, classifier) in enumerate([('Фронтенд', pages[1]), ('Домен battery_type', bc), ('Python asyncio', async_node)]):
    role = obj('UMLAttribute', interaction, name=name, type=ref(classifier))
    life = obj('UMLLifeline', interaction, name=name, represent=ref(role))
    interaction['ownedElements'].extend([role, life]); lifelines.append(life)
    view = clone(templates['UMLSeqLifelineView'], sd)
    dx = xs[i] - (view['left'] + 75)
    for item in walk(view):
        if 'left' in item: item['left'] += dx
        if 'model' in item: item['model'] = ref(life)
        if item.get('_type') == 'LabelView' and item.get('visible', True): item['text'] = name
    view['height'] = 1450; view['subViews'][1]['height'] = 1400
    sd['ownedViews'].append(view); lv.append(view)
    dr.rectangle((xs[i]-160, 55, xs[i]+160, 105), outline='black', width=2)
    dr.text((xs[i]-145, 68), name, font=font(21, True), fill='black')
    for yy in range(105, 1510, 16): dr.line((xs[i], yy, xs[i], yy+9), fill='black', width=2)
events = [
    (0,1,'GET /api/battery_type/feed','next=true; Cookie',False),
    (1,2,'POST /battery_type/rotation','batteryTypeId',False),
    (2,1,'202 Accepted','task scheduled',True),
    (1,0,'200 BatteryTypeDto','id; previous angles',True),
    (2,1,'GET /api/battery_type/feed','id; next=false',False),
    (1,2,'200 BatteryTypeDto','previous angles',True),
    (0,1,'GET /api/battery_type/feed','id; next=false; polling every 1 s',False),
    (1,0,'200 BatteryTypeDto','previous angles while task waits',True),
    (2,1,'PUT /api/battery_type/:id/rotation','after 7 s; key; previousX/Y; rotationX/Y',False),
    (1,2,'200 BatteryTypeDto','new angles persisted; compare-and-set',True),
    (0,1,'GET /api/battery_type/feed','same id; next=false',False),
    (1,0,'200 BatteryTypeDto','new angles; update Three.js',True),
]
for n, (src,dst,operation,args,reply) in enumerate(events):
    y = 155 + n*110
    message = obj('UMLMessage', interaction, name=operation, source=ref(lifelines[src]), target=ref(lifelines[dst]),
                  messageSort='reply' if reply else 'synchCall', arguments=args)
    if not reply: message['signature'] = ref(ops[operation])
    interaction['ownedElements'].append(message)
    view = clone(templates['UMLSeqMessageView'], sd)
    view.update(model=ref(message), tail=lv[src]['linePart'], head=lv[dst]['linePart'], points=f'{xs[src]}:{y};{xs[dst]}:{y}')
    for item in walk(view):
        if 'model' in item: item['model'] = ref(message)
        if item.get('_type') == 'EdgeLabelView': item.update(left=min(xs[src],xs[dst])+12, top=y-28, width=abs(xs[src]-xs[dst])-24, height=22)
        if item.get('_type') == 'UMLActivationView': item.update(left=xs[dst]-7, top=y, width=14, height=35, visible=not reply)
    sd['ownedViews'].append(view)
    arrow(dr, (xs[src],y), (xs[dst],y), reply)
    dr.text((min(xs[src],xs[dst])+18,y-26), f'{n+1}. {operation}', font=font(20), fill='black')
    dr.text((min(xs[src],xs[dst])+18,y+9), args, font=font(18), fill='black')
dr.text((40,15),'Дополнение ЛР8   •   HTTP задача, задержка, callback и short polling',font=font(23,True),fill='black')
dr.text((40,1515),'Asyncio не обращается к БД. x′=(x+π/6) mod 2π; y′=(y+π/4) mod 2π.',font=font(21),fill='black')
im.save(OUT/'diagrams/sequence-async.png')
nodes=list(walk(project)); ids=[n['_id'] for n in nodes if '_id' in n]
assert len(ids)==len(set(ids)); assert not {n['$ref'] for n in nodes if '$ref' in n}-set(ids)
(OUT/'WEB_ALL_IN_ONE_fixed.mdj').write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')
print('Four diagrams before deployment and use cases; one class diagram; two sequence diagrams')
