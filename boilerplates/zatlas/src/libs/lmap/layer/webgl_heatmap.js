// Generated by CoffeeScript 1.8.0
var Framebuffer, Heights, Node, Shader, WebGLHeatmap, fragmentShaderBlit, nukeVendorPrefix, textureFloatShims, vertexShaderBlit;
var Texture = require('./gl/texture');
  __indexOf = [].indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }
    return -1;
  };

var Utils = require('./../core/utils');
var Event = require('bcore/event');
var L = require('./../leaflet');
var dCanvas = require('./../render/canvas');

var Heights = require('./gl/heights');
var Shader = require('./gl/shader');
vertexShaderBlit = require('./gl/vertexShaderBlit');
fragmentShaderBlit = require('./gl/fragmentShaderBlit');

nukeVendorPrefix = function() {
  var getExtension, getSupportedExtensions, vendorRe, vendors;
  if (window.WebGLRenderingContext != null) {
    vendors = ['WEBKIT', 'MOZ', 'MS', 'O'];
    vendorRe = /^WEBKIT_(.*)|MOZ_(.*)|MS_(.*)|O_(.*)/;
    getExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
      var extobj, match, vendor, _i, _len;
      match = name.match(vendorRe);
      if (match !== null) {
        name = match[1];
      }
      extobj = getExtension.call(this, name);
      if (extobj === null) {
        for (_i = 0, _len = vendors.length; _i < _len; _i++) {
          vendor = vendors[_i];
          extobj = getExtension.call(this, vendor + '_' + name);
          if (extobj !== null) {
            return extobj;
          }
        }
        return null;
      } else {
        return extobj;
      }
    };
    getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    return WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      var extension, match, result, supported, _i, _len;
      supported = getSupportedExtensions.call(this);
      result = [];
      for (_i = 0, _len = supported.length; _i < _len; _i++) {
        extension = supported[_i];
        match = extension.match(vendorRe);
        if (match !== null) {
          extension = match[1];
        }
        if (__indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
      return result;
    };
  }
};

