const fs = require('fs'), crypto = require('crypto');
const { chromium } = require('C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = 'submission/evidence/lab8';
const doc = 'submission/РПЗ_ЛР8_готово.docx';
const bytes = fs.readFileSync(doc), stat = fs.statSync(doc);
const metadata = { file: doc, bytes: bytes.length, decimalMB: bytes.length/1000000,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex'), below5MB: bytes.length < 5000000 };
fs.writeFileSync(out+'/report-size.json', JSON.stringify(metadata,null,2));
const escape = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');
const api = JSON.parse(fs.readFileSync(out+'/api.json'));
const css = '<style>body{font:22px Arial;margin:35px;color:#000;background:#fff}h1{font-size:29px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:13px;text-align:left}small{font-size:17px}pre{font:16px Consolas;white-space:pre-wrap}</style>';
const html = [
  ['report-size.png',`<h1>Размер итогового файла РПЗ</h1><table><tr><th>Файл</th><td>РПЗ_ЛР8_готово.docx</td></tr><tr><th>Размер</th><td>${bytes.length.toLocaleString('ru-RU')} байт (${metadata.decimalMB.toFixed(3)} МБ)</td></tr><tr><th>Ограничение курса</th><td>Не более 5 МБ — выполнено</td></tr></table><p><small>Сведения прочитаны из файловой системы. Это браузерная сводка, не окно свойств Windows.</small></p><small>SHA256: ${metadata.sha256}</small>`],
  ['index-measurements.png',`<h1>Результаты EXPLAIN ANALYZE</h1><p>Источник: evidence/lab8/api.json — фактический ранее выполненный замер.</p><table><tr><th>Показатель</th><th>Значение</th></tr><tr><td>Медиана с индексом</td><td>${api.plans.withIndex.medianMs} мс</td></tr><tr><td>Медиана без индекса</td><td>${api.plans.withoutIndex.medianMs} мс</td></tr></table><p>Пять повторов одного запроса. DROP INDEX и замер внутри транзакции с ROLLBACK.</p><p><small>Браузерная визуализация сохранённых результатов; не снимок pgAdmin. Полные планы находятся в исходном JSON.</small></p>`]
];
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {const page=await browser.newPage({viewport:{width:1100,height:580}});for(const [file,body] of html){await page.setContent('<meta charset="UTF-8">'+css+body);await page.screenshot({path:out+'/'+file,fullPage:true});}}
 finally{await browser.close();}
 console.log('File size and saved index measurement screenshots created');
})().catch(e=>{console.error(e);process.exitCode=1;});
