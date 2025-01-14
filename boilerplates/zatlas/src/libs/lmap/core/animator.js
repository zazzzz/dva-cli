var eventEmitter = require('./../core/event');
var Utils = require('./utils');
var requestAnimationFrame = Utils.requestAnimationFrame;
var cancelAnimationFrame = Utils.cancelAnimationFrame;
/**
 * ## 这里是markdown介绍
 * @class Animator
 */
function Animator(options) {
  options = this.options = Utils.deepMerge(Animator.options, options);
  this.initialize(options);
}
Animator.options = {
    isLoop: false,
    isAutoStart: true,
    isAutoDestroy: true,
    tween:  null,
    delayStart:  0,
    delayEnd:  0,
    lifeSpeed: 0.01,
    lifeMin:  0,
    lifeMax:  1
  };

Animator = eventEmitter.extend(Animator, {
  life: null,
  initialize: function (options){
    this._initEventsAnim();
    this.resetVariables();
    if (this.options.isAutoStart) this.startAnim();
  },
  genOptions: function(){
    return Animator.prototype.options;
  },

  _initEventsAnim: function () {
    if(this.options.isAutoDestroy) this.on('end', this.destoryAnim.bind(this));
  },

  initEventsAnim: function () {
  },

  /**
   * resetVariables 根据条件计算必要的时间参数
   */
  resetVariables: function () {
    this.life = this.life || this.options.lifeMin;
    this.lifeLength = this.options.lifeMax - this.options.lifeMin;
  },
  /**
   * start 开始
   */
  startAnim: function () {
    var delayStart = this.options.delayStart;
    if (!delayStart) return this.restart();
    setTimeout(this.restart.bind(this), delayStart);
  },

  /**
   * loop 开始自动更新
   */
  loop: function () {
    if(!this.isLooping) return;
    this._updateLife();
    this.loopid = requestAnimationFrame(this.loop.bind(this));
  },

  /**
   * _updateLife 随着帧更新动画更新
   */
  _updateLife: function () {
    this.life += this.options.lifeSpeed;
    var life = (this.tween) ? this.getTweenValue() : this.life;
    this.emit('update', life);
    this.updateLife(life);
    this.checkIfEnd();
  },

  /**
   * checkIfEnd 检查是否结束
   */
  checkIfEnd: function(){
    if (this.life >= this.options.lifeMax) this._onLifeEnd();
  },

  /**
   * updateLife 外部的循环方法
   */
  updateLife: function () {
    // throw '请重载 uploadLife 方法，每次循环调用一次';
  },

  /**
   * _onLifeEnd 动画时间结束
   */
  _onLifeEnd: function () {
    var delayEnd = this.options.delayEnd;
    if (!delayEnd) {
      this._onEnd();
    } else {
      setTimeout(this._onEnd.bind(this), delayEnd);
    }
    this.emit('lifeEnd');
  },

  /**
   * toLife 跳到某阶段
   * @param  {Number} value 数值
   * @param  {String} type 类型
   */
  'to': function (value, type) {
    type = type || 'life';
    if (type === 'life'){
      this.toLife(value);
    }
  },

  /**
   * toLife 跳到某life阶段
   * @param   life life数值
   */
  'toLife': function (life) {
    if (life === undefined || life === null) return;
    this.life = life;
  },

  /**
   * _onEnd 整段时间结束
   */
  _onEnd: function () {
    if(this.isLoop) return this.restart();
    this.end();
    this.emit('end');
  },

  /**
   * _onEnd 整段时间结束具体执行
   */
  end: function () {
  },

  /**
   * getTweenValue 如果有tween函数 将life归一化，求其对应tween函数的值
   */
  getTweenValue: function () {
    return this.tween((this.life - this.options.lifeMin) / this.lifeLength);
  },

  /**
   * pause 动画暂停
   */
  pause: function () {
    this.isLooping = false;
    cancelAnimationFrame(this.loopid);
    this.loopid = null;
  },

  /**
   * resumeAnim 从停止处开始动画
   */
  resume: function () {
    if (this.isLooping) return;
    this.isLooping = true;
    this.loop();
  },

  /**
   * reset 组元参数全部初始化
   */
  reset: function () {},

  /**
   * _restart 组元重新开始动画
   */
  restart: function () {
    this.resetVariables();
    this.life = this.options.lifeMin || 0;
    this.resume();
  },

  /**
   * destory 销毁动画组件
   */
  destoryAnim: function () {
    this.pause();
  },
  genOptions: function(){
    return Animator.prototype.options;
  }
});

module.exports = Animator;