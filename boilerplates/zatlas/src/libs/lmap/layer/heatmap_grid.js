'use strict';

/**
 * @class HeatmapGrid
 */
var L = require('./../leaflet');
var Utils = require('@ali/map-utils');
var Grid = Utils.Grid;
var getColorFunc = Utils.getColorFunc;

/**
 * HeatmapGrid 生成网格型点图
 * @param  {Object} d [description]
 * @return {[type]}   [description]
 */
var HeatmapGrid = L.Class.extend({
  'lines':[
    {
      id: 'format',
    }, {
      id: 'bind'
    }, {
      id: 'events'
    },
  ],
  'nodes':{
    data: {
      schema: {
        'shapeHash': {
          type: 'string',
          desc: '类似geohash 对形态的编码'
        },
         // 'value': Utils.getSchema('value'),
      }
    },
    shape: {
      pts: ['lat', 'lng']
    }
  },
  emits: {
    'grid-resize': {
      desc: '格子大小发生变化'
    },
    'grid-mouseover': {
      desc: '鼠标移至格子范围'
    },
    'grid-dblclick': {
      desc: '双击格子'
    },
    'grid-mouseout': {
      desc: '鼠标移出格子范围'
    },
    'grid-click': {
      desc: '点击某个格子'
    },
  },
  options: {
    clusterStepByZoom: 1,
    isAutoUpdate: true,
    isNeedAggregate: true,
    grid: {
      mouseover: {
        'fillOpacity': 0.8,
        'color': 'rgba(255,255,255,0.9)'
      },
      mouseout: {
        'fillOpacity': 1,
        'color': 'rgba(255,255,255,0.0)'
      },
      click: {},
      weight: 1,
      color: 'rgba(255,255,255,0)',
      fillOpacity: 1,
      rx: 30,
      ry: 25
    },
    getColor: getColorFunc('rgba(62,18,0,0.8)', 'rgba(255,208,122,0.8)', 'hsl', 'linear.Out.1.4'),
    lng: Utils.getLng,
    lat: Utils.getLat,
    scale: function (d) {
      return 1;
    },
    value: function (d, max, min) {
      return Math.min(1, d.length / max);
    }
  },
  gridMap: {},
  aggregatedData: {}, //经过合并的数据
  includes: [L.Mixin.Events],
  initialize: function (options) {
    options = Utils.deepMerge(this.options, options);
    this.getMax = options.getMax;
    this.getColor = Utils.getColorFunc(options.getColor);
    this.getScale = Utils.getColorFunc(options.scale);
  },

  addTo: function (map) {
    if (this._map || !map) return;
    this._map = map;
    var grid = this.options.grid;
    this.gridEncoder = new Grid()
    .transform(function (rx, ry) {
      var size = map.getSize();
      var cx = size.x / 2, cy = size.y / 2;
      var sx = cx - rx, sy = cy + ry;
      var tx = cx + rx, ty = cy - ry;
      var slatlng = map.containerPointToLatLng(L.point(sx, sy));
      var tlatlng = map.containerPointToLatLng(L.point(tx, ty));
      return {
        dlat: tlatlng.lat - slatlng.lat,
        dlng: tlatlng.lng - slatlng.lng
      };
    })
    .shape('rect')
    .rx(grid.rx)
    .ry(grid.ry)
    .update();
    //
    this.initEventsMap();
    if (this._data) this.updateZoom();
  },



  /**
   * data 灌入数据
   * @param  {Object} data 带有经纬度的原始数据
   */
  data: function (data) {
    if (!data) return this._data;
    this._data = data;
    var options = this.options;
    if (options.isAutoUpdate && this._map) this.updateZoom();
    this.updateColor();
    // this.updateScale(function (d) {return Math.pow(d, 0.4);});
  },

  /**
   * initEventsMap 和地图有关的事件
   */
  initEventsMap: function () {
    var self = this;
    this._map
    .on('moveend', function () {
      this.render();
    }.bind(this))
    .on('zoomend', function () {
      self.updateZoom();
    });
  },

  /**
   * updateZoom 当缩放等级发生变化时 进行更新
   */
  updateZoom: function () {
    var options = this.options;
    var clusterStepByZoom = options.clusterStepByZoom;
    var map = this._map;
    if (!options.isNeedAggregate) {
      // TODO 从服务端取数据
    } else {
      var zoom = map.getZoom();
      var zoomLevel = Math.floor(zoom / clusterStepByZoom);
      if (zoomLevel === this.zoomLevel) return;
      this.gridEncoder.update();
      this.zoomLevel = zoomLevel;
      this.clean();
      this.aggregate();
      // this.render();
      this.fire('grid-resize');
      this._updateTransformOrigin();
    }
  },

  /**
   * aggregate 对原始数据进行geohash合并
   */
  aggregate: function () {
    var gridEncoder = this.gridEncoder;
    var obj, options = this.options,
      aggregatedData = this.aggregatedData;
    var key, center, ds = this._data,
      d, lat, lng, getLat = options.lat,
      getLng = options.lng;
    for (var k in ds) {
      d = ds[k];
      key = gridEncoder.encode(getLat(d), getLng(d));
      obj = aggregatedData[key];
      if (obj) {
        obj.push(d);
      } else {
        aggregatedData[key] = [d];
      }
    }
  },

  getBounds: function () {
    var bounds = this._map.getBounds();
    var min = bounds._southWest, max = bounds._northEast;
    var offsetlat = 0.5 * (max.lat - min.lat),  offsetlng = 0.5 * (max.lng - min.lng);
    return {
      latMin: min.lat - offsetlat,
      latMax: max.lat + offsetlat,
      lngMin: min.lng - offsetlng,
      lngMax: max.lng + offsetlng
    };
  },

  /**
   * clean 清理不用的格子
   */
  clean: function () {
    var gridMap = this.gridMap, map = this._map;
    for (var k in gridMap) {
      var grid = gridMap[k];
      map.removeLayer(grid);
      delete gridMap[k];
    }
    this.aggregatedData = {};
  },

  remove: function(){
    this.clean();
  },

  link: function(){
  },

  /**
   * updateColor 更新色彩
   * @param  {} a 可以为对象 或colorFrom
   * @param  {[type]} b colorTo
   * @param  {String} c blendingType rgb或hsl 在哪个空间下插值
   * @param  {[type]} d easing函数或关键字符
   */
  updateColor: function (a, b, c, d) {
    if (!a) return;
    var getColor = this.getColor = Utils.getColorFunc(a, b, c, d);
    var gridMap = this.gridMap, grid, value;
    for(var key in gridMap) {
      grid = gridMap[key];
      value = grid._value;
      grid.setStyle({
        fillColor: getColor(value)
      });
    }
  },

  /**
   * updateScale 更新大小和图形的关系
   * @param  {[type]} scaleFunc [description]
   * @return {[type]}           [description]
   */
  updateScale: function (getScale) {
    if(!getScale) return;
    this.scaleGridFunc = function(grid, ki){
      if(!grid) return;
      var node = grid._container;
      this._updateTranformOriginGird(node);
      var scale = getScale(ki);
      var transform = 'scale3d(' + scale + ',' + scale + ',1)';
      node.style['transform'] = transform;
      node.style['-webkit-transform'] = transform;
      this.getScale = getScale;
   };
  },

  _updateTranformOriginGird: function(node){
    if(!node) return;
    var bbox = node.getBBox();
    var origin = (bbox.width / 2 + bbox.x) + 'px ' + (bbox.height / 2 + bbox.y) + 'px 0px';
    node.style['transform-origin'] = origin;
    node.style['-webkit-transform-origin'] = origin;
  },

  /**
   * _updateTransformOrigin 每次缩放之后 每个格子的transform-origin会变 需要更新
   */
  _updateTransformOrigin: function() {
    if (!this.scaleGridFunc) return;
    var gridMap = this.gridMap,
      grid, self = this;
    setTimeout(function() {
      for (var k in gridMap) {
        self._updateTranformOriginGird(gridMap[k]._container);
      }
    });
  },

  /**
   * render 绘制阶段
   * @param  {Object} data 数据 数组
   */
  render: function (data) {
    if (data) this.data(data);
    this.draw ();
  },

  draw: function () {
    var options = this.options;
    var gridEncoder = this.gridEncoder;
    var gridStyle = options.grid;
    var getColor = this.getColor;
    var getValue = options.value;
    var ds = this.aggregatedData, gridMap = this.gridMap;
    var map = this._map, bounds = this.getBounds(), grid;
    var latMax = bounds.latMax, latMin = bounds.latMin, lngMax = bounds.lngMax, lngMin = bounds.lngMin;
    var nMax = 40;
    for (var k in ds) {
      var d = ds[k];
      var decode = gridEncoder.decode(k);
      var center = decode.center;
      var pts = decode.pts;
      var clat = center[0], clng = center[1];
      if ((clat < latMin) || (clng < lngMin) || (clat > latMax) || (clng > lngMax)) continue;
      var ki = getValue(d, nMax, 0);
      if (!gridMap[k]) {
        gridStyle.fillColor = getColor(ki);
        grid = gridMap[k] = L.polygon(pts, gridStyle).addTo(map);
        grid._value = ki;
        grid._gridid = k;
        this.initEventsGrid(grid);//为每个格子添加事件
        if (!this.scaleGridFunc) continue;
        this.scaleGridFunc(grid, ki);
      }
    }
  },

  /**
   * initEventsGrid 为grid添加事件 如hover click等
   * @param  {Object} grid grid图形对象
   */
  initEventsGrid: function (grid) {
    var self = this, datas = this.aggregatedData;
    var gridOptions = this.options.grid, click = gridOptions.click || {}, mouseover = gridOptions.mouseover || {}, mouseout = gridOptions.mouseout || {};
    var gridid = grid._gridid;
    var info = {
        gridid: gridid,
        data: datas[gridid]
      };
    grid
    .on('mouseover', function (e) {
      mouseover && grid.setStyle(mouseover);
      self.fire('grid-mouseover', info);
      grid.bringToFront();
    })
    .on('mouseout', function (e) {
      mouseout && grid.setStyle(mouseout);
      self.fire('grid-mouseout', info);
    })
    .on('mousedown', function (e) {
      click && grid.setStyle(click);
      self.fire('grid-click', info);
    })
    .on('dblclick', function (e) {
      self.fire('grid-dblclick', info);
    });
  }
});

var dmap = L.dmap = L.dmap || {};
dmap.HeatmapGrid = HeatmapGrid;
dmap.heatmapGrid = function (options) {
  return HeatmapGrid(options);
};

module.exports = HeatmapGrid;
