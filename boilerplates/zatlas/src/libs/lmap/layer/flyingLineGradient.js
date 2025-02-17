var L = require('./../leaflet');
var Util = require('./../core/utils');
var FlyingLine = require('./flyingLine');
var FlyingLinePath = require('./flyingLinePath');

/**
 * @class FlyingLineGradient
 */

function FlyingLineGradient(options) {
  options = this.options = Util.deepMerge(FlyingLineGradient.options, options);
  options.interactiveLine.kHeight = options.kHeight;
  options.displayLine.kHeight = options.kHeight;
  this.initialize(options);
}

FlyingLineGradient.options = {
  opacity: 1,
  displayLine: {
    colorTo: 'rgba(250,150,50,1)',
    colorFrom: 'rgba(255,0,0,0)',
    colorNormal: 'rgba(250,250,250,0.2)'
  }
};

FlyingLineGradient.options = Util.deepMerge(FlyingLine.options, FlyingLineGradient.options);

FlyingLineGradient = FlyingLine.extend(FlyingLineGradient, {
  initDisplayLine: function () {
    var map = this._map;
    var data = this._data;
    var displayPath = this.displayPath = new FlyingLinePath(this.options.displayLine);
    displayPath.addTo(map);
    var id = displayPath.id;
    var path = displayPath._path;

    var options = this.options;
    var linearGradientId = displayPath.linearGradientId;
    this.linearGradient = displayPath.linearGradient;
    var displayLine = options.displayLine;

    this
    .createStop('a', {
      'offset': '0%',
      'stop-color': displayLine.colorNormal
    }).createStop('b', {
      'offset': '0%',
      'stop-color': displayLine.colorNormal
    }).createStop('c', {
      'offset': '0%',
      'stop-color': displayLine.colorFrom
    }).createStop('d', {
      'offset': '0%',
      'stop-color': displayLine.colorTo
    }).createStop('e', {
      'offset': '0%',
      'stop-color': displayLine.colorNormal
    }).createStop('f', {
      'offset': '100%',
      'stop-color': displayLine.colorNormal
    });

    path.setAttribute('pointer-events', 'none');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#' + linearGradientId + ')');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  },
  updateOptionsDisplayLine: function () {
    var options = this.options.displayLine;
    if (this.stop1a) this.stop1a.setAttribute('stop-color', options.colorNormal);
    if (this.stop1b) this.stop1b.setAttribute('stop-color', options.colorNormal);
    if (this.stop1c) this.stop1c.setAttribute('stop-color', options.colorFrom);
    if (this.stop1d) this.stop1d.setAttribute('stop-color', options.colorTo);
    if (this.stop1e) this.stop1e.setAttribute('stop-color', options.colorNormal);
    if (this.stop1f) this.stop1f.setAttribute('stop-color', options.colorNormal);
  },

  createStop: function (key, options) {
    var stop1ID = this.id + 'stop1';
    var id = this['stop1' + key + 'ID'] = stop1ID + key;
    var name = 'stop1' + key;
    var linearGradient = this.linearGradient;
    var stop =  this[name] = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('id', id);
    for (var k in options) {
      stop.setAttribute(k, options[k]);
    }
    linearGradient.appendChild(stop);
    return this;
  },

  updateDisplayLine: function (life) {
    if (!life) return;
    var options = this.options;
    var range = options.range;
    var percentFrom, percentTo;
    if (range > life) {
      percentFrom = 0;
      percentTo = life;
    } else if (life < 1) {
      percentFrom = life - range;
      percentTo = life;
    } else if (life > 1 && life < 1 + range) {
      percentFrom = life - range;
      percentTo = 1;
    }

    if (!percentTo) return;

    percentFrom = Math.floor(percentFrom * 100) + '%';
    percentTo = Math.floor(percentTo * 100) + '%';


    if (this.stop1b) this.stop1b.setAttribute('offset', percentFrom);
    if (this.stop1c) this.stop1c.setAttribute('offset', percentFrom);
    if (this.stop1d) this.stop1d.setAttribute('offset', percentTo);
    if (this.stop1e) this.stop1e.setAttribute('offset', percentTo);
  },
  genOptions: function () {
    return FlyingLineGradient.prototype.options = Util.deepMerge(FlyingLine.prototype.genOptions(), FlyingLineGradient.prototype.options);
  },
}, FlyingLine);

FlyingLineGradient.prototype.genOptions();

var dmap = L.dmap = L.dmap || {};
dmap.FlyingLineGradient = FlyingLineGradient;
dmap.flyingLineGradient = function (opt) {
  return new FlyingLineGradient(opt);
};

module.exports = FlyingLineGradient;
