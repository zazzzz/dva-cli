'use strict';

/**
 * @class HeatmapGrid
 */
var L = require('./../leaflet');
var Utils = require('./../core/utils');
var Canvas = require('./../render/canvas');
var getColorFunc = Utils.getColorFunc;
var Anim = require('./../core/animator');
var TrailCanvas = require('./trail_canvas');

/**
 * @class TrailsCanvas 大量轨迹的绘制，基于canvas 包括2部分。 飞线(flying)部分， 看视窗内此刻的轨迹位置 背景线(bgLine)部分, 绘制视窗内所有的轨迹
 */

/**
 * TrailsCanvas 生成网格型点图
 * @param  {Object}  options
 */
function TrailsCanvas(options) {
  options = this.options = Utils.deepMerge(TrailsCanvas.options, options);
  this.initialize(options);
}

TrailsCanvas.options = {
    'lifeSpeed': 0.1,
    'isAutoUpdate': true,
    'lifeMin': 0,
    'lifeMax': 100,
    'trail': {
      'lengthLimit': 60,
      'isAutoUpdate': false,
      'spriteW': 200,
      'spriteH': 20,
      'flying': {
        'isable': true,
        'blending': 'lighter',
        'type': 'line',
        'ptsN': 29,
        'weight': function(percent){
          return 8 * Math.pow(percent, 3);
        },
        'isSpriteHead': true,
        'container': '#canvas-container'
      },
      'bgLine': {
        'container': '#canvas-container',
        'isable': false,
        'blending': 'source-over',
        'opacity': 1,
        'color': 'rgba(250,100,50,0.3)',
        'weight': 2
      },
      'color': {
        'to': 'rgba(255,150,0,0.4)',
        'from': 'rgba(255,150,0,0.4)',
        'space': 'hsl',
        'easing': 'linear.Out.1'
      },
      'value': function (d, max, min) {return Math.min(1, d.length / 40);},
      'lng': Utils.getLng,
      'lat': Utils.getLat,
      'time': Utils.getTime
    },
    'pts': function (d) {return d.p;},
    'id': Utils.getID
  };
  