textureFloatShims = function() {
  var checkColorBuffer, checkFloatLinear, checkSupport, checkTexture, createSourceCanvas, getExtension, getSupportedExtensions, name, shimExtensions, shimLookup, unshimExtensions, unshimLookup, _i, _len;
  createSourceCanvas = function() {
    var canvas, ctx, imageData;
    canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    ctx = canvas.getContext('2d');
    imageData = ctx.getImageData(0, 0, 2, 2);
    imageData.data.set(new Uint8ClampedArray([0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255]));
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };
  createSourceCanvas();
  checkFloatLinear = function(gl, sourceType) {
    var buffer, cleanup, fragmentShader, framebuffer, positionLoc, program, readBuffer, result, source, sourceCanvas, sourceLoc, target, vertexShader, vertices;
    program = gl.createProgram();
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.attachShader(program, vertexShader);
    gl.shaderSource(vertexShader, 'attribute vec2 position;\nvoid main(){\n    gl_Position = vec4(position, 0.0, 1.0);\n}');
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(vertexShader);
    }
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.attachShader(program, fragmentShader);
    gl.shaderSource(fragmentShader, 'uniform sampler2D source;\nvoid main(){\n    gl_FragColor = texture2D(source, vec2(1.0, 1.0));\n}');
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(fragmentShader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    gl.useProgram(program);
    cleanup = function() {
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(source);
      gl.deleteTexture(target);
      gl.deleteFramebuffer(framebuffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    sourceCanvas = createSourceCanvas();
    source = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, source);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, sourceType, sourceCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    vertices = new Float32Array([1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    positionLoc = gl.getAttribLocation(program, 'position');
    sourceLoc = gl.getUniformLocation(program, 'source');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(sourceLoc, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    readBuffer = new Uint8Array(4 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, readBuffer);
    result = Math.abs(readBuffer[0] - 127) < 10;
    cleanup();
    return result;
  };
  checkTexture = function(gl, targetType) {
    var target;
    target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, targetType, null);
    if (gl.getError() === 0) {
      gl.deleteTexture(target);
      return true;
    } else {
      gl.deleteTexture(target);
      return false;
    }
  };
  checkColorBuffer = function(gl, targetType) {
    var check, framebuffer, target;
    target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, targetType, null);
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.deleteTexture(target);
    gl.deleteFramebuffer(framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (check === gl.FRAMEBUFFER_COMPLETE) {
      return true;
    } else {
      return false;
    }
  };
  shimExtensions = [];
  shimLookup = {};
  unshimExtensions = [];
  checkSupport = function() {
    var canvas, extobj, gl, halfFloatExt, halfFloatTexturing, singleFloatExt, singleFloatTexturing;
    canvas = document.createElement('canvas');
    gl = null;
    try {
      gl = canvas.getContext('experimental-webgl');
      if (gl === null) {
        gl = canvas.getContext('webgl');
      }
    } catch (_error) {}
    if (gl != null) {
      singleFloatExt = gl.getExtension('OES_texture_float');
      if (singleFloatExt === null) {
        if (checkTexture(gl, gl.FLOAT)) {
          singleFloatTexturing = true;
          shimExtensions.push('OES_texture_float');
          shimLookup.OES_texture_float = {
            shim: true
          };
        } else {
          singleFloatTexturing = false;
          unshimExtensions.push('OES_texture_float');
        }
      } else {
        if (checkTexture(gl, gl.FLOAT)) {
          singleFloatTexturing = true;
          shimExtensions.push('OES_texture_float');
        } else {
          singleFloatTexturing = false;
          unshimExtensions.push('OES_texture_float');
        }
      }
      if (singleFloatTexturing) {
        extobj = gl.getExtension('WEBGL_color_buffer_float');
        if (extobj === null) {
          if (checkColorBuffer(gl, gl.FLOAT)) {
            shimExtensions.push('WEBGL_color_buffer_float');
            shimLookup.WEBGL_color_buffer_float = {
              shim: true,
              RGBA32F_EXT: 0x8814,
              RGB32F_EXT: 0x8815,
              FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: 0x8211,
              UNSIGNED_NORMALIZED_EXT: 0x8C17
            };
          } else {
            unshimExtensions.push('WEBGL_color_buffer_float');
          }
        } else {
          if (checkColorBuffer(gl, gl.FLOAT)) {
            shimExtensions.push('WEBGL_color_buffer_float');
          } else {
            unshimExtensions.push('WEBGL_color_buffer_float');
          }
        }
        extobj = gl.getExtension('OES_texture_float_linear');
        if (extobj === null) {
          if (checkFloatLinear(gl, gl.FLOAT)) {
            shimExtensions.push('OES_texture_float_linear');
            shimLookup.OES_texture_float_linear = {
              shim: true
            };
          } else {
            unshimExtensions.push('OES_texture_float_linear');
          }
        } else {
          if (checkFloatLinear(gl, gl.FLOAT)) {
            shimExtensions.push('OES_texture_float_linear');
          } else {
            unshimExtensions.push('OES_texture_float_linear');
          }
        }
      }
      halfFloatExt = gl.getExtension('OES_texture_half_float');
      if (halfFloatExt === null) {
        if (checkTexture(gl, 0x8D61)) {
          halfFloatTexturing = true;
          shimExtensions.push('OES_texture_half_float');
          halfFloatExt = shimLookup.OES_texture_half_float = {
            HALF_FLOAT_OES: 0x8D61,
            shim: true
          };
        } else {
          halfFloatTexturing = false;
          unshimExtensions.push('OES_texture_half_float');
        }
      } else {
        if (checkTexture(gl, halfFloatExt.HALF_FLOAT_OES)) {
          halfFloatTexturing = true;
          shimExtensions.push('OES_texture_half_float');
        } else {
          halfFloatTexturing = false;
          unshimExtensions.push('OES_texture_half_float');
        }
      }
      if (halfFloatTexturing) {
        extobj = gl.getExtension('EXT_color_buffer_half_float');
        if (extobj === null) {
          if (checkColorBuffer(gl, halfFloatExt.HALF_FLOAT_OES)) {
            shimExtensions.push('EXT_color_buffer_half_float');
            shimLookup.EXT_color_buffer_half_float = {
              shim: true,
              RGBA16F_EXT: 0x881A,
              RGB16F_EXT: 0x881B,
              FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: 0x8211,
              UNSIGNED_NORMALIZED_EXT: 0x8C17
            };
          } else {
            unshimExtensions.push('EXT_color_buffer_half_float');
          }
        } else {
          if (checkColorBuffer(gl, halfFloatExt.HALF_FLOAT_OES)) {
            shimExtensions.push('EXT_color_buffer_half_float');
          } else {
            unshimExtensions.push('EXT_color_buffer_half_float');
          }
        }
        extobj = gl.getExtension('OES_texture_half_float_linear');
        if (extobj === null) {
          if (checkFloatLinear(gl, halfFloatExt.HALF_FLOAT_OES)) {
            shimExtensions.push('OES_texture_half_float_linear');
            return shimLookup.OES_texture_half_float_linear = {
              shim: true
            };
          } else {
            return unshimExtensions.push('OES_texture_half_float_linear');
          }
        } else {
          if (checkFloatLinear(gl, halfFloatExt.HALF_FLOAT_OES)) {
            return shimExtensions.push('OES_texture_half_float_linear');
          } else {
            return unshimExtensions.push('OES_texture_half_float_linear');
          }
        }
      }
    }
  };
  if (window.WebGLRenderingContext != null) {
    checkSupport();
    unshimLookup = {};
    for (_i = 0, _len = unshimExtensions.length; _i < _len; _i++) {
      name = unshimExtensions[_i];
      unshimLookup[name] = true;
    }
    getExtension = WebGLRenderingContext.prototype.getExtension;
    WebGLRenderingContext.prototype.getExtension = function(name) {
      var extobj;
      extobj = shimLookup[name];
      if (extobj === void 0) {
        if (unshimLookup[name]) {
          return null;
        } else {
          return getExtension.call(this, name);
        }
      } else {
        return extobj;
      }
    };
    getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      var extension, result, supported, _j, _k, _len1, _len2;
      supported = getSupportedExtensions.call(this);
      result = [];
      for (_j = 0, _len1 = supported.length; _j < _len1; _j++) {
        extension = supported[_j];
        if (unshimLookup[extension] === void 0) {
          result.push(extension);
        }
      }
      for (_k = 0, _len2 = shimExtensions.length; _k < _len2; _k++) {
        extension = shimExtensions[_k];
        if (__indexOf.call(result, extension) < 0) {
          result.push(extension);
        }
      }
      return result;
    };
    return WebGLRenderingContext.prototype.getFloatExtension = function(spec) {
      var candidate, candidates, half, halfFramebuffer, halfLinear, halfTexture, i, importance, preference, result, single, singleFramebuffer, singleLinear, singleTexture, use, _j, _k, _l, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
      if (spec.prefer == null) {
        spec.prefer = ['half'];
      }
      if (spec.require == null) {
        spec.require = [];
      }
      if (spec.throws == null) {
        spec.throws = true;
      }
      singleTexture = this.getExtension('OES_texture_float');
      halfTexture = this.getExtension('OES_texture_half_float');
      singleFramebuffer = this.getExtension('WEBGL_color_buffer_float');
      halfFramebuffer = this.getExtension('EXT_color_buffer_half_float');
      singleLinear = this.getExtension('OES_texture_float_linear');
      halfLinear = this.getExtension('OES_texture_half_float_linear');
      single = {
        texture: singleTexture !== null,
        filterable: singleLinear !== null,
        renderable: singleFramebuffer !== null,
        score: 0,
        precision: 'single',
        half: false,
        single: true,
        type: this.FLOAT
      };
      half = {
        texture: halfTexture !== null,
        filterable: halfLinear !== null,
        renderable: halfFramebuffer !== null,
        score: 0,
        precision: 'half',
        half: true,
        single: false,
        type: (_ref = halfTexture != null ? halfTexture.HALF_FLOAT_OES : void 0) != null ? _ref : null
      };
      candidates = [];
      if (single.texture) {
        candidates.push(single);
      }
      if (half.texture) {
        candidates.push(half);
      }
      result = [];
      for (_j = 0, _len1 = candidates.length; _j < _len1; _j++) {
        candidate = candidates[_j];
        use = true;
        _ref1 = spec.require;
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          name = _ref1[_k];
          if (candidate[name] === false) {
            use = false;
          }
        }
        if (use) {
          result.push(candidate);
        }
      }
      for (_l = 0, _len3 = result.length; _l < _len3; _l++) {
        candidate = result[_l];
        _ref2 = spec.prefer;
        for (i = _m = 0, _len4 = _ref2.length; _m < _len4; i = ++_m) {
          preference = _ref2[i];
          importance = Math.pow(2, spec.prefer.length - i - 1);
          if (candidate[preference]) {
            candidate.score += importance;
          }
        }
      }
      result.sort(function(a, b) {
        if (a.score === b.score) {
          return 0;
        } else if (a.score < b.score) {
          return 1;
        } else if (a.score > b.score) {
          return -1;
        }
      });
      if (result.length === 0) {
        if (spec.throws) {
          throw 'No floating point texture support that is ' + spec.require.join(', ');
        } else {
          return null;
        }
      } else {
        result = result[0];
        return {
          filterable: result.filterable,
          renderable: result.renderable,
          type: result.type,
          precision: result.precision
        };
      }
    };
  }
};

nukeVendorPrefix();

textureFloatShims();



WebGLHeatmap = (function() {
  function WebGLHeatmap(_arg) {
    var alphaEnd, alphaRange, alphaStart, error, getColorFun, gradientTexture, image, intensityToAlpha, output, quad, textureGradient, _ref, _ref1;
    _ref = _arg != null ? _arg : {};
    this.canvas = _ref.canvas, this.width = _ref.width, this.height = _ref.height, intensityToAlpha = _ref.intensityToAlpha, gradientTexture = _ref.gradientTexture, alphaRange = _ref.alphaRange;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    try {
      this.gl = this.canvas.getContext('experimental-webgl', {
        depth: false,
        antialias: false
      });
      if (this.gl === null) {
        this.gl = this.canvas.getContext('webgl', {
          depth: false,
          antialias: false
        });
        if (this.gl === null) {
          throw 'WebGL not supported';
        }
      }
    } catch (_error) {
      error = _error;
      throw 'WebGL not supported';
    }
    if (window.WebGLDebugUtils != null) {
      console.log('debugging mode');
      this.gl = WebGLDebugUtils.makeDebugContext(this.gl, function(err, funcName, args) {
        throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
      });
    }
    this.gl.enableVertexAttribArray(0);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
    if (gradientTexture) {
      textureGradient = this.gradientTexture = new Texture(this.gl, {
        channels: 'rgba'
      }).bind(0).setSize(2, 2).nearest().clampToEdge();
      if (typeof gradientTexture === 'string') {
        image = new Image();
        image.onload = function() {
          return textureGradient.bind().upload(image);
        };
        image.src = gradientTexture;
      } else {
        if (gradientTexture.width > 0 && gradientTexture.height > 0) {
          textureGradient.upload(gradientTexture);
        } else {
          gradientTexture.onload = function() {
            return textureGradient.upload(gradientTexture);
          };
        }
      }
      getColorFun = 'uniform sampler2D gradientTexture;\nvec3 getColor(float intensity){\n    return texture2D(gradientTexture, vec2(intensity, 0.0)).rgb;\n}';
    } else {
      textureGradient = null;
      getColorFun = 'vec3 getColor(float intensity){\n    vec3 blue = vec3(0.0, 0.0, 1.0);\n    vec3 cyan = vec3(0.0, 1.0, 1.0);\n    vec3 green = vec3(0.0, 1.0, 0.0);\n    vec3 yellow = vec3(1.0, 1.0, 0.0);\n    vec3 red = vec3(1.0, 0.0, 0.0);\n\n    vec3 color = (\n        fade(-0.25, 0.25, intensity)*blue +\n        fade(0.0, 0.5, intensity)*cyan +\n        fade(0.25, 0.75, intensity)*green +\n        fade(0.5, 1.0, intensity)*yellow +\n        smoothstep(0.75, 1.0, intensity)*red\n    );\n    return color;\n}';
    }
    if (intensityToAlpha == null) {
      intensityToAlpha = true;
    }
    if (intensityToAlpha) {
      _ref1 = alphaRange != null ? alphaRange : [0, 1], alphaStart = _ref1[0], alphaEnd = _ref1[1];
      output = "vec4 alphaFun(vec3 color, float intensity){\n    float alpha = smoothstep(" + (alphaStart.toFixed(8)) + ", " + (alphaEnd.toFixed(8)) + ", intensity);\n    return vec4(color*alpha, alpha);\n}";
    } else {
      output = 'vec4 alphaFun(vec3 color, float intensity){\n    return vec4(color, 1.0);\n}';
    }
    this.shader = new Shader(this.gl, {
      vertex: vertexShaderBlit,
      fragment: fragmentShaderBlit + ("float linstep(float low, float high, float value){\n    return clamp((value-low)/(high-low), 0.0, 1.0);\n}\n\nfloat fade(float low, float high, float value){\n    float mid = (low+high)*0.5;\n    float range = (high-low)*0.5;\n    float x = 1.0 - clamp(abs(mid-value)/range, 0.0, 1.0);\n    return smoothstep(0.0, 1.0, x);\n}\n\n" + getColorFun + "\n" + output + "\n\nvoid main(){\n    float intensity = smoothstep(0.0, 1.0, texture2D(source, texcoord).r);\n    vec3 color = getColor(intensity);\n    gl_FragColor = alphaFun(color, intensity);\n}")
    });
    if (this.width == null) {
      this.width = this.canvas.offsetWidth || 2;
    }
    if (this.height == null) {
      this.height = this.canvas.offsetHeight || 2;
    }
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);
    this.quad = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quad);
    quad = new Float32Array([-1, -1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 0, 1, 1, 1, 0, 1]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quad, this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.heights = new Heights(this, this.gl, this.width, this.height);
  }

  WebGLHeatmap.prototype.adjustSize = function() {
    var canvasHeight, canvasWidth;
    canvasWidth = this.canvas.offsetWidth || 2;
    canvasHeight = this.canvas.offsetHeight || 2;
    if (this.width !== canvasWidth || this.height !== canvasHeight) {
      this.gl.viewport(0, 0, canvasWidth, canvasHeight);
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.width = canvasWidth;
      this.height = canvasHeight;
      return this.heights.resize(this.width, this.height);
    }
  };

  WebGLHeatmap.prototype.display = function() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quad);
    this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 0, 0);
    this.heights.nodeFront.bind(0);
    if (this.gradientTexture) {
      this.gradientTexture.bind(1);
    }
    this.shader.use().int('source', 0).int('gradientTexture', 1);
    return this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  };

  WebGLHeatmap.prototype.update = function() {
    return this.heights.update();
  };

  WebGLHeatmap.prototype.clear = function() {
    return this.heights.clear();
  };

  WebGLHeatmap.prototype.clamp = function(min, max) {
    if (min == null) {
      min = 0;
    }
    if (max == null) {
      max = 1;
    }
    return this.heights.clamp(min, max);
  };

  WebGLHeatmap.prototype.multiply = function(value) {
    if (value == null) {
      value = 0.95;
    }
    return this.heights.multiply(value);
  };

  WebGLHeatmap.prototype.blur = function() {
    return this.heights.blur();
  };

  WebGLHeatmap.prototype.addPoint = function(x, y, size, intensity) {
    return this.heights.addPoint(x, y, size, intensity);
  };

  WebGLHeatmap.prototype.addPoints = function(items) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      _results.push(this.addPoint(item.x, item.y, item.size, item.intensity));
    }
    return _results;
  };

  return WebGLHeatmap;

})();

