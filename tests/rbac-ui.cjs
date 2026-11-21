// Run with Node and Playwright available. API responses are simulated; no live data is changed.
const { chromium, firefox } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(process.env.AIEMAILER_APP_ROOT || path.join(__dirname, '../app'));
const output = process.env.AIEMAILER_UI_ARTIFACTS || path.join(os.tmpdir(), 'aiemailer-ui-check');
fs.mkdirSync(output, {recursive:true});
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  fs.readFile(file, (err,data) => {res.writeHead(err ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(err ? 'Not found' : data);});
});
const profile = {idUser:1,fullName:'Aditi Sharma',roleName:'Administrator',idRole:1,username:'aditi@example.test',orgName:'Example team',deptName:'Operations',isActive:true};
const record = {id:1,fileName:'Project brief.pdf',fileType:'pdf',fileSize:'24 KB',analyzedOn:'2026-11-14T09:00:00Z',summary:'The brief sets out the project scope, delivery dates, and next steps.',description:'A project brief for review.',previewUrl:'/api/attachment/1/preview',downloadUrl:'/api/attachment/1/download'};
const results=[];
let browser;
async function main() {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const engine=process.env.PLAYWRIGHT_BROWSER || 'chromium';
  browser=await (engine==='firefox'?firefox:chromium).launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE}:{})});
  const context=await browser.newContext({
    viewport:{width:1440,height:1000},reducedMotion:'reduce',
    storageState:{cookies:[],origins:[{origin,localStorage:[
      {name:'ai-emailer-token',value:'ui-test-token'},
      {name:'ai-emailer-theme',value:'light'}
    ]}]}
  });
  const state={reply:'success',summary:'success',upload:'success',login:'success',profile:'success',attachments:[record],holdReply:null};
  const requests=[];
  const keys=['dashboard','inbox','threat','classification','sentiment','reply','attachments','search','organization','license','settings','settings.profile','settings.users','settings.roles','settings.dept','settings.permissions','settings.team','settings.security','settings.integrations','settings.notifications'];
  let permissionVersion=1, permissionsFail=false;
  const full=()=>Object.fromEntries(keys.map(key=>[key,{view:true,add:true,update:true,delete:true}]));
  let permissionMenus=full();
  await context.route('**/api/**', async route => {
    const req=route.request(); const p=new URL(req.url()).pathname;
    requests.push({path:p,method:req.method(),body:req.postData()});
    const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if (p==='/api/permission/me') return permissionsFail ? send({message:'Unavailable'},503) : send({organizationId:1,roleId:1,permissionVersion,menus:permissionMenus});
    if (p==='/api/menu/list') return send(keys.map((key,index)=>({idMenu:index+1,menuKey:key,menuName:key,isEnable:true,idParentMenu:key.startsWith('settings.')?keys.indexOf('settings')+1:null,orderId:index,iconClass:'fa-circle'})));
    if (p==='/api/permission/list') return send({permissionVersion:1,permissions:[]});
    if (p==='/api/user/me') return send(state.profile==='expired'?{message:'Session expired'}:profile,state.profile==='expired'?401:200);
    if (p==='/api/auth/login') return send(state.login==='failure'?{message:'Invalid credentials'}:{token:'signed-in-test-token'},state.login==='failure'?400:200);
    if (p==='/api/auth/logout') return send({});
    if (p==='/api/summary/generate') return send(state.summary==='failure'?{message:'Summary service unavailable'}:{summary:'Please review the contract and confirm the payment terms by Friday.',priority:'High',actionItems:['Review the terms','Confirm by Friday']},state.summary==='failure'?502:200);
    if (p==='/api/reply/generate') {
      if(state.reply==='hold') {state.holdReply=()=>send({draft:'Stale reply from another message'});return;}
      if(state.reply==='network') return route.abort('failed');
      return send(state.reply==='failure'?{message:'Reply service unavailable'}:{draft:'Thank you for the update. I will review the terms and respond by Friday.'},state.reply==='failure'?502:200);
    }
    if(p==='/api/attachment/list')return send(state.attachments);
    if(p==='/api/attachment/analyze')return send(state.upload==='failure'?{message:'No readable text found'}:{...record,id:2,fileName:'Uploaded.pdf'},state.upload==='failure'?400:200);
    if(p==='/api/attachment/1'&&req.method()==='DELETE'){state.attachments=[];return send({});}
    if(p.endsWith('/preview')||p.endsWith('/download'))return route.fulfill({status:200,contentType:'application/pdf',body:Buffer.from('%PDF-1.4\n%%EOF')});
    if(p==='/api/organization/card-counts')return send({totalUser:1,totalDept:1,totalTeams:1,totalAdmins:1});
    if(p==='/api/user/list')return send([profile, {...profile,idUser:2,fullName:'Alexandra Catherine Montgomery',username:'alexandra.montgomery@long-company.example.test',deptName:'International customer operations',roleName:'Manager'}, {...profile,idUser:3,fullName:'Sam',username:'sam@example.test',isActive:false}, {...profile,idUser:4,fullName:'Omar Patel'}, {...profile,idUser:5,fullName:'Morgan Lee'}]);
    if(p==='/api/user/1')return send(profile);
    if(p==='/api/role/list')return send([{idRole:1,roleName:'Administrator'}]);
    if(p==='/api/department/list')return send([{idDept:1,deptName:'Operations'}]);
    if(p==='/api/team/list')return send([{idTeam:1,team:'Operations team',idDept:1,deptName:'Operations',totalMembers:1}]);
    if(p.endsWith('/addupd')||p.endsWith('/save'))return send({});
    return send([]);
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR', error.message);});
  page.on('requestfailed',request=>console.error('FAILED RESOURCE',new URL(request.url()).pathname));
  page.setDefaultTimeout(7000);
  const check=async(name,fn)=>{await fn();results.push(name);console.log('PASS '+name);};
  const text=async(selector,expected)=>{await page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent.includes(expected),{selector,expected});};
  const go=async(name)=>{
    if((await page.viewportSize()).width<=760)await page.locator('#menuToggle').click();
    await page.locator(`.nav-item[data-page="${name}"]`).click();
    await page.locator(`#page-${name}`).waitFor({state:'visible'});
  };
  const shot=async(name)=>page.screenshot({path:path.join(output,`${engine}-${name}.png`),fullPage:true,animations:'disabled'});
  await page.clock.install();
  await check('Denied direct URLs do not initialize any feature',async()=>{
    permissionMenus={};
    for(const name of keys.filter(key=>!key.includes('.'))) {
      const route=name==='dashboard'?'index':name==='threat'?'threats':name;
      requests.length=0;
      await page.goto(origin+'/'+route+'.html');
      await text('#content','do not have access');
      assert(!requests.some(r=>!['/api/permission/me'].includes(r.path)),JSON.stringify(requests));
    }
  });
  await check('Read-only users remain visible but cannot be edited',async()=>{
    permissionMenus={'settings.users':{view:true,add:false,update:false,delete:false}};
    await page.goto(origin+'/settings.html');
    await page.locator('.user-list-item').first().waitFor({state:'visible'});
    assert(!(await page.locator('#addUserBtn').isVisible()));
    assert(await page.locator('.user-list-item').first().evaluate(e=>getComputedStyle(e).pointerEvents==='none'));
    assert(!(await page.locator('[data-tab="roles"]').isVisible()));
  });
  await check('Four-action matrix enforces View and saves independent booleans',async()=>{
    permissionMenus=full();
    await page.goto(origin+'/settings.html');
    await page.locator('[data-tab="permissions"]').click();
    await page.locator('.rbmp-role-row').first().click();
    await page.locator('.permission-checkbox').first().waitFor({state:'visible'});
    assert.equal(await page.locator('.permission-checkbox').count(),80);
    const add=page.locator('input[data-menu-key="attachments"][data-action="add"]');
    const view=page.locator('input[data-menu-key="attachments"][data-action="view"]');
    await add.check();assert(await view.isChecked());
    await view.uncheck();assert(!(await add.isChecked()));
    await add.check();
    await page.locator('#rbmpSaveBtn').click();
    await page.waitForFunction(()=>document.querySelector('#rbmpSaveBtn').textContent==='Save Permissions');
    const save=requests.filter(r=>r.path==='/api/permission/save').at(-1);
    const payload=JSON.parse(save.body);
    assert.equal(payload.permissionVersion,1);
    const attachment=payload.permissions.find(p=>p.idMenu===7);
    assert.deepEqual(attachment,{idMenu:7,view:true,add:true,update:false,delete:false});
  });
  await check('Visible page revokes access on its 15-second refresh without logout',async()=>{
    permissionMenus=full();
    await page.goto(origin+'/attachments.html');
    await page.locator('.attach-card').first().waitFor({state:'visible'});
    permissionMenus={};permissionVersion++;
    await page.clock.fastForward(15001);
    await text('#content','do not have access');
    assert.equal(await page.evaluate(()=>localStorage.getItem('ai-emailer-token')),'ui-test-token');
    assert.equal(await page.locator('.attach-card').count(),0);
  });
  await check('Login landing opens the first permitted menu',async()=>{
    permissionMenus={'attachments':{view:true,add:false,update:false,delete:false}};
    await page.goto(origin+'/index.html?landing=1');
    await page.waitForURL('**/attachments.html');
    await page.locator('.attach-card').first().waitFor({state:'visible'});
  });
  await check('Permission matrix fits mobile widths in both themes',async()=>{
    permissionMenus=full();
    await page.goto(origin+'/settings.html');
    await page.locator('[data-tab="permissions"]').click();
    await page.locator('.rbmp-role-row').first().click();
    await page.locator('.permission-checkbox').first().waitFor({state:'visible'});
    for (const width of [390,320]) for(const theme of ['light','dark']) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert(await page.locator('.permission-actions').first().evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
    }
    await shot('rbac-matrix-mobile');
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('Unavailable permission service fails closed',async()=>{
    permissionsFail=true;
    await page.goto(origin+'/index.html');
    await text('#content','could not be verified');
    assert.equal(await page.locator('#page-dashboard').count(),0);
  });
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({engine,passed:results.length,errors}));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
