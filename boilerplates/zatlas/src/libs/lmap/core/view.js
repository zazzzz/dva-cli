var eventEmitter = require('./../core/event');
var Utils = require('./utils');
/**
 * ## 这里是markdown介绍
 * 这里是markdown介绍
 * @class View
 */
function View(opt) {
}
View = eventEmitter.extend(View, {
  _data: null,
  isAutoUpdate: true,
  isInit: false,
  /**
   * initialize 初始化dom元素等
   */
  initialize: function (opt) {
    Util.deepMerge(this, opt);
    this.initVariables();
  },

  /**
   * render 加入数据并绘制
   */
  render: function (data) {
    if(data) this.data(data);
    if(!this._data) return console.log('无数据');
    this.updateData(data);
    this.emit('renderDone')
    // this.renderDoneCallback()
  },

  addEvents: function(){
  },

  /**
   * data 传入数据
   */
  data: function () {
    if(!arguments.length) return this._data; // function (data)
    this.data[key] = data;
    if(data===null || data ===undefined || isNaN(data)) return;
    this._data = data;
  },

  valid: function(){

  },

  // /**
  //  * _addEvent 增加hook
  //  * @param {String} eventName     事件名
  //  * @param {Function} eventCallback hook函数
  //  */
  // _addEvent: function (eventName, eventCallback){
  //   this.on(eventName, eventCallback)
  //   // do add event
  // },

  // /**
  //  * addHooks 增加 hook 兼容两种方式
  //  */
  // addEvent: function () {
  //   var self = this;
  //   if (arguments.length === 2) { // eventName, eventCallback
  //     self._addEvent(eventName, eventCallback) 
  //     return;
  //   }

  //   var events = arguments[0]  // events object: {eventName1: callback1, eventName2: callback2}
  //   if (typeof events === 'object') { 
  //     for (var eventName in events) {
  //       self._addEvent(eventName, events[eventName])
  //     }
  //   }
  // },

  /**
   * update 在这里综合和数据更新有关 所有的更新 如:this.updateValues(); this.updateAxis();
   */
  update: function (data) {
    for (var key in data) {
      var funcName = key[0].toUpperCase() + key.slice(1);
      this[funcName] && this[funcName](data[key]);
    }
    this.emit('update');
  },

  wake: function(){

  },

  /**
   * updateData 数据的处理和更新
   */
  updateData: function (){
  },

  /**
   * hide 隐藏 将资源释放至公共池
   */
  hide: function (cb) {
    this.emit('hide');
    //完全hide之后 需要触发 hide事件
  },

  /**
   * destory 销毁组件
   */
  destory: function () {
    this.removeAllListeners();
    this.emit('destory');
  },
});

module.exports = View;