function WebGLHeatmapL(options) {
  var options = this.options = Utils.deepMerge(WebGLHeatmapL.options, options);
}

WebGLHeatmapL.options = {
  'intensity': 0.2,
  'lat': Utils.getLat,
  'lng': Utils.getLng,
  'size': function() {
    return 3;
  },
  'quality': 1,
  'container': 'tilePane',
  'clearPhi': 0
};

WebGLHeatmapL = Event.extend(WebGLHeatmapL, {
  addTo: function(map) {
    if (!map) return;
    this._map = map;
    this.transfer = map.latLngToContainerPoint.bind(map);
    this.initialize();
  },
  initialize: function() {
    var options = this.options;
    var container = options.container;
    var quality;
    if(typeof(container) === 'string'){
    var width, height;
    var nodes = this._map.getPanes();
    container = nodes[container];
  } else {
    container = Utils.getContainer(container);
  }
    var mapSize = this._map.getSize();
    var width = mapSize.x;
    var height = mapSize.y;
    var quality = options.quality;
    var canvas = document.createElement('<canvas width="' + (width * quality) + '" height="' + (height * quality) + '"><canvas>');
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    container.appendChild(canvas);
    this.heatmap = new WebGLHeatmap({
      canvas: canvas
    });
    this.initEvents();
  },
  data: function(ds) {
    this._data = ds;
  },
  render: function(ds) {
    if (ds) this.data(ds);
    var options = this.options;
    var transfer = this.transfer;
    var heatmap = this.heatmap;
    heatmap.multiply(options.clearPhi);
    var intensity = options.intensity;
    var getLat = options.lat,
      getLng = options.lng,
      getSize = options.size;
    ds = this._data;
    var zoom = this._map.getZoom();
    var d, lat, lng, pt, size;
    for (var i in ds) {
      d = ds[i];
      lat = getLat(d), lng = getLng(d);
      latlng = L.latLng(lat, lng);
      pt = transfer(latlng);
      size = getSize(d, zoom);
      heatmap.addPoint(pt.x, pt.y, size, intensity);
    }
    heatmap.update();
    heatmap.display();
  },
  resetPos: function() {
    var canvas = this.canvas[0];
    var domPosition = L.DomUtil.getPosition(this._map.getPanes().mapPane);
    if (domPosition) {
      L.DomUtil.setPosition(canvas, {
        x: -domPosition.x,
        y: -domPosition.y
      });
    }
  },
  clean: function(){
    var heatmap = this.heatmap;
    heatmap.multiply(0);
    heatmap.update();
    heatmap.display();
  },
  initEvents: function(){
    var self = this;
    var heatmap = this.heatmap;
    this._map
    .on('moveend', function(){
      self.resetPos();
      self.render();
    })
    .on('zoomstart', function(){
      self.clean();
    });
  }
});

L = L || {};
L.dmap = L.dmap || {};
L.dmap.webGLHeatmap = function(params) {
  return new WebGLHeatmapL(params);
};

module.exports = WebGLHeatmapL;