var TrailsCanvas = Anim.extend(TrailsCanvas, {
  events: {
  },
  initialize: function (options) {
    this.isable = true;
    //
    var trail = options.trail;
    this.lifeMax = options.lifeMax;
    this.lifeMin = options.lifeMin;
    this.life = this.lifeMin;
    this.initSpriteFlying();
    trail.bgLine && this.initSpriteBgLine();
    trail.flying && this.initSpriteFlyingHead();
    if (options.isAutoUpdate) this.initEventsAnim();
  },
  /**
   * initCanvas 生成可视化需要的各个图层
   */
  initCanvas: function () {
    var options = this.options;
    var trail = options.trail;
    var bgLineOpt = trail.bgLine;
    if (bgLineOpt) {
      var opacityBgline = bgLineOpt.opacity;
      var blendingBgline = bgLineOpt.blending;
      this.lcanvasBg = new Canvas(this._map, bgLineOpt.container, {});
      var ctxBg = this.ctxBg = this.lcanvasBg.ctx;

      ctxBg.globalAlpha = opacityBgline;
      ctxBg.globalCompositeOperation = blendingBgline;
      bgLineOpt.ctx = ctxBg;
    }
    //
    var flyingOpt = trail.flying;
    if (flyingOpt) {
      var blendingFlying = flyingOpt.blending;
      this.lcanvas = new Canvas(this._map, flyingOpt.container, {});
      var ctxFlying = this.ctxFlying = this.lcanvas.ctx;
      ctxFlying.globalCompositeOperation = blendingFlying;
      flyingOpt.ctx = ctxFlying;
    }
  },

  addTo: function (map) {
    if (this._map || !map) return;
    this._map = map;
    this.initCanvas();
    this.initEventsMap();
    if (this._data) this.updateZoom();
  },
  //

  initCacheColor: function () {},

  /**
   * data 灌入数据
   * @param  {Object} data 带有经纬度的原始数据
   */
  data: function (d) {
    if (!d) return this._data;
    this._data = d;
    this.trailsInView = {};
    this.trailsEnable = {};
    this.initTrails();
    if (this.options.isAutoUpdate && this._map) this.startAnim();
  },

  /**
   * initTrails 初始化所有的轨迹
   */
  initTrails: function () {
    var options = this.options;
    var trailOpt = options.trail;
    //
    var getPts = options.pts, getID = options.id;
    var ds = this._data;
    var map = this._map;
    var trails = this.trails = [];
    
    trailOpt.flying.ctx = this.ctxFlying;
    var ctxBg = this.ctxBg;
    var d, pts, trail;
    for (var id in ds) {
      d = ds[id];
      pts = getPts(d);
      trail = new TrailCanvas(trailOpt);
      trail.addTo(map);
      trail.data(pts);
      trails.push({
        id: id,
        data: pts,
        trail: trail
      });
    }
    this.updateMap();
  },

  render: function () {
  },

  reset: function () {
    var using = this.using;
    for (var i = 0; i < using.length; i++){
      var trail = using[i];
      trail.stop && trail.stop();
      trail.pause && trail.pause();
    }
    this.using = [];
    this.unsing = this.trails;
  },

  restart: function () {
    var trails = this.trails;
    for (var i in trails) {
      var trail = trails[i];
      trail.trail.resetVariables();
    }
    this.life = this.options.lifeMin;
    this.resume();
  },

  /**
   * updateAnim 更新和动画（时间）变化有关的绘制
   */
  updateAnim: function (life) {
    if(!this.isable) return;
    var ctx = this.ctxFlying;
    ctx && ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    life = life || this.life;
    var trails = this.trails;
    for (var i = 0; i < trails.length; i++) {
      var trail = trails[i];
      trail = trail.trail;
      trail.updateAnim(life);
    }
  },

  /**
   * updateMap 更新和地图视窗变化有关的绘制
   */
  updateMap: function () {
    if(!this.isable) return;
    var ctxBg = this.ctxBg;
    ctxBg && ctxBg.clearRect(0, 0, ctxBg.canvas.width, ctxBg.canvas.height);
    var ctxFlying = this.ctxFlying;
    ctxFlying && ctxFlying.clearRect(0, 0, ctxFlying.canvas.width, ctxFlying.canvas.height);
    var viewBounds = this._map.getBounds();
    var trails = this.trails;
    for (var i = 0; i < trails.length; i++) {
      var trail = trails[i];
      trail = trail.trail;
      if (trail) trail.updateMap(viewBounds);
    }
  },

  clean: function () {
    var ctxBg = this.ctxBg;
    ctxBg && ctxBg.clearRect(0, 0, ctxBg.canvas.width, ctxBg.canvas.height);
    var ctxFlying = this.ctxFlying;
    ctxFlying && ctxFlying.clearRect(0, 0, ctxFlying.canvas.width, ctxFlying.canvas.height);
  },

  enable: function () {
    this.isable = true;
    this.resume();
    this.updateMap();
  },
  disable: function () {
    this.clean();
    this.pause();
    this.isable = false;
  },

  /**
   * initEventsMap 和地图有关的事件
   */
  initEventsMap: function () {
    var self = this;
    this._map
    .on('movestart', function () {
      self.clean();
      // self.pause();
    })
    .on('moveend', function () {
      // self.resume();
      self.updateMap();
    }.bind(this));
    // .on('zoomend', function () {
    //   self.updateMap();
    // });
  },
  /**
   * initSpriteFlying 新建飞线需要的sprite 即图片缓存 这部 建议放在trails_canvas 组件里执行，因为新建图片的成本比较高 应该公用
   */
  initSpriteFlying: function () {
    var trailOpt = this.options.trail;
    var colorFunc = getColorFunc(trailOpt.color);
    var canvas = document.createElement('canvas');
    var cw = this.spriteW = canvas.width = trailOpt.spriteW;
    var ch = this.spriteH = canvas.height = trailOpt.spriteH;
    var ctxFlying = canvas.getContext('2d');
    var ki, grd = ctxFlying.createLinearGradient(0, 0, cw, ch), N = 100;
    for (var i = 0; i < N; i++) {
      ki = i / N;
      grd.addColorStop(ki, colorFunc(ki));
    }
    ctxFlying.fillStyle = grd;
    ctxFlying.fillRect(0, 0, cw, ch);
    this.spriteFlying = canvas;
    trailOpt.flying.sprite = canvas;
  },

  /**
   * initSpriteFlyingHead 新建飞线头上需要的sprite 即图片缓存 这步建议放在trails_canvas 组件里执行，因为新建图片的成本比较高 应该公用
   */
  initSpriteFlyingHead: function () {
    var trailOpt = this.options.trail;
    var colorFunc = getColorFunc(trailOpt.color);
    var canvas = document.createElement('canvas');
    var d = canvas.width = canvas.height = 50;
    var r = d / 2;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = colorFunc(1);
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    this.spriteFlyingHead = canvas;
    trailOpt.flying.spriteHead = canvas;
    return canvas;
  },

  select: function (obj) {
    var trail, id, trails = this.trails;
    this.clean();
    for(var i = 0; i < trails.length; i++){
      trail = trails[i];
      id = trail.id;
      if(obj && id in obj){
        trail.trail.enable();
        trail.trail.updateBgLine();
      } else {
        trail.trail.disable();
      }
    }
  },

  unselect: function () {
    var trail, id, trails = this.trails;
    this.clean();
    for(var i = 0; i < trails.length; i++){
      trail = trails[i];
      trail.trail && trail.trail.enable('flying');
      trail.trail && trail.trail.disable('bgLine');
    }
  },

  /**
   * initSpriteBgLine 新建bgLine需要的sprite 即图片缓存 这部 建议放在trails_canvas 组件里执行，因为新建图片的成本比较高 应该公用
   */
  initSpriteBgLine: function () {
    var trailOpt = this.options.trail;
    if (!trailOpt.bgLine) return;
    var canvas = document.createElement('canvas');
    var cw = this.spriteW = canvas.width = trailOpt.spriteW;
    var ch = this.spriteH = canvas.height = trailOpt.spriteH;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = this.options.trail.bgLine.color;
    ctx.fillRect(0, 0, cw, ch);
    this.spriteBgLine = canvas;
    trailOpt.bgLine.sprite = canvas;
    return canvas;
  },

  /**
   * initEventsAnim 和动画有关的事件
   */
  initEventsAnim: function () {
    this
    .on('lifeEnd', function () {
      this.pause();
    })
    .on('update', function (life) {
      this.updateAnim(life);
    });
  },
  genOptions: function(){
    return TrailsCanvas.prototype.options = Utils.deepMerge(Anim.prototype.genOptions(), TrailsCanvas.prototype.options);
  },
});

var dmap = L.dmap = L.dmap || {};
dmap.TrailsCanvas = TrailsCanvas;
dmap.trailsCanvas = function (options) {
  return new TrailsCanvas(options);
};
TrailsCanvas.prototype.genOptions();

module.exports = TrailsCanvas;
