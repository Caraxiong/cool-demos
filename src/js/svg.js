const _SVG = document.querySelector('svg'),  //获取svg对象
      // _STAR = document.getElementById('star'), //获取星星path对象
      // _HEART = document.getElementById('heart'), //获取心形path对象
      _SHAPE = document.getElementById('shape'), //获取path对象
      D = 1000, //viewBox的尺寸
      O = {}, //存储过渡的初始和最终状态，以及一个将我们想要的值设置给svg图形属性的方法
      P = 5, // 三次曲线、多边形顶点数
      NF = 50, // 转变动画的总帧数（NF）
      // 从星形到心形的的路径（path）转变我们选择ease-in-out函数，旋转角度的转变我们选择 bounce-ini-fin 函数，填充（fill）颜色转变我们选择ease-out 函数
      TFN = { 
        'ease-out': function(k) { 
          return 1 - Math.pow(1 - k, 1.675) 
        }, 
        'ease-in-out': function(k) { 
          return .5*(Math.sin((k - .5)*Math.PI) + 1) 
        }, 
        'bounce-ini-fin': function(k, s = -.65*Math.PI, e = -s) { 
          return (Math.sin(k*(e - s) + s) - Math.sin(s))/(Math.sin(e) - Math.sin(s)) 
        } 
      };

// 设置一个dir变量，当我们从星形变成心形时，它的值是1。当我们从心形转换成星形时，它的值是-1。初始值是-1
let dir = -1;
// 请求变量 ID（rID） 当前帧变量 （cf） 乘数变量 m ，用于防止我们从最终状态（心形）返归到最初状态（星形）时倒转时间函数
let rID = null, cf = 0, m;

// 当过渡结束时被调用的函数stopAni()
function stopAni() { 
  cancelAnimationFrame(rID); 
  rID = null; 
}; 
// 插值函数
// 一个可选的属性，稍稍调整更新函数和插值函数  继续顺着同一个方向旋转
function int(ini, rng, tfn, k ,cnt) { 
  return typeof ini == 'number' ? 
        Math.round(ini + cnt*(m + dir*tfn(m + dir*k))*rng) : 
        ini.map((c, i) => int(ini[i], rng[i], tfn, k, cnt)) 
};

// 点击时第一个被调用并在每次显示刷新的时候都会被调用的函数update()
function update() { 
  cf += dir; 
  let k = cf/NF; 
  if(!(cf%NF)) { 
    stopAni(); 
    return 
  } 
  // 使用一个循环，我们会遍历所有我们想要从一个状态顺滑转换到另一个状态的属性。在这个循环中，我们先得到插值函数的运算结果，然后将这些属性设置成这个值。插值函数的运算结果取决于初始值（s）、当前属性（ini和 rng）的范围（s）、我们使用的定时函数（tfn） 和进度（k）
  for(let p in O) { 
    let c = O[p]; 
    _SHAPE.setAttribute(p, c.afn(int(c.ini, c.rng, TFN[c.tfn], k, c.cnt ? dir : 1))); 
  }

  rID = requestAnimationFrame(update)
};

