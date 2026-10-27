/* Lõi trình phát bài giảng (chạy ở phía người học): điều hướng bài/phần, tiến độ, menu di động.
   Mã riêng của từng khối được ghép thêm vào sau tệp này khi xuất. */
(function(){
  var S=[].slice.call(document.querySelectorAll('main>section'));
  var A=[].slice.call(document.querySelectorAll('nav a[href^="#"]'));
  var L=S.filter(function(s){return s.hasAttribute('data-lesson')});
  var bar=document.querySelector('.progress i'),nav=document.getElementById('nav'),btn=document.querySelector('.menu');
  if(!S.length)return;

  /* Nhớ vị trí cuộn của từng phần (tab) trong từng bài, và phần đang xem của mỗi bài — chuyển qua lại không bị kéo về đầu trang */
  var memo={},mk='bg-scroll:'+location.pathname+'|'+document.title;
  try{memo=JSON.parse(sessionStorage.getItem(mk)||'{}')}catch(e){}
  function selTab(s){var t=s.querySelector('[role=tab][aria-selected=true]');return t?t.dataset.tab:''}
  function keyOf(s){return s.id+'/'+selTab(s)}
  function save(){try{sessionStorage.setItem(mk,JSON.stringify(memo))}catch(e){}}
  function remember(s){if(s&&!s.hidden){memo[keyOf(s)]=Math.round(window.pageYOffset);save()}}
  function jump(y){window.scrollTo({top:y,left:0,behavior:'instant'})}
  /* khôi phục vị trí đã nhớ; phần chưa từng xem: nếu đang cuộn sâu hơn đầu thẻ nội dung thì đưa về đầu thẻ (thanh tab nổi vẫn thấy) */
  function restore(s){
    var y=memo[keyOf(s)];
    if(y==null){var c=s.querySelector('.card'),top=c?Math.max(0,c.getBoundingClientRect().top+window.pageYOffset-12):0;y=window.pageYOffset>top?top:window.pageYOffset}
    jump(y);requestAnimationFrame(function(){jump(y)});
  }

  function pick(s,id){
    s.querySelectorAll('[role=tab]').forEach(function(b){var on=b.dataset.tab===id;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1});
    s.querySelectorAll('[role=tabpanel]').forEach(function(p){p.hidden=p.dataset.tab!==id});
    memo['tab:'+s.id]=id;
  }
  function menu(open){if(!nav||!btn)return;nav.classList.toggle('open',open);btn.setAttribute('aria-expanded',open);btn.textContent=open?'✕ Đóng':'☰ Mục lục'}
  /* chiều cao thanh trên cùng (màn hình hẹp) để ngăn kéo mục lục mở bên dưới nó, không che nút ☰/✕ */
  function tbh(){var t=document.querySelector('.topbar');if(t)document.documentElement.style.setProperty('--tbh',t.offsetHeight+'px')}
  tbh();addEventListener('resize',tbh);addEventListener('load',tbh);
  /* bấm ra ngoài ngăn kéo (vùng tối) chỉ để đóng mục lục, không kích hoạt nút bên dưới */
  document.addEventListener('click',function(e){
    if(nav&&btn&&nav.classList.contains('open')&&!nav.contains(e.target)&&!btn.contains(e.target)){menu(false);e.preventDefault();e.stopPropagation()}
  },true);
  var curS=null,first=true;
  function go(focus){
    var id=(location.hash||'#'+S[0].id).slice(1);
    if(!S.some(function(s){return s.id===id}))id=S[0].id;
    if(curS&&curS.id!==id)remember(curS);
    S.forEach(function(s){
      var on=s.id===id;s.hidden=!on;
      if(on){
        var p=s.querySelector('[role=tabpanel]'),want=memo['tab:'+s.id],pw=want&&s.querySelector('[role=tabpanel][data-tab="'+want+'"]');
        if(p)pick(s,(pw||p).dataset.tab);
        if(focus===true){var t=s.querySelector('h2');if(t)t.focus({preventScroll:true})}
      }
    });
    A.forEach(function(a){if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
    var i=L.map(function(s){return s.id}).indexOf(id);
    if(bar)bar.style.width=i<0?'0':((i+1)/L.length*100)+'%';
    menu(false);
    var now=S.filter(function(s){return s.id===id})[0],hasMemo=memo[keyOf(now)]!=null;
    if(curS!==now||first){if(hasMemo)restore(now);else jump(0)}
    curS=now;first=false;
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[role=tab]');if(b){var sec=b.closest('section');if(b.dataset.tab===selTab(sec))return;remember(sec);pick(sec,b.dataset.tab);restore(sec)}});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')menu(false);
    var b=e.target.closest&&e.target.closest('[role=tab]');if(!b)return;
    var l=[].slice.call(b.parentNode.querySelectorAll('[role=tab]')),i=l.indexOf(b);
    var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:e.key==='Home'?0:e.key==='End'?l.length-1:-1;
    if(n<0)return;e.preventDefault();n=(n+l.length)%l.length;l[n].focus();var sec=b.closest('section');remember(sec);pick(sec,l[n].dataset.tab);restore(sec);
  });
  if(btn)btn.addEventListener('click',function(){menu(!nav.classList.contains('open'))});
  addEventListener('hashchange',function(){go(true)});
  go();
  addEventListener('pagehide',function(){remember(curS)});

  /* ----- Công cụ giảng dạy (máy tính): cỡ chữ/kích thước nội dung, ẩn mục lục, toàn màn hình. Cài đặt được nhớ trong trình duyệt. ----- */
  var tools=document.querySelector('.tools'),root=document.documentElement,zv=tools&&tools.querySelector('.zv'),su=1;
  function store(k,v){try{if(v==null)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
  function zoom(v){
    su=Math.min(2.2,Math.max(.6,Math.round(v*100)/100));
    root.style.setProperty('--su',su);if(zv)zv.textContent=Math.round(su*100)+'%';store('bg-su',su);
  }
  function focusMode(on){document.body.classList.toggle('focus',on);store('bg-focus',on?'1':'0')}
  if(tools){
    var saved=parseFloat(store('bg-su'));if(saved>0)zoom(saved);
    if(store('bg-focus')==='1')focusMode(true);
    tools.addEventListener('click',function(e){
      var b=e.target.closest('[data-t]');if(!b)return;
      var t=b.getAttribute('data-t');
      if(t==='z+')zoom(su+.1);else if(t==='z-')zoom(su-.1);else if(t==='z0')zoom(1);
      else if(t==='nav')focusMode(!document.body.classList.contains('focus'));
      else if(t==='fs'){if(document.fullscreenElement)document.exitFullscreen();else if(root.requestFullscreen)root.requestFullscreen()}
    });
  }
})();

/* Thanh điều khiển audio dùng chung (khối Hội thoại, Bài đọc, ...). HTML do BlockLib.bar.html() tạo (js/blocklib.js).
   Dùng:  var bar=HtBar(root,{tick:fn(t), stopped:fn()});   root = phần tử gốc của khối, có data-l (JSON nhãn: play, stop, show, hide)
   Trả về {au, playRange(start,end), pause()} hoặc null nếu khối không có audio. */
(function(){
  function fmt(s){s=Math.max(0,s||0);var m=Math.floor(s/60),c=Math.floor(s%60);return(m<10?'0':'')+m+':'+(c<10?'0':'')+c}

  window.HtBar=function(root,hooks){
    var bar=root.querySelector('.ab-bar');if(!bar)return null;
    hooks=hooks||{};
    var L={};try{L=JSON.parse(root.getAttribute('data-l')||'{}')}catch(e){}
    var au=bar.querySelector('audio'),$=function(s){return bar.querySelector(s)};
    var tm=$('.ab-time'),la=$('.ab-la'),lb=$('.ab-lb'),pp=$('.ab-pp'),adv=$('.ab-adv'),tg=$('.ab-tg'),sk=bar.querySelectorAll('.ab-sk');
    var seg=null,A=null,B=null,clicks=0,looping=false,raf=0,shown='';

    function paintTime(){var t=fmt(au.currentTime);if(t!==shown){shown=t;tm.textContent=t}}
    function paintPP(){pp.textContent=au.paused?L.play:L.stop}
    function lock(on){[].forEach.call(sk,function(b){b.disabled=on})}
    function unloop(){looping=false;lock(false)}
    function go(){var p=au.play();if(p&&p.catch)p.catch(function(){})}

    /* Gọi liên tục khi đang phát (rAF + timeupdate) để dừng đúng mốc kết thúc đoạn và lặp A–B */
    function check(){
      paintTime();
      var t=au.currentTime;
      if(seg&&t>=seg.e){au.pause();return}
      if(looping&&A!==null&&B!==null&&t>=B){au.currentTime=A;return}
      if(!seg&&!au.paused&&hooks.tick)hooks.tick(t);
    }
    function tick(){check();raf=requestAnimationFrame(tick)}
    au.addEventListener('play',function(){paintPP();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)});
    function stopped(){paintPP();cancelAnimationFrame(raf);seg=null;paintTime();if(hooks.stopped)hooks.stopped()}
    au.addEventListener('pause',stopped);au.addEventListener('ended',stopped);
    au.addEventListener('timeupdate',check);au.addEventListener('seeked',paintTime);au.addEventListener('loadedmetadata',paintTime);

    pp.addEventListener('click',function(){if(au.paused)go();else au.pause()});

    /* Bấm vào số giờ khi đang tạm dừng: lần 1 = điểm bắt đầu, lần 2 = điểm kết thúc */
    tm.addEventListener('click',function(){
      if(!au.paused)return;
      clicks++;
      if(clicks===1){A=au.currentTime;la.textContent=fmt(A)}
      else{
        B=au.currentTime;
        if(A===null||B<=A){B=null;lb.textContent='--:--'}else lb.textContent=fmt(B);
        clicks=0;
      }
    });
    $('.ab-loop').addEventListener('click',function(){
      if(A===null||B===null)return;
      seg=null;au.currentTime=A;go();looping=true;lock(true);
    });
    $('.ab-clr').addEventListener('click',function(){
      A=B=null;la.textContent=lb.textContent='--:--';clicks=0;unloop();
    });
    [].forEach.call(sk,function(b){b.addEventListener('click',function(){
      if(looping)return;
      var d=+b.getAttribute('data-d'),max=isFinite(au.duration)?au.duration:1e9;
      au.currentTime=Math.min(max,Math.max(0,au.currentTime+d));paintTime();
    })});
    tg.addEventListener('click',function(){adv.hidden=!adv.hidden;tg.textContent=adv.hidden?L.show:L.hide;tg.setAttribute('aria-expanded',!adv.hidden)});
    paintPP();

    return{
      au:au,
      /* Phát từ start đến end rồi tự dừng (hủy chế độ lặp) */
      playRange:function(s,e){unloop();seg={e:e};au.currentTime=s;go()},
      pause:function(){au.pause()}
    };
  };

  /* Chỉ một audio phát tại một thời điểm; rời bài/phần khác thì dừng audio đã bị ẩn */
  document.addEventListener('play',function(e){
    [].forEach.call(document.querySelectorAll('.ab-bar audio'),function(a){if(a!==e.target)a.pause()});
  },true);
  function pauseHidden(){[].forEach.call(document.querySelectorAll('.ab-bar audio'),function(a){if(!a.paused&&a.offsetParent===null)a.pause()})}
  document.addEventListener('click',function(){setTimeout(pauseHidden,0)});
  addEventListener('hashchange',function(){setTimeout(pauseHidden,0)});
})();

/* Khối Phỏng Vấn (phía người học): bấm câu để nghe, chế độ 听访谈 / 回答问题 (nhớ vị trí), ẩn/hiện từ điển & bản dịch, trắc nghiệm đúng/sai ngay. */
(function(){
  function tpl(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]})}
  var OWN=null;   // audio riêng của câu đang phát

  function init(root){
    var L={};try{L=JSON.parse(root.getAttribute('data-l')||'{}')}catch(e){}
    var $=function(s){return root.querySelector(s)},$$=function(s){return [].slice.call(root.querySelectorAll(s))};
    var chat=$('.iv-chat'),quiz=$('.iv-quiz'),modes=$$('.iv-mode');
    var bubbles=$$('.iv-b'),cur=null,mem={y:0,t:0,qy:null};   // y: vị trí cuộn bên 听访谈, qy: vị trí cuộn bên 回答问题, t: vị trí audio

    function mark(el){if(cur===el)return;cur=el;bubbles.forEach(function(b){b.classList.toggle('playing',b===el)})}
    function stopOwn(){if(OWN){try{OWN.pause()}catch(e){}OWN=null}}
    function follow(el){
      if(!el)return;var r=el.getBoundingClientRect(),H=window.innerHeight||document.documentElement.clientHeight;
      if(r.top<80||r.bottom>H-80)el.scrollIntoView({block:'center',behavior:'smooth'});
    }

    var bar=HtBar(root,{
      tick:function(t){   // đang phát: sáng bong bóng của câu đang nói và cuộn theo
        var f=null;bubbles.forEach(function(b){
          if(b.hasAttribute('data-s')&&t>=+b.getAttribute('data-s')&&t<+b.getAttribute('data-e'))f=b});
        if(f!==cur){mark(f);if(f&&!bar.au.paused)follow(f)}
      },
      stopped:function(){mark(null)}
    });
    if(bar)bar.au.addEventListener('play',stopOwn);

    /* ----- bấm câu thoại để nghe ----- */
    function playBubble(b){
      if(b.hasAttribute('data-own')){
        var a=b.querySelector('.iv-la');if(!a)return;
        if(bar)bar.pause();stopOwn();
        $$('.iv-la').forEach(function(o){if(o!==a)o.pause()});
        mark(b);a.currentTime=0;OWN=a;
        a.onended=a.onpause=function(){if(cur===b)mark(null)};
        var p=a.play();if(p&&p.catch)p.catch(function(){});
      }else if(bar&&b.hasAttribute('data-s')){stopOwn();mark(b);bar.playRange(+b.getAttribute('data-s'),+b.getAttribute('data-e'))}
    }
    root.addEventListener('click',function(e){
      var tb=e.target.closest&&e.target.closest('.iv-trb');
      if(tb&&root.contains(tb)){
        e.stopPropagation();var r=tb.closest('.iv-r');
        r.classList.toggle(root.classList.contains('iv-notr')?'tr-open':'tr-shut');return;
      }
      var b=e.target.closest&&e.target.closest('.iv-pl');
      if(b&&root.contains(b))playBubble(b);
    });
    root.addEventListener('keydown',function(e){
      if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('iv-pl')){e.preventDefault();playBubble(e.target)}
    });

    /* ----- chuyển 听访谈 / 回答问题: nhớ vị trí cuộn và vị trí audio để quay lại đúng chỗ ----- */
    function setMode(m){
      var q=m==='quiz';if(!quiz)return;
      if(q?!quiz.hidden:!chat.hidden)return;   // đã ở đúng chế độ
      if(q){mem.y=window.pageYOffset;if(bar){mem.t=bar.au.currentTime;bar.pause()}stopOwn();$$('.iv-la').forEach(function(a){a.pause()})}
      else mem.qy=window.pageYOffset;
      chat.hidden=q;quiz.hidden=!q;
      modes.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-m')===m?'true':'false')});
      if(q){if(mem.qy!=null)window.scrollTo({top:mem.qy,behavior:'instant'});else root.scrollIntoView({block:'start'})}
      else{
        if(bar&&isFinite(mem.t))try{bar.au.currentTime=mem.t}catch(e){}
        window.scrollTo({top:mem.y,behavior:'instant'});
      }
    }
    modes.forEach(function(b){b.addEventListener('click',function(){setMode(b.getAttribute('data-m'))})});

    /* ----- bật/tắt từ điển, bản dịch ----- */
    $$('.iv-tg').forEach(function(btn){
      btn.addEventListener('click',function(){
        var on=btn.getAttribute('aria-pressed')!=='true',k=btn.getAttribute('data-tg');
        btn.setAttribute('aria-pressed',on?'true':'false');root.classList.toggle('iv-no'+k,!on);
        if(k==='tr')$$('.iv-r').forEach(function(r){r.classList.remove('tr-open','tr-shut')});
      });
    });

    /* ----- trắc nghiệm: đúng/sai hiện ngay; khóa sau khi chọn; "Làm lại" xóa lựa chọn ----- */
    if(quiz){
      var qs=$$('.iv-q'),res=$('.iv-res'),rt=$('.iv-retry');
      function summary(){
        var done=qs.filter(function(q){return q.hasAttribute('data-pick')});
        if(done.length<qs.length){res.hidden=true;return}
        var s=qs.filter(function(q){return q.getAttribute('data-pick')===q.getAttribute('data-ok')}).length;
        res.textContent=tpl(L.res,{s:s,n:qs.length,p:(s/qs.length*100).toFixed(0)});
        if(s===qs.length){var d=document.createElement('div');d.className='iv-all';d.textContent=L.all;res.appendChild(d)}
        res.hidden=false;rt.hidden=false;
      }
      qs.forEach(function(q){
        var os=[].slice.call(q.querySelectorAll('.iv-o')),ok=+q.getAttribute('data-ok'),fb=q.querySelector('.iv-fb'),nt=q.querySelector('.iv-nt');
        os.forEach(function(o){o.addEventListener('click',function(){
          if(q.hasAttribute('data-pick'))return;
          var k=+o.getAttribute('data-k'),good=k===ok;
          q.setAttribute('data-pick',k);q.setAttribute('data-tries',String((+q.getAttribute('data-tries')||0)+1));
          if(!q.hasAttribute('data-first'))q.setAttribute('data-first',good?'1':'0');
          os.forEach(function(x){x.disabled=true});
          o.classList.add(good?'y':'n');if(!good)os[ok].classList.add('hit','y');
          fb.textContent=good?L.ok:L.bad+'  '+L.ans+'ABCDEF'[ok];fb.className='iv-fb '+(good?'y':'n');fb.hidden=false;
          if(nt)nt.hidden=false;
          summary();
        })});
      });
      rt.addEventListener('click',function(){
        qs.forEach(function(q){
          q.removeAttribute('data-pick');
          [].forEach.call(q.querySelectorAll('.iv-o'),function(o){o.disabled=false;o.classList.remove('y','n','hit')});
          var fb=q.querySelector('.iv-fb'),nt=q.querySelector('.iv-nt');fb.hidden=true;if(nt)nt.hidden=true;
        });
        res.hidden=true;rt.hidden=true;quiz.scrollIntoView({block:'start',behavior:'smooth'});
      });
    }
  }
  [].forEach.call(document.querySelectorAll('.iv'),init);
})();
