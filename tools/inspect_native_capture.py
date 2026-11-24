from pathlib import Path
import struct, hashlib, json, re, sys

root = Path('submission/evidence/lab8')
capture = sys.argv[1] if len(sys.argv)>1 else 'native-http.pcap'
port = int(sys.argv[2]) if len(sys.argv)>2 else 53100
output = 'native-network' if port==53100 else 'native-lan-api'
data = (root / capture).read_bytes()
assert data[:4] == b'\xd4\xc3\xb2\xa1', 'Expected little-endian tcpdump PCAP'
offset, packets, payloads = 24, 0, []
while offset < len(data):
    sec, usec, size, original = struct.unpack_from('<IIII', data, offset)
    packet = data[offset + 16: offset + 16 + size]
    offset += 16 + size
    packets += 1
    if packet[12:14] != b'\x08\x00':
        continue
    ip = packet[14:]
    if ip[9] != 6:
        continue
    ihl = (ip[0] & 15) * 4
    tcp = ip[ihl:]
    src, dst = struct.unpack_from('!HH', tcp)
    assert port in (src, dst), 'Unexpected traffic outside capture proxy'
    if port == 53000:
        assert bytes([192,168,1,128]) in (ip[12:16], ip[16:20]), 'Expected LAN API endpoint'
    payloads.append(tcp[(tcp[12] >> 4) * 4:].decode('latin1'))
requests = []
responses = []
for payload in payloads:
    if payload.startswith('GET '):
        lines = payload.split('\r\n')
        headers = dict(line.split(': ', 1) for line in lines[1:] if ': ' in line)
        requests.append({'request': lines[0], 'host': headers.get('Host'), 'userAgent': headers.get('User-Agent')})
    if payload.startswith('HTTP/1.1 '):
        responses.append(payload.split('\r\n', 1)[0])
assert any('/api/battery_type?' in r['request'] for r in requests)
assert any('/api/battery_type/feed?' in r['request'] for r in requests)
assert all(r['host'] == '192.168.1.128:53000' for r in requests)
assert any(r in ('HTTP/1.1 200 OK', 'HTTP/1.1 304 Not Modified') for r in responses)
result = {'captureTool': 'tcpdump 4.99.5 in temporary Alpine Docker TCP relay',
          'path': 'Tauri WebView2 -> temporary Docker relay -> 192.168.1.128:53000',
          'logicalApiDestination': 'http://192.168.1.128:53000/api',
          'filter': f'tcp port {port} on relay eth0; only this application was configured to use relay',
          'note': 'Capture on relay eth0, not physical Ethernet. With port 53000 the packets show destination 192.168.1.128:53000; source is the Docker relay.',
          'packets': packets, 'requests': requests, 'responses': responses,
          'pcapSha256': hashlib.sha256(data).hexdigest().upper()}
(root / (output+'.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
lines = ['Реальный сетевой захват нативного клиента battery_type',
         'tcpdump; PCAP открывается в Wireshark.', result['path'],
         'IP пакетов относится к Docker-прокси; исходный адрес API виден в HTTP Host.',
         'Посторонний трафик не включён. Это не захват физического Ethernet-интерфейса.', '']
lines += [r['request'] + '\nHost: ' + r['host'] + '\nUser-Agent: ' + str(r['userAgent']) for r in requests]
lines += ['', 'Ответы:'] + responses + ['', 'SHA256: ' + result['pcapSha256']]
(root / (output+'.txt')).write_text('\n'.join(lines), encoding='utf-8')
print(f'PCAP verified: {packets} packets; {len(requests)} GET requests; {len(responses)} response headers')
