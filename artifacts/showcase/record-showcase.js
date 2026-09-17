async page => {
  // Run in an already authenticated, temporary browser session. No credentials are stored here.
  const path = 'iveph-showcase-master.webm';
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('https://www.iveph.com/');
  await page.getByRole('heading', { name: 'ALL IN. ALL IVE.' }).waitFor();
  await page.getByRole('button', { name: 'SumiTest', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.mouse.move(1880, 1040);

  const hold = ms => page.waitForTimeout(ms);
  const scroll = async (target, duration = 1700) => {
    await page.evaluate(({ target, duration }) => new Promise(resolve => {
      const from = window.scrollY;
      const to = Math.max(0, Math.min(target, document.documentElement.scrollHeight - innerHeight));
      const started = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - started) / duration);
        const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(tick); else resolve();
      }
      requestAnimationFrame(tick);
    }), { target, duration });
  };
  const frame = async (locator, offset = 120, duration = 1700) => {
    const target = await locator.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    await scroll(target - offset, duration);
  };
  let caption;
  const label = async (number, title, description) => {
    if (caption) await caption.dispose();
    caption = await page.screencast.showOverlay(`<div style="position:absolute;right:56px;bottom:44px;width:390px;padding:22px 26px;background:rgba(10,10,14,.94);border-left:3px solid #ef9cc2;box-shadow:0 12px 40px #0005;font-family:Arial,sans-serif;color:#f6f3f5"><div style="font-size:12px;letter-spacing:2.5px;color:#ef9cc2;margin-bottom:10px">${number} / DIVE INTO IVE</div><div style="font-size:27px;font-weight:600;line-height:1.2;margin-bottom:8px">${title}</div><div style="font-size:15px;line-height:1.5;color:#c4bec7">${description}</div></div>`);
  };
  const cover = async (title, description) => page.screencast.showOverlay(`<div style="position:absolute;inset:0;background:#0a0a0e;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#f6f3f5;font-family:Arial,sans-serif"><div style="font-size:15px;letter-spacing:5px;color:#ef9cc2;margin-bottom:30px">A HOME FOR PHILIPPINE DIVEs</div><div style="font-size:94px;font-weight:800;letter-spacing:-4px;line-height:1.05;text-align:center">${title}</div><div style="width:68px;height:3px;background:#ef9cc2;margin:36px 0"></div><div style="font-size:22px;color:#c4bec7;text-align:center;line-height:1.7">${description}</div><div style="position:absolute;bottom:52px;font-size:12px;letter-spacing:1px;color:#b5afb8">INDEPENDENT • NON-COMMERCIAL • MADE BY FANS</div></div>`);
  const navigate = async (action, ready, prepare = async () => {}) => {
    if (caption) { await caption.dispose(); caption = undefined; }
    const transition = await page.screencast.showOverlay('<div style="position:absolute;inset:0;background:#0a0a0e;display:grid;place-items:center;color:#ef9cc2;font:500 56px Arial,sans-serif;letter-spacing:-3px">IVE<span style="position:absolute;bottom:48px;letter-spacing:3px;font-size:12px">IVEPH.COM</span></div>');
    await action();
    await ready.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await prepare();
    await hold(700);
    await transition.dispose();
    await page.mouse.move(1880, 1040);
  };
  const explore = name => async () => {
    await page.getByRole('button', {name:'Explore', exact:true}).click();
    await page.getByRole('menuitem', {name, exact:true}).click();
  };

  await page.screencast.start({ path, size: { width: 1920, height: 1080 } });
  try {
    // This is a video-only privacy cover over the test account name in the header.
    await page.screencast.showOverlay('<div style="position:absolute;right:0;top:0;width:410px;height:88px;background:#0a0a0e;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #ffffff24;font:600 14px Arial,sans-serif;letter-spacing:2px;color:#ef9cc2">WWW.IVEPH.COM</div>');
    const intro = await cover('ALL IN.<br><span style="color:#ef9cc2">ALL IVE.</span>', 'Music. Moments. Community.<br>www.iveph.com');
    await hold(2900);
    await intro.dispose();
    await label('01', 'A place for every DIVE', 'Explore IVE, through the eyes of a fan community.');
    await hold(4700);
    await caption.dispose(); caption = undefined;

    await frame(page.getByRole('heading', {name:'SIX STARS. ONE IVE.'}), 132, 2300);
    await label('02', 'Six stars. One IVE.', 'Meet Yujin, Gaeul, Rei, Wonyoung, Liz and Leeseo.');
    await hold(2700);
    await page.getByRole('link', {name:"Explore Yujin's profile"}).hover();
    await hold(900);
    await page.getByRole('link', {name:"Explore Wonyoung's profile"}).hover();
    await hold(900);
    await caption.dispose(); caption = undefined;
    await page.getByRole('button', {name:'Enter the 3D universe', exact:true}).click();
    await page.getByRole('heading', {name:'The IVE universe',exact:true}).waitFor();
    await frame(page.getByRole('heading', {name:'The IVE universe',exact:true}), 130);
    await label('03', 'Step into the IVE universe', 'An interactive way to discover the members.');
    await page.mouse.move(1880,1040);
    await hold(4700);

    await navigate(() => page.getByRole('link', {name:'Photo gallery',exact:true}).click(), page.getByRole('heading',{name:'Through a DIVE’s lens.'}));
    await label('04', 'Through a DIVE’s lens', 'Manila fansign photography by @GrantSor. Shared with permission.');
    await hold(2600);
    await frame(page.getByRole('figure').filter({has:page.getByRole('heading',{name:'A moment between roses'})}), 124, 2100);
    await hold(2700);
    await caption.dispose(); caption = undefined;
    await frame(page.getByRole('heading',{name:'Manila, in focus.'}), 120, 1900);
    await hold(1300);
    await page.getByRole('button',{name:'Wonyoung',exact:true}).click();
    await hold(1500);
    await page.getByRole('button',{name:'View Wonyoung in bloom full size'}).click();
    await page.getByRole('dialog',{name:'Wonyoung in bloom'}).waitFor();
    await page.mouse.move(1880,1040);
    await hold(4300);
    await page.getByRole('button',{name:'Close photo viewer'}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});

    await navigate(explore('Dashboard'), page.getByRole('heading',{name:'IVE YouTube Metrics Dashboard'}));
    await label('05', 'Music, in numbers', 'Explore IVE’s videos and YouTube milestones.');
    await hold(3100);
    await scroll(390,1800);
    await hold(2000);

    await navigate(explore('Daily quiz'), page.getByRole('button',{name:'I Have',exact:true}));
    await label('06', 'How well do you know IVE?', 'Daily quizzes for your inner DIVE.');
    await hold(2300);
    await page.getByRole('button',{name:'I Have',exact:true}).click();
    await hold(1300);
    await page.getByRole('button',{name:'Starship Entertainment',exact:true}).click();
    await page.mouse.move(1880,1040);
    await hold(1800);

    await navigate(explore('Card game'), page.getByRole('heading',{name:'Play, connect, and build your record'}), async () => {
      await page.getByRole('textbox',{name:'Your stage name',exact:true}).fill('DIVE');
      await frame(page.getByRole('region',{name:'Card game table',exact:true}),110,1);
    });
    await label('07', 'IVE Night: Backstage Panic', 'A fan card game with friends or AI rivals.');
    await hold(4900);
    await scroll(await page.evaluate(()=>window.scrollY+240),1400);
    await hold(1800);

    await navigate(() => page.getByRole('link',{name:'Home',exact:true}).click(),page.getByRole('heading',{name:'ALL IN. ALL IVE.'}));
    await hold(2200);
    const outro = await cover('ALWAYS IVE.<br><span style="color:#ef9cc2">ALWAYS DIVE.</span>', 'Visit <strong style="color:#fff">www.iveph.com</strong><br><span style="font-size:16px">Featured fansign photography © GrantSor · Used with permission</span>');
    await hold(4100);
    await outro.dispose();
  } finally {
    await page.screencast.stop();
    await page.screencast.hideOverlays();
  }
  return {path, format:'1920×1080, landscape', loginRecorded:false};
}