//画正五角星
function getStarPoints(f = .5) { 
  const RCO = f*D, // outer (pentagram) circumradius  正五角星形外接圆半径（外层圆的半径）R
  BAS = 2*(2*Math.PI/P), // base angle for star poly  正五角星形一条边所对应的圆心角  144
  BAC = 2*Math.PI/P, // base angle for convex poly    正五角星形内部构成的正五边形的一条边所对应的圆心角 72
  RI = RCO*Math.cos(.5*BAS),// pentagram/ inner pentagon inradius 正五角星形和内部构成的正五边形共用的内接圆的半径（正五变形的顶点是正五角星形边的交叉点）
  RCI = RI/Math.cos(.5*BAC),// inner pentagon circumradius  内部小正五变形的外接圆半径 
  ND = 2*P, // total number of distinct points we need to get  需要计算坐标的点的总数  10
  BAD = 2*Math.PI/ND, // base angle for point distribution  所有点所在的径向线的夹角 2 * 72
  PTS = []; // array we fill with point coordinates 
  // 用一个循环来计算我们想要的点的坐标，并将它们插入坐标数组中
  for(let i = 0; i < ND; i++) {
    let cr = i % 2 ? RCI : RCO,  // 偶数 --> 外层圆    奇数 --> 内层圆
        ca = i * BAD + .5*Math.PI,   //为了使五角星形第一个尖朝下  每个角加 90°
        x = Math.round(cr * Math.cos(ca)),  //四舍五入计算
        y = Math.round(cr * Math.sin(ca));  //四舍五入计算
    PTS.push([x,y]);
    // 我们会把外层圆（索引值是偶数的情况）计算出的坐标值推入坐标数组中两次。因为实际上星形在这个点上有两个重叠的控制点。如果要绘制成心形，就要把这两个重叠的控制点放在别的的位置上
    if(!(i%2)) PTS.push([x,y])
  } 
  return PTS; 
}
//画心形 会返回一个坐标构成的数组
function getHeartPoints(f = .25){
  const R = f*D, // helper circle radius 
        RC = Math.round(R/Math.SQRT2), // circumradius of square of edge R 
        XT = 0, YT = -RC, // coords of point T 
        XA = 2*RC, YA = -RC, // coords of A points (x in abs value) 
        XB = 2*RC, YB = RC, // coords of B points (x in abs value) 
        XC = 0, YC = 3*RC, // coords of point C 
        XD = RC, YD = -2*RC, // coords of D points (x in abs value) 
        XE = 3*RC, YE = 0; // coords of E points (x in abs value)
  // 通过终点和切线交点来获得控制点
  const C = .551915,
        CC = 1 - C, 
        // coords of ctrl points on TD segs 
        XTD = Math.round(CC*XT + C*XD), YTD = Math.round(CC*YT + C*YD), 
        // coords of ctrl points on AD segs 
        XAD = Math.round(CC*XA + C*XD), YAD = Math.round(CC*YA + C*YD), 
        // coords of ctrl points on AE segs 
        XAE = Math.round(CC*XA + C*XE), YAE = Math.round(CC*YA + C*YE), 
        // coords of ctrl points on BE segs 
        XBE = Math.round(CC*XB + C*XE), YBE = Math.round(CC*YB + C*YE);
    return [ [XC, YC], [XC, YC], [-XB, YB],
             [-XBE, YBE], [-XAE, YAE], [-XA, YA],
             [-XAD, YAD], [-XTD, YTD], [XT, YT], 
             [XTD, YTD], [XAD, YAD], [XA, YA], 
             [XAE, YAE], [XBE, YBE], [XB, YB] ].map(([x, y]) => [x, y - .09*R])
}

// 我们把生成实际属性值的函数设置成这样一个函数。这个函数接收两个参数，一个是函数名字，另一个为参数，函数返回由这两个参数组成的字符串
function fnStr(fname, farg) {
  return `${fname}(${farg})`
};

// 创建一个计算数字间差值范围的函数,。无论在这种情况下，还是在数组中，无论数组的嵌套有多深，都可以这个函数来设置我们想要转变的属性的范围值
function range(ini, fin) { 
  return typeof ini == 'number' ? 
        fin - ini : 
        ini.map((c, i) => range(ini[i], fin[i])) 
};

(function init(){
  _SVG.setAttribute('viewBox', [-.5*D,-.5*D, D, D].join(' '));

  // console.log('getStarPoints()',getStarPoints())
  // 给对象O添加数据。添加一个属性（d）来储存有关路径的数据。
  O.d = {
    ini: getStarPoints(),
    fin: getHeartPoints(),
    afn: function(pts) {
      return pts.reduce((a, c, i) => { 
        return a + (i%3 ? ' ' : 'C') + c 
      }, `M${pts[pts.length - 1]}`)
    },
    tfn: 'ease-in-out' //变换的时间函数
  }
  
  // 为了旋转星形，我们需要给它的 transform 属性设置成旋转半个圆的角度。为了到达这个效果，我们首先设置初始的旋转角度为-180
  O.transform = {
    ini: -180,
    fin: 0,
    afn: (ang) => fnStr('rotate', ang),
    tfn: 'bounce-ini-fin', //变换的时间函数
    cnt: 1
  };
  
  // 用类似的方式给我们的星形填充（fill）金色。我们给初始值设置一个 RGB 字符串，用同一个函数来给属性（fill）设置值
  O.fill = {
    ini:[255,215,0],
    fin:[220,20,60],
    afn: (rgb) => fnStr('rgb', rgb),
    tfn: 'ease-out' //变换的时间函数
  };

  for(let p in O){
    O[p].rng = range(O[p].ini, O[p].fin);
    _SHAPE.setAttribute(p, O[p].afn(O[p].ini))
  }

  // 在元素_SHAPE上添加一个click事件监听，监听的函数内容为：改变变量dir的值、改变图形的属性。这样就可以获得从一个金色星形转换成深红色心形，再变回星形的效果.
  _SHAPE.addEventListener('click', e => { 
    if(rID) stopAni(); 
    dir *= -1; 
    m = .5*(1 - dir); 
    update();
  }, false);
})();