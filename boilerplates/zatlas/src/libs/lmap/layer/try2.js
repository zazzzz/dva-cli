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
    column: {
      color: 'white',
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

  simplifyData: function () {
    var data = this.data = this._data;
    var map = this.map;
    var latlngsPoint = [];
    var simplifyScale = this.options.simplifyScale;
    for(var i=0; i<data.length; i++){
      var lon = data[i].lat;
      var lat = data[i].lng;
      var alatlngs = new L.LatLng(lat, lon);
      latlngsPoint.push(alatlngs);
    }
    
    var simplePoint = simplify(latlngsPoint, simplifyScale);
    this.processData(simplePoint);
  },

  processData: function (simplePoint) {
  var newDataCollader = this.newDataCollader = [];
  var collSpace = this.options.collSpace;

  for (var i=0; i<simplePoint.length; i++) {
    if(simplePoint[i+1] === undefined){
    var latlng1 = L.latLng(simplePoint[i].lat, simplePoint[i].lng);
    var latlng2 = L.latLng(simplePoint[i].lat, simplePoint[i].lng);  
      } else{
    var latlng1 = L.latLng(simplePoint[i].lat, simplePoint[i].lng);
    var latlng2 = L.latLng(simplePoint[i+1].lat, simplePoint[i+1].lng);
      }
    var dist = latlng1.distanceTo(latlng2);
    var collNum = Math.round(dist/collSpace) || 1;
    var speedo = simplePoint[i];

  var randomSpeed = Math.floor(((Math.random()+1)/2)*100);
  // console.log(simplePoint.length, collNum)
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
  this.switchView();
  }, 

  switchView: function () {
    this.goView3D();
  },

  goView2D: function () {
    // var latlngs = this.latlngs;
    var map = this.map;
    var newDataCollader = this.newDataCollader; 
    var testPath = $('.leaflet-zoom-animated').children();
    // var drawLine = new DrawLine(latlngs, map, newDataCollader);
    // drawLine.Linerender2D();
    $('#maprotor.titled').css('-webkit-transform', 'rotateX(0deg)');
    $('#view-3d').css('visibility', 'hidden'); 
    var self = this;
    $('#view-3d').on( "click", function() {
      self.goView2dOpts();
   $(".leaflet-marker-pane").find(".line3d").remove();
  });
  },

  goView3D: function() {
    var map = this.map;
    var newDataCollader = this.newDataCollader;
    var self = this;
    // $('#view-2d').on( "click", function() {
      self.goView3dOpts();
      $(".leaflet-marker-pane").find(".line3d").remove();

    for(var i=0; i<newDataCollader.length; i++){
      this.render3D(newDataCollader[i]);
    }
    // });
  },

  goView2dOpts: function(){
    $('#view-3d').css('visibility', 'hidden');
    $('#view-2d').css('visibility', 'visible');
    $('.leaflet-overlay-pane svg').css('visibility', 'visible');
    $('.leaflet-marker-pane').css('visibility', 'hidden');
    map.dragging.enable();

    var linedrawers = $('.linedrawer');
    for(var k  =0; k<linedrawers.length; k++){
      var linedrawer = $(linedrawers[k]);
      var ytrans = linedrawer.attr('ytrans');
      linedrawer.css({'transform': 'rotateY('+0+'deg)' + ' ' + ytrans });
      }
  },

  goView3dOpts: function(){
    $('.leaflet-overlay-pane svg').css('visibility', 'hidden');
    $('.leaflet-marker-pane').css('visibility', 'visible');
  },

  render3D: function (singleData) {
    var columns = this.columns;
    var self = this;
    var singleData = this.singleData = singleData;

    // if(!this.columns){
    var column = this.columns = $('\
        <div class="line3d">\
        <div class="linedrawer"></div>\
        <div class="popuper"></div>\
        <div class="circlebottom"></div>\
        <div class="circletop"></div>\
        </div>');
    $('.leaflet-marker-pane').append(column);
    //not sure
    this.line3dNode = column.find('.line3d');
    this.linedrawerNode = column.find('.linedrawer');
    this.popuperNode = column.find('.popuper');
    // this.line3dNode = xx.find('.line3d');
    // }
    this.updateValue();
    this.render();
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
    var d = this.singleData;
    // console.log(d, this.newDataCollader)
    var map = this._map;
    var latlng = L.latLng(d.lat, d.lng);
    // var latlng = L.latLng(d[i].lng, d[i].lat);
    this.heightTrans = 40;
    var divLocat;
    if(e){
      divLocat = map._latLngToNewLayerPoint(latlng, e.zoom, e.center).round();
    }else{
      divLocat = map.latLngToLayerPoint(latlng);
    }
      var divLocatX = divLocat.x;
      var divLocatY = divLocat.y;
      var transform = 'translate3d('+divLocatX+'px'+','+divLocatY+'px'+','+'0'+')' ;
      var origin = divLocatX + 'px ' + divLocatY + 'px';

      // this.linedrawerNode.css({'height' : d.speed });   //different height

      // var drawerLind = $(this.columns).find('.linedrawer');
      // $(this.columns[0].children[0]).css({'height' : this.heightTrans })
        // console.log(this.columns[0].children[0])

      var line = this.columns;
      line.css({
        'transform': 'rotateX(' + 90 + 'deg)'+ transform,
        '-webkitTransform': 'rotateX(' + 90 + 'deg)' +transform,
        '-webkitTransformOrigin': origin,
        'transformOrigin': origin
      });
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
      $('.linedrawer').css({'transform': 'rotateY('+ rotation + 'deg)'});
      $('.linedrawer').css({'transform': 'rotateY('+ rotation + 'deg)'});
    })
  },

  updateValue: function () {     // 目前用scale不能linear gradient。
  var columns = this.columns;
  var newDataCollader = this.newDataCollader ;

  if(this.index<newDataCollader.length){
    var speedo = newDataCollader[this.index].speed;
    speedo = speedo;
    var column = columns.find('.linedrawer');
    this.linedrawerNode.css({'height' : 2 });
    // this.linedrawerNode.css({'ytrans' : 'scaleY(' + speedo + ')' });
    column.css({'transform' : 'scaleY(' + speedo + ')'});
    var popCss = columns.find('.popuper');
        var span = $('<div class="text-rotator">\
      <span class="span-text1">'+ '时速: ' + Math.floor(speedo/6-4)+ 'mph' +'</span></div>');
    popCss.append(span);
    span.css({'transform': 'translate3d(' + -50 + 'px' + ',' + (speedo*2+5) + 'px' + ',' + 0 + 'px' + ')' + ' '+ 'rotateX(' + 190 + 'deg)'});
  }

  this.index++;
  setTimeout(this.updateValue.bind(this),100);
  }

});


dmap.TransLine = TransLine;
dmap.transLine = function (options) {
  return new dmap.TransLine(options);
};
  module.exports = TransLine;


