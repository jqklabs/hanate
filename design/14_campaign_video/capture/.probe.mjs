import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const B='/Users/leejungjun/hwatro/design/14_campaign_video/capture/.build/index.html';
const br=await chromium.launch();
for (const [w,h] of [[1440,1800],[1440,900],[1280,760]]) {
  const c=await br.newContext({viewport:{width:w,height:h}});
  const p=await c.newPage(); p.setDefaultTimeout(120000);
  await p.goto(`${pathToFileURL(B).href}?capture=1&scene=A1&seed=42`);
  await p.waitForFunction('window.__captureMarks && window.__captureMarks.length>0');
  const r=await p.evaluate(()=>{
    const q=(s)=>{let l=1e9,t=1e9,R=-1e9,b=-1e9;for(const e of document.querySelectorAll(s)){const g=e.getBoundingClientRect();if(g.width<4)continue;l=Math.min(l,g.left);t=Math.min(t,g.top);R=Math.max(R,g.right);b=Math.max(b,g.bottom);}return{l,t,r:R,b};};
    const a=q('#topbar, #side, #table');
    return {vw:innerWidth,vh:innerHeight,top:Math.round(a.t),bottom:Math.round(a.b),left:Math.round(a.l),right:Math.round(a.r)};
  });
  console.log(`뷰포트 ${w}×${h} → UI가 쓰는 범위 x ${r.left}~${r.right}, y ${r.top}~${r.bottom} (높이 ${r.bottom-r.top})`);
  await c.close();
}
await br.close();
