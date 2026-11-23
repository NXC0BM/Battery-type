const fs=require('fs'),path=require('path');const source='C:/Web/Battery-type-frontend',target='C:/Web/Battery-type-native';fs.mkdirSync(target,{recursive:true});
for(const name of ['src','public'])fs.cpSync(path.join(source,name),path.join(target,name),{recursive:true});
for(const name of ['package.json','package-lock.json','tsconfig.json','tsconfig.node.json','vite.config.ts','index.html'])if(fs.existsSync(path.join(source,name)))fs.copyFileSync(path.join(source,name),path.join(target,name));
const pkg=JSON.parse(fs.readFileSync(target+'/package.json'));pkg.name='battery_type-native';pkg.description='Гостевой каталог аккумуляторов Tauri + CLIP';pkg.scripts.tauri='tauri';pkg.scripts['native:build']='tauri build --no-bundle';fs.writeFileSync(target+'/package.json',JSON.stringify(pkg,null,2));
fs.writeFileSync(target+'/.env.production','VITE_BATTERY_TYPE_NATIVE=true\nVITE_BATTERY_TYPE_API_URL=http://192.168.1.128:53000/api\n');
fs.writeFileSync(target+'/.gitignore','node_modules/\ndist/\nsrc-tauri/target/\n*.log\n');
fs.mkdirSync(target+'/src-tauri/src',{recursive:true});fs.mkdirSync(target+'/src-tauri/capabilities',{recursive:true});
fs.writeFileSync(target+'/src-tauri/Cargo.toml',`[package]
name="battery_type-native"
version="0.1.0"
edition="2021"
[build-dependencies]
tauri-build={version="2",features=[]}
[dependencies]
tauri={version="2",features=[]}
`);
fs.writeFileSync(target+'/src-tauri/build.rs','fn main() { tauri_build::build() }\n');
fs.writeFileSync(target+'/src-tauri/src/main.rs','#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]\nfn main() { tauri::Builder::default().run(tauri::generate_context!()).expect("battery_type native failed"); }\n');
fs.writeFileSync(target+'/src-tauri/tauri.conf.json',JSON.stringify({$schema:'https://schema.tauri.app/config/2',productName:'battery_type',version:'0.1.0',identifier:'ru.battery-type.catalog',build:{beforeBuildCommand:'npm run build',frontendDist:'../dist',beforeDevCommand:'npm run dev',devUrl:'http://localhost:53001'},app:{windows:[{title:'Типы аккумуляторов',width:1000,height:800}],security:{csp:null}},bundle:{active:false}},null,2));
fs.writeFileSync(target+'/src-tauri/capabilities/default.json',JSON.stringify({identifier:'default',windows:['main'],permissions:['core:default']},null,2));
fs.writeFileSync(target+'/README.md',`# battery_type — нативный гостевой каталог

Tauri 2, React, TypeScript, CLIP через Transformers.js. Две страницы: каталог с фильтром и Подробнее. Вход, публикация и удаление исключены из маршрутов нативной сборки.

API: http://192.168.1.128:53000/api — реальный LAN IPv4 Ethernet на машине сборки. При смене сети изменить .env.production и пересобрать. Запуск сервера из Battery-type, src/main.ts слушает 0.0.0.0. NPM: npm ci; npm run native:build. Нужны Rust MSVC + C++ Build Tools + Windows SDK + WebView2. Результат: src-tauri/target/release/battery_type-native.exe. Dev режим не является итоговой сборкой.

CLIP выполняется локально в Web Worker. При первом запуске скачиваются открытые веса Xenova/clip-vit-base-patch32 с Hugging Face. Изображение пользователя не отправляется серверу; в сеть идут запросы моделей и каталога. Метрика S=(1+cosine)/2. Порог регулируется 0.4–0.9, TopK 1–20; начальные настройки 0.63 и TopK 3. Английские описания 50–100 символов берутся из API; совпадающие описания индексируются один раз. Для каждого найденного описания показывается один представитель.

Бэкенд: https://github.com/NXC0BM/Battery-type/tree/battery_type-lab8
Фронтенд: https://github.com/NXC0BM/Battery-type-frontend/tree/battery_type-lab8
`);
fs.mkdirSync(target+'/.github/workflows',{recursive:true});fs.writeFileSync(target+'/.github/workflows/build.yml',`name: battery_type Windows
on: [push, workflow_dispatch]
jobs:
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - run: npm run native:build
      - uses: actions/upload-artifact@v4
        with:
          name: battery_type-windows
          path: src-tauri/target/release/battery_type-native.exe
`);
console.log('Native source prepared');
