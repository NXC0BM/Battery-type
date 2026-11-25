const {chromium}=require('C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'), assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launchPersistentContext('C:/Web/Battery-type/submission/qa/clip-browser-profile',{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,viewport:{width:1280,height:1000}});
 try {
 const page=await browser.newPage(), errors=[], forbidden=[];
 await page.setViewportSize({width:1280,height:1000});
 page.on('requestfailed',r=>console.log('requestfailed',r.url().slice(0,180),r.failure()?.errorText));
 page.on('requestfinished',r=>{if(/onnx|wasm/.test(r.url()))console.log('loaded',r.url().slice(0,160));});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/\/battery_type\/(descriptions|feed)/.test(r.url()))forbidden.push(r.url());});
 await page.addInitScript(()=>{
  window.clipRequests=[];window.clipComputed=0;window.clipResults=[];
  const OriginalWorker=window.Worker;
  window.Worker=class extends OriginalWorker {
   constructor(...args){super(...args);this.addEventListener('message',e=>{
    if(e.data.textVectors)window.clipComputed+=Object.keys(e.data.textVectors).length;
    if(e.data.results)window.clipResults.push(e.data.results);
   });}
   postMessage(data,...args){window.clipRequests.push({ids:data.captions?.map(c=>c.id),cached:Object.keys(data.textVectors||{}).length});return super.postMessage(data,...args);}
  };
 });
 page.on('console',m=>{if(m.type()==='error')console.log('browser:',m.text().slice(0,200));});
 await page.goto('http://127.0.0.1:53001/#/battery_type');
 await page.getByText(/Страница 1 из/).waitFor();
 async function search(){
  await page.waitForFunction(()=>!document.querySelector('input[aria-label="Изображение аккумулятора"]')?.disabled);
  const previous=await page.evaluate(()=>window.clipResults.length);
  console.log('Image query',previous+1);
  await page.getByLabel('Изображение аккумулятора',{exact:true}).setInputFiles([]);
  await page.getByLabel('Изображение аккумулятора',{exact:true}).setInputFiles('C:/Web/Battery-type-frontend/public/DefaultImage.jpg');
  const progress=setInterval(()=>page.locator('.clipSearch [role=status]').innerText().then(t=>console.log('CLIP:',t)).catch(()=>{}),20000);
  try { await page.waitForFunction(n=>{const s=document.querySelector('.clipSearch [role=status]')?.textContent||'';return window.clipResults.length>n||/Error|error/.test(s);},previous,{timeout:600000}); } finally { clearInterval(progress); }
  assert.match(await page.locator('.clipSearch [role=status]').innerText(),/^Найдено:/);
 }
 await search();
 const first=await page.evaluate(()=>{
  const node=document.querySelector('.gridPage');
  let fiber=node[Object.keys(node).find(k=>k.startsWith('__reactFiber$'))];
  while(fiber && !fiber.memoizedProps?.store?.getState)fiber=fiber.return;
  if(!fiber)throw Error('Redux Provider not found');
  const store=fiber.memoizedProps.store;
  return {computed:window.clipComputed,vectors:Object.keys(store.getState().clip.textVectors).length,requests:window.clipRequests,results:window.clipResults};
 });
 assert(first.computed>0);assert.equal(first.vectors,first.computed);
 assert.equal(first.requests[0].ids.length,24);
 assert(first.results[0].every(r=>first.requests[0].ids.includes(r.id)));
 await page.screenshot({path:'submission/evidence/lab8/clip-search.png',fullPage:true});
 await search();
 assert.equal(await page.evaluate(()=>window.clipComputed),first.computed,'Repeated image query must reuse Redux text vectors');
 await page.getByRole('button',{name:'Сбросить поиск',exact:true}).click();
 await page.getByRole('button',{name:'Вперёд',exact:true}).click();
 await page.getByText(/Страница 2 из/).waitFor();
 await search();
 const last=await page.evaluate(()=>({requests:window.clipRequests,computed:window.clipComputed,results:window.clipResults}));
 assert.equal(last.computed,first.computed,'Equal descriptions on another page must reuse Redux vectors');
 assert(last.requests[2].ids.every(id=>!first.requests[0].ids.includes(id)));
 assert(last.results[2].every(r=>last.requests[2].ids.includes(r.id)));
 assert.equal(forbidden.length,0,'Search must not request whole-catalog descriptions or feed');
 assert.equal(errors.length,0,errors.join('\n'));
 await page.screenshot({path:'submission/evidence/lab8/clip-page2.png',fullPage:true});
 const status=await page.locator('.clipSearch [role=status]').innerText();
 fs.writeFileSync('submission/evidence/lab8/clip.json',JSON.stringify({date:new Date().toISOString(),image:'DefaultImage.jpg',metric:'(1 + cosine) / 2',threshold:.63,topK:3,status,checks:['Actual CLIP image-to-English-text inference','24 current-page candidates, no deduplication of cards','Text vectors cached in Redux','Repeated query and worker recreation reuse Redux text vectors','Second page results only from second page','No descriptions or feed requests'],textVectorsComputed:first.computed,requests:last.requests,resultIds:last.results.map(rs=>rs.map(r=>r.id)),errors},null,2));
 console.log('Real CLIP + Redux + page-scope checks passed',status);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
