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
  await context.route('**/api/**', async route => {
    const req=route.request(); const p=new URL(req.url()).pathname;
    requests.push({path:p,method:req.method(),body:req.postData()});
    const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if (p==='/api/permission/me') return send({organizationId:1,roleId:1,permissionVersion:1,menus:Object.fromEntries(['dashboard','inbox','threat','classification','sentiment','reply','attachments','search','organization','license','settings','settings.profile','settings.users','settings.roles','settings.dept','settings.permissions','settings.team','settings.security','settings.integrations','settings.notifications'].map(key=>[key,{view:true,add:true,update:true,delete:true}]))});
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
  await page.goto(origin+'/index.html');
  await text('#loggedInUserName','Aditi');
  await check('Dashboard initializes profile, charts, and sample-data notice',async()=>{
    assert.equal(await page.locator('.page.active').getAttribute('id'),'page-dashboard');
    assert.equal(await page.evaluate(()=>Object.keys(Chart.instances).length),2);
    assert(await page.locator('#demoNotice').isVisible());
    await shot('dashboard-light');
  });
  await check('Inbox is keyboard accessible and generates a summary',async()=>{
    await go('inbox');
    await page.locator('.inbox-item').first().focus();
    await page.keyboard.press('Enter');
    await text('#aiSummaryBox','confirm the payment terms');
    assert.equal(await page.locator('#actionList li').count(),2);
    await shot('inbox-light');
  });
  await check('Summary failure can be retried',async()=>{
    state.summary='failure';await page.locator('.inbox-item').nth(1).click();
    await text('#aiSummaryBox','Summary service unavailable');
    state.summary='success';await page.locator('#retrySummaryBtn').click();
    await text('#aiSummaryBox','confirm the payment terms');
  });
  await check('Reply success and actual clipboard success feedback',async()=>{
    await go('reply');assert(await page.locator('#copyReplyBtn').isDisabled());
    await page.locator('.reply-inbox-item').first().click();
    await page.locator('#generateReplyBtn').click();await text('#replyStatus','Draft ready');
    assert((await page.locator('#replyOutput').inputValue()).startsWith('Thank you'));
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedText=text;}}}));
    await page.locator('#copyReplyBtn').click();await text('#replyStatus','Draft copied');
    assert.equal(await page.evaluate(()=>window.copiedText),await page.locator('#replyOutput').inputValue());
    await shot('reply-light');
  });
  await check('Clipboard rejection reports failure',async()=>{
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
    await page.locator('#copyReplyBtn').click();await text('#replyStatus',"Couldn't copy");
  });
  await check('Reply failure preserves the previous draft and enables retry',async()=>{
    const draft=await page.locator('#replyOutput').inputValue();state.reply='failure';
    await page.locator('#generateReplyBtn').click();await text('#replyStatus','Reply service unavailable');
    assert.equal(await page.locator('#replyOutput').inputValue(),draft);
    assert(await page.locator('#generateReplyBtn').isEnabled());
    state.reply='network';await page.locator('#generateReplyBtn').click();await text('#replyStatus',"Can't reach the server");
    assert.equal(await page.locator('#replyOutput').inputValue(),draft);
  });
  await check('A late reply cannot overwrite another selected email',async()=>{
    state.reply='hold';await page.locator('#generateReplyBtn').click();
    await page.locator('#replyBackBtn').click();await page.locator('.reply-inbox-item').nth(1).click();
    assert.equal(await page.locator('#replyOutput').inputValue(),'');
    await state.holdReply();
    // Ensure the held response has been processed before asserting.
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#replyOutput').inputValue(),'');
    assert(await page.locator('#copyReplyBtn').isDisabled());state.reply='success';
  });
  await check('Attachment modal follows both themes and keeps keyboard focus',async()=>{
    await go('attachments');await page.locator('.attach-card').first().click();
    await page.locator('#attachmentModal.is-open').waitFor();
    const light=await page.locator('#attachmentModal .attachment-modal__dialog').evaluate(el=>getComputedStyle(el).backgroundColor);
    await page.locator('#attachmentModal [data-attachment-delete-id]').focus();await page.keyboard.press('Tab');
    assert.equal(await page.locator('#attachmentModal .attachment-modal__close').evaluate(el=>el===document.activeElement),true);
    await shot('attachment-light');await page.keyboard.press('Escape');
    await page.locator('#themeToggle').click();await page.locator('.attach-card').first().click();
    const dark=await page.locator('#attachmentModal .attachment-modal__dialog').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.notEqual(dark,light);await shot('attachment-dark');await page.keyboard.press('Escape');
  });
  await check('Attachment preview and download use the authenticated API helper',async()=>{
    await page.locator('.attach-card').first().click();
    const previewPromise=context.waitForEvent('page');await page.locator('[data-attachment-file-mode="preview"]').click();
    const preview=await previewPromise;await page.waitForFunction(()=>!document.querySelector('[data-attachment-file-mode="preview"]').disabled);await preview.close();
    const downloadPromise=page.waitForEvent('download');await page.locator('[data-attachment-file-mode="download"]').click();await downloadPromise;
    assert(requests.some(r=>r.path.endsWith('/preview')));assert(requests.some(r=>r.path.endsWith('/download')));
    await page.keyboard.press('Escape');
  });
  await check('Unsupported and oversized attachments never reach the API',async()=>{
    const before=requests.filter(r=>r.path.endsWith('/analyze')).length;
    await page.locator('#attachFileInput').setInputFiles({name:'scan.png',mimeType:'image/png',buffer:Buffer.from('image')});await text('#attachmentStatus','Scanned images');
    await page.locator('#attachFileInput').setInputFiles({name:'large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(10*1024*1024+1)});await text('#attachmentStatus','larger than 10 MB');
    assert.equal(requests.filter(r=>r.path.endsWith('/analyze')).length,before);
  });
  await check('Valid uploads show analysis and server errors stay visible',async()=>{
    await page.locator('#attachFileInput').setInputFiles({name:'brief.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF test')});await text('#attachGrid','Uploaded.pdf');
    state.upload='failure';await page.locator('#attachFileInput').setInputFiles({name:'blank.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF test')});await text('#attachGrid','No readable text found');
  });
  await check('Attachment deletion confirmation and empty state',async()=>{
    await page.locator('.attach-card[data-attachment-id="attachment-1"]').click();
    page.once('dialog',dialog=>dialog.accept());await page.locator('[data-attachment-delete-id="1"]').click();
    await page.locator('#attachmentModal.is-open').waitFor({state:'hidden'});
    assert(requests.some(r=>r.path==='/api/attachment/1'&&r.method==='DELETE'));
    await go('dashboard');await go('attachments');await text('#attachGrid','No attachments analyzed');
  });
  await check('Theme changes update chart labels and survive reload',async()=>{
    await go('dashboard');
    const colors=await page.evaluate(()=>({chart:Chart.getChart('activityChart').options.scales.y.ticks.color,token:getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim()}));
    assert.equal(colors.chart,colors.token);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await shot('dashboard-dark');
    await page.reload();await text('#loggedInUserName','Aditi');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  });
  await check('Organization and all settings tabs render',async()=>{
    await go('organization');await text('#orgUsersGrid','Aditi');assert(await page.locator('#demoNotice').isHidden());
    await go('settings');
    assert.equal(await page.locator('.attachment-modal:visible').count(),0, 'Settings dialogs must start closed');
    const tabs=await page.locator('#settingsTabs [data-tab]').evaluateAll(els=>els.map(el=>el.dataset.tab));
    for(const tab of tabs){await page.locator(`#settingsTabs [data-tab="${tab}"]`).click();await page.locator(`#tab-${tab}`).waitFor({state:'visible'});}
  });
  await check('Role, department, team, and user dialogs retain their save requests',async()=>{
    for(const [tab,add,field,save,modal,value] of [
      ['roles','addRoleBtn','roleFormName','roleFormSaveBtn','roleModal','Reviewer'],
      ['dept','addDepartmentBtn','departmentFormName','departmentFormSaveBtn','departmentModal','Review team'],
      ['team','addTeamBtn','teamFormName','teamFormSaveBtn','teamModal','Drafting team']
    ]){
      await page.locator(`#settingsTabs [data-tab="${tab}"]`).click();await page.locator('#'+add).click();await page.locator('#'+field).fill(value);
      if(tab==='team')await page.locator('#teamFormDepartment').selectOption('1');
      await page.locator('#'+save).click();await page.locator('#'+modal+'.is-open').waitFor({state:'hidden'});
    }
    await page.locator('#settingsTabs [data-tab="users"]').click();await page.locator('#addUserBtn').click();
    await page.locator('#userFormFullName').fill('Test reviewer');await page.locator('#userFormUsername').fill('reviewer@example.test');
    await page.locator('#userFormPassword').fill('test-only-password');await page.locator('#userFormRole').selectOption('1');
    await page.locator('#userFormSaveBtn').click();await page.locator('#userModal.is-open').waitFor({state:'hidden'});
    for(const resource of ['role','department','team','user'])assert(requests.some(r=>r.path===`/api/${resource}/addupd`&&r.method==='POST'));
  });
  await check('Settings user rows and tabs retain their layout in both themes',async()=>{
    for (const theme of ['light','dark']) {
      if(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#themeToggle').click();
      await go('settings');await page.locator('#settingsTabs [data-tab="users"]').click();
      await page.waitForFunction(()=>document.querySelectorAll('.user-list-item').length===5);
      const layout=await page.locator('.user-list-item').first().evaluate(el=>{
        const a=el.querySelector('.mini-avatar').getBoundingClientRect(),b=el.querySelector('.user-list-main').getBoundingClientRect();
        return {display:getComputedStyle(el).display,align:getComputedStyle(el).textAlign,gap:b.left-a.right,center:Math.abs((a.top+a.height/2)-(b.top+b.height/2))};
      });
      assert.equal(layout.display,'flex');assert.equal(layout.align,'left');assert(layout.gap>=12&&layout.center<2);
      assert.equal(await page.locator('#settingsTabs').evaluate(el=>getComputedStyle(el).display),'flex');
      await shot('settings-users-'+theme);
      await page.locator('#addUserBtn').click();await shot('settings-dialog-'+theme);await page.keyboard.press('Escape');
    }
  });
  await check('Organization identities remain visible and fit long names in both themes',async()=>{
    for (const theme of ['light','dark']) {
      if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#themeToggle').click();
      await go('organization');await text('#orgUsersGrid','Alexandra');
      const identity=await page.locator('.org-user-card .mini-avatar').first().evaluate(el=>({ink:getComputedStyle(el).color,fill:getComputedStyle(el).backgroundColor}));
      assert.notEqual(identity.ink,identity.fill);assert.notEqual(identity.fill,'rgba(0, 0, 0, 0)');
      await shot('organization-'+theme);
    }
  });
  await check('Attachment panels fit their content and the close control stays reachable',async()=>{
    state.attachments=[{...record,description:'Detailed document information. '.repeat(40)}];
    await go('attachments');await page.locator('.attach-card').first().click();
    const summary=await page.locator('.attachment-modal__summary').boundingBox(), info=await page.locator('.attachment-modal__info').boundingBox();
    assert(summary.height<info.height);
    await page.locator('#attachmentModal .attachment-modal__dialog').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    await shot('attachment-scrolled');
    const close=await page.locator('#attachmentModal .attachment-modal__close').boundingBox();
    assert(close.y>=0&&close.y+close.height<1000);
    await page.locator('#attachmentModal .attachment-modal__close').click();
  });
  await check('Logo and favicon assets load with valid formats',async()=>{
    const links=await page.locator('link[rel*="icon"]').evaluateAll(els=>els.map(el=>el.href));
    assert.equal(links.length,5);
    for(const url of links){const response=await context.request.get(url);assert.equal(response.status(),200);assert((await response.body()).length>0);}
    assert(await page.locator('.brand-icon img').evaluate(el=>el.complete&&el.naturalWidth>0));
  });
  await check('All pages fit desktop, tablet, and small mobile screens in both themes',async()=>{
    const pages=await page.locator('.nav-item[data-page]').evaluateAll(els=>els.map(el=>el.dataset.page));
    for(const width of [1440,900,390,320]){
      await page.setViewportSize({width,height:900});
      for(const theme of ['light','dark']){
        if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#themeToggle').click();
        for(const name of pages){await go(name);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,`${name} overflows at ${width}px in ${theme}`);}
      }
    }
    await page.setViewportSize({width:390,height:844});await go('inbox');await shot('mobile-inbox-dark');
  });
  await check('Mobile menu supports close, Escape, focus return, and navigation',async()=>{
    await page.locator('#menuToggle').click();assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'true');
    assert(await page.locator('.main').evaluate(el=>el.inert));await shot('mobile-navigation');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
    assert(await page.locator('#menuToggle').evaluate(el=>el===document.activeElement));
    await go('reply');assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
    await page.locator('.search-box input').click();
    assert(await page.locator('.search-box input').evaluate(el=>el===document.activeElement));
  });
  await check('Expired session redirects to sign-in and clears the token',async()=>{
    state.profile='expired';await page.reload();await page.waitForURL('**/login.html');assert.equal(await page.evaluate(()=>localStorage.getItem('ai-emailer-token')),null);state.profile='success';
  });
  await check('Login validation, password visibility, failure, and success',async()=>{
    await page.locator('#loginBtn').click();await text('#emailError','required');await text('#passwordError','required');
    await page.locator('#email').fill('aditi@example.test');await page.locator('#password').fill('test-only-password');
    await page.locator('#pwToggle').click();assert.equal(await page.locator('#password').getAttribute('type'),'text');assert.equal(await page.locator('#pwToggle').getAttribute('aria-label'),'Hide password');
    state.login='failure';await page.locator('#loginBtn').click();await text('#passwordError','Invalid credentials');await shot('mobile-login-dark');
    state.login='success';await page.locator('#loginBtn').click();await page.waitForURL('**/index.html');await text('#loggedInUserName','Aditi');
  });
  await check('Logout clears the session and returns to sign-in',async()=>{
    await page.locator('#menuToggle').click();await page.locator('.logout').click();await page.waitForURL('**/login.html');assert.equal(await page.evaluate(()=>localStorage.getItem('ai-emailer-token')),null);
    await page.setViewportSize({width:1440,height:1000});await page.locator('#themeToggle').click();await shot('login-light');
  });
  assert.deepEqual(errors,[],'Unexpected browser errors');
  fs.writeFileSync(path.join(output,engine+'-results.json'),JSON.stringify({passed:results.length,checks:results,errors},null,2));
  console.log(JSON.stringify({engine,passed:results.length,errors,output}));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});


