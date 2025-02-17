var L = require('./../leaflet');
var $ = require('jquery');
var dmap = L.dmap = L.dmap || {};
var Utils = require('./../core/utils');
var simplify = require('./../demo/lib/simplify')
// var requestAnimationFrame = Utils.requestAnimationFrame.bind(Utils);

var TransLine = L.Class.extend({
  isRotateZ: false,
  options:{
    simplifyScale: 0,
    collSpace: 80,
    lifeSpeed: 100,
    dataType: 'simplifyData',
    column: {
      color: 'rgba(253, 239, 239, 0.901961)',
      width: 10,
      height: 30,
      deg: 50,
      opacity: 0.6,
    },
  },

  initialize: function (options) {
    this.options = Utils.deepMerge(this.options, options);
    this.columnOpts = this.options.column;
    this.popuperOpts = this.options.popuper;
  },

  addTo: function (map) {
    if(!map) return;
    this._map = map;
  },

  data: function (data) { //灌入数据
    this._data = data;
    this.columnOpts = this.options.column;
    this.index = 0;
  },

  processing: function () {
    return this[this.options.dataType]();
  },

  simplifyData: function () {
    var data  = this._data;
    var latlngsPoint = [];
    var simplifyScale = this.options.simplifyScale;
    for(var i=0; i<data.length; i++){
      var lon = data[i].lng;
      var lat = data[i].lat;
      var alatlngs = new L.LatLng(lat, lon);
      latlngsPoint.push(alatlngs);
    }
    var simplePoint = simplify(latlngsPoint, simplifyScale);
    this.processData(simplePoint);
  },

  originalData: function () {
    var data  = this._data;
    var newDataCollader = this.newDataCollader = [];
    for (var i=0; i<data.length-1; i++) {
      var lon = data[i].lng;
      var lat = data[i].lat;
      var lon2 = data[i+1].lng;
      var lat2 = data[i+1].lat;

      var latLng = new L.latLng(lat, lon);
      var latLng2 = new L.latLng(lat2, lon2);   
      var dist = latLng.distanceTo(latLng2);

      if(data[i].time){
      var time = new Date(data[i].time);
      var time2 = new Date(data[i+1].time);
      }else{
      var time = i;
      var time2 = i+1;
      }
      var timeinDist = (time2-time)/(1000*3600);
      var miles = dist/1000;
      var speed = miles/timeinDist;
      latLng['speed'] = speed;
      newDataCollader.push(latLng)
    }
    this.goView3D();
  },

  processData: function (simplePoint) {
    var newDataCollader = this.newDataCollader = [];
    var collSpace = this.options.collSpace;
    for (var i=0; i<simplePoint.length; i++) {
      if(simplePoint[i+1] === undefined){
        // var pt = simplePoint[i];
      var latlng1 = L.latLng(simplePoint[i].lng, simplePoint[i].lat);
      var latlng2 = L.latLng(simplePoint[i].lng, simplePoint[i].lat);  
        } else{
      var latlng1 = L.latLng(simplePoint[i].lng, simplePoint[i].lat);
      var latlng2 = L.latLng(simplePoint[i+1].lng, simplePoint[i+1].lat);
        }
      var dist = latlng1.distanceTo(latlng2);
      var collNum = Math.round(dist/collSpace) || 1;
      var speedo = simplePoint[i];

    var randomSpeed = Math.floor(((Math.random()+1)/2)*100);
    for(var k=0; k<=collNum-1; k++){
      if(simplePoint[i+1] === undefined){
        var fisrtpointX = simplePoint[i].lat+(simplePoint[i].lat-simplePoint[i].lat)*(k/collNum);
        var fisrtpointY = simplePoint[i].lng+(simplePoint[i].lng-simplePoint[i].lng)*(k/collNum);
      }else{
        var fisrtpointX = simplePoint[i].lat+(simplePoint[i+1].lat-simplePoint[i].lat)*(k/collNum);
        var fisrtpointY = simplePoint[i].lng+(simplePoint[i+1].lng-simplePoint[i].lng)*(k/collNum);
      }
    var allLatlng = new L.LatLng(fisrtpointX, fisrtpointY);
    allLatlng['speed'] = randomSpeed;
    newDataCollader.push(allLatlng)
    }
    }

    //初始化的样式
    this.goView3D();
  }, 

  goView3D: function() {
    var map = this.map;
    var newDataCollader = this.newDataCollader;
    var self = this;
      self.goView3dOpts();
      $(".leaflet-marker-pane").find(".line3d").remove();
      this.render3D();
  },


  goView3dOpts: function(){
    $('.leaflet-overlay-pane svg').css('visibility', 'hidden');
    $('.leaflet-marker-pane').css('visibility', 'visible');
  },

  render3D: function () {
    var columns = this.columns = undefined;
    var self = this;
    var newDataCollader = this.newDataCollader;
    if(!this.columns){
    columns = this.columns = [];
    for(var i=0; i<newDataCollader.length; i++){
    var column = columns[i] = $('\
        <div class="line3d">\
        <div class="linedrawer"></div>\
        <div class="popuper"></div>\
        <div class="circlebottom"></div>\
        <div class="circletop"></div>\
        </div>');
    // this.xx = map.getPanes('').xxx
    $('.leaflet-marker-pane').append(column);
    //not sure
    this.line3dNode = column.find('.line3d');
    this.linedrawerNode = column.find('.linedrawer');
    this.popuperNode = column.find('.popuper');
    // this.line3dNode = xx.find('.line3d');
    }
    $('.line3d').on('mouseover', function(e){
      var linemarkerDiv = e.currentTarget.children[1].style;
      linemarkerDiv.visibility = 'visible';
  });
    $('.line3d').on('mouseout', function(e){
      var linemarkerDiv = e.currentTarget.children[1].style;
      linemarkerDiv.visibility = 'hidden';
  });

    this.updateValue();
    this.render();
    }
  },

  render: function () {
    var columnOpts = this.columnOpts;
    var width = columnOpts.width;
    var color =columnOpts.color;
    var height = 2;
    $('.linedrawer').css({
      'background-color': color,
      // 'width': width+'px',
      // 'height': height+'px',
      'opacity': this.columnOpts.opacity
    });

    this.updatePos();
    this.rotate();
  },

  updatePos: function (e) {
    var d = this.newDataCollader;
    var map = this._map;
    for(var i=0; i<d.length; i++){
    this.heightTrans = 40;
    var divLocat;
    if(e){
      divLocat = map._latLngToNewLayerPoint(d[i], e.zoom, e.center).round();
    }else{
      divLocat = map.latLngToLayerPoint(d[i]);
    }
      var divLocatX = divLocat.x;
      var divLocatY = divLocat.y;
      var transform = 'translate3d('+divLocatX+'px'+','+divLocatY+'px'+','+'0'+')' ;
      var origin = divLocatX + 'px ' + divLocatY + 'px';

     $('.linedrawer').css({'height' : 2 });   //different height

      var line = this.columns;
      line[i].css({
        'transform': 'rotateX(' + 90 + 'deg)'+ transform,
        '-webkitTransform': 'rotateX(' + 90 + 'deg)' +transform,
        '-webkitTransformOrigin': origin,
        'transformOrigin': origin
      });
    }
  },

  initEventsMap: function () {
    var update = this.updatePos.bind(this);
    this._map
    .on('zoomanim', update);
    requestAnimationFrame(function(){
      update();
    });
  },

  rotate: function () {
    this.angle=0;
    this.xdrag=0;
    var self = this;
    var isDown=false;
    var xpos=0;
    var node = $(this._map._container);
    this._map.on('rotate', function(e, d){
      var rotation =  - e.rotation;
      var linedrawers = $('.linedrawer');
        var popupers = $('.popuper');
      for(var k  =0; k<linedrawers.length; k++){
        var linedrawer = $(linedrawers[k]);
        var ytrans = linedrawer.attr('ytrans');
        linedrawer.css({'transform': 'rotateY('+ rotation + 'deg)' + ' ' + ytrans });
        var popuper = $(popupers[k]);
        popuper.css('transform', 'rotateY(' + rotation +'deg)');
      }
    })
  },

  // setTransform('rotate', xxx){
  //   transform : rotate scale translate3d
  //   this.rotate = xx
  //   this.tran
  //   this.tranformStr = ''
  // }

  updateValue: function () {     // 目前用scale不能linear gradient。
    var columns = this.columns;
    var newDataCollader = this.newDataCollader ;
    if(columns&&this.index<columns.length){
      var speedo = newDataCollader[this.index].speed;
      var column = columns[this.index].find('.linedrawer');
      if(speedo > 170){
      var tmpSpeedo = 150
      column.css({'transform' : 'scaleY(' + tmpSpeedo + ')'});
      column.attr('ytrans',  'scaleY(' + tmpSpeedo + ')');
    }else{
      column.css({'transform' : 'scaleY(' + speedo + ')'});
      column.attr('ytrans',  'scaleY(' + speedo + ')');
    }
      var popCss = columns[this.index].find('.popuper');
      if(speedo>170){
      var span = $('<div class="text-rotator">\
        <span class="span-text1">'+ '时速: ' +'超速' +'</span></div>');
    }else{
      var span = $('<div class="text-rotator">\
        <span class="span-text1">'+ '时速: ' + Math.floor(speedo)+ 'mph' +'</span></div>');
    }
      popCss.append(span);
      if(speedo > 170){
      var tmpSpeedo = 150
        span.css({'transform': 'translate3d(' + -60 + 'px' + ',' + (tmpSpeedo*2+5) + 'px' + ',' + 0 + 'px' + ')' + ' '+ 'rotateX(' + 190 + 'deg)'});
      }else{
        span.css({'transform': 'translate3d(' + -60 + 'px' + ',' + (speedo*2+5) + 'px' + ',' + 0 + 'px' + ')' + ' '+ 'rotateX(' + 190 + 'deg)'});
      }
    }
    this.index++;
    setTimeout(this.updateValue.bind(this),this.options.lifeSpeed);
    }
  });


dmap.TransLine = TransLine;
dmap.transLine = function (options) {
  return new dmap.TransLine(options);
};
  module.exports = TransLine;


