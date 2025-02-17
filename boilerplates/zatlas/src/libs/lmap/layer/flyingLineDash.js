var L = require('./../leaflet');
var FlyingLine = require('./flyingLine');
var FlyingLinePath = require('./flyingLinePath');
var Util = require('./../core/utils');
var dmap = L.dmap = L.dmap || {};
/**
 * @class FlyingLineDash
 */
function FlyingLineDash(options) {
  options = this.options = Util.deepMerge(FlyingLineDash.options, options);
  this.initialize(options);
}

FlyingLineDash.options = {
  'interactiveLine': {
    'weight': 5,
    'color': 'rgba(250,150,50,0.0)',
    'colorHover': 'rgba(250,150,50,0.2)'
  },
  'displayLine': {
    'dashSpeed': 30,
    'dashArray': '2,4,8,16',
    'color': 'rgba(250,150,50,1)',
    'weight': 3
  }
};

FlyingLineDash.options = Util.deepMerge(FlyingLine.options, FlyingLineDash.options);

FlyingLineDash = FlyingLine.extend(FlyingLineDash, {
  initialize: function(options) {
    var options = Util.deepMerge(FlyingLineDash.options, options);
    FlyingLine.prototype.initialize.call(this, options);
  },
  initDisplayLine: function() {
    var map = this._map;
    var options = this.options;
    var data = this._data;
    var displayLineOpt = options.displayLine;
    var displayPath = this.displayPath = new FlyingLinePath(this.opt);
    displayPath.addTo(map);
    displayPath.data(data);

    var path = displayPath._path;
    path.setAttribute('pointer-events', 'none');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', displayLineOpt.color);
    path.setAttribute('stroke-width', displayLineOpt.weight);
    path.setAttribute('stroke-dasharray', displayLineOpt.dashArray);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  },

  // updateInteractiveLine: function () {
  // },

  updateDisplayLine: function() {
    var life = this.life;
    var offset = Math.floor(life * this.options.displayLine.dashSpeed);
    this.displayPath._path.setAttribute('stroke-dashoffset', -offset);
  }
});

dmap.FlyingLineDash = FlyingLineDash;
dmap.flyingLineDash = function(opt) {
  return new dmap.FlyingLineDash(opt);
};

module.exports = FlyingLineDash;