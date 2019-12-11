"use strict"
var Rastgl= (function(){
	var currentpath = Util.getCurrent();
	var ret=function(){}

var FACE_MAX=ret.FACE_MAX = 4096*2;
var VERTEX_MAX=ret.VERTEX_MAX = FACE_MAX*3;

var gl;

var renderBuffer;
var frameBuffer;
var fTexture;
ret.dummyTexture;

var fullposbuffer;

var setShaderProgram = ret.setShaderProgram = function(vs,fs){
	//シェーダをコンパイルする
	
  // Vertex shader
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vshader, vs);
  gl.compileShader(vshader);
  if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)){
    alert(gl.getShaderInfoLog(vshader));
    return null;
  }

  // Fragment shader
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fshader, fs);
  gl.compileShader(fshader);
  if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
    alert(gl.getShaderInfoLog(fshader));
    return null;
  }
  // Create shader program
  var program = gl.createProgram();
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    alert(gl.getProgramInfoLog(program));
    return null;
  }
	gl.useProgram(program);

  return program;
}

var createTexture = ret.createTexture= function(image,x,y){
	var neheTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	if(image){
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}else{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}


ret.init=function(_gl){

	gl = _gl;
	ret.gl = _gl;
	try{

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.CULL_FACE);


		ret.frameBuffer =frameBuffer=gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

		ret.fTexture=fTexture = createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		ret.dummyTexture = createTexture(null,1,1);
		gl.bindTexture(gl.TEXTURE_2D, ret.dummyTexture);
		gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,1,1,0);
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
	}
	catch(e){
		return true;
	}
	
	ret.glIdxBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ret.glIdxBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(VERTEX_MAX), gl.DYNAMIC_DRAW);

	ret.glbuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ret.glbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VERTEX_MAX*20), gl.DYNAMIC_DRAW);

	ret.fullposbuffer=gl.createBuffer();
	fullposbuffer=ret.fullposbuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, ret.fullposbuffer);
	var buffer=new Float32Array(8);
	buffer[0]=-1;
	buffer[1]=-1;
	buffer[2]=1;
	buffer[3]=-1;
	buffer[4]=1;
	buffer[5]=1;
	buffer[6]=-1;
	buffer[7]=1;
	gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

	this.planeShader =  Ono3d.createShader(" \
	[vertexshader] \
	attribute vec2 aPos; \
	uniform vec2 uPosScale; \
	uniform vec2 uPosOffset; \
	uniform vec2 uUvScale; \
	uniform vec2 uUvOffset; \
	varying vec2 vUv; \
	void main(void){ \
		gl_Position = vec4(aPos * uPosScale + uPosOffset,1.0,1.0); \
		vUv = (aPos+ 1.0) * 0.5 * uUvScale +  uUvOffset; \
	} \
	[fragmentshader] \
	varying lowp vec2 vUv; \
	uniform sampler2D uSampler; \
	void main(void){ \
		gl_FragColor= texture2D(uSampler,vUv); \
	} ");



	return false;

}
	ret.commonFunction=" \n \
		lowp vec4 packR11G11B10_(highp vec3 raw){ \n \
			mediump vec3 idx = log2(max(raw,0.0000001)); \n \
			idx = clamp(floor(idx),0.0,7.0);  \n \
			idx.b = floor(idx.b*0.5)+1.0; \n \
			return vec4(raw/exp2(idx),(idx.r*32.0+idx.g*4.0+floor(idx.b*0.5))/255.0); \n \
		} \n \
		highp vec3 unpackR11G11B10_(lowp vec4 raw){ \n \
			mediump vec3 idx; \n \
			idx.r = raw.a*8.0; \n \
			idx.g = fract(raw.a*8.0)*8.0; \n \
			idx.b = fract(raw.a*8.0*8.0)*4.0;  \n \
			idx = floor(idx); \n \
			idx.b = idx.b*2.0+1.0; \n \
			return  raw.rgb * exp2(idx) ; \n \
		} \n \
		lowp vec4 packR11G11B10(highp vec3 raw){ \n \
			mediump vec3 idx = log2(max(raw,0.0001)); \n \
			idx = clamp(floor(idx),-1.0,2.0);  \n \
			vec3 num = raw/exp2(idx);\n \
			idx += 1.0; \n \
			vec4 result; \n \
			result.r = floor((num.r )*64.0)*4.0 + floor(idx.r/8.0)*0.0; \n \
			result.g = floor((num.g )*64.0)*4.0 + floor(idx.g/8.0)*0.0; \n \
			result.b = floor((num.b )*32.0)*8.0 + floor(idx.b/4.0)*0.0; \n \
			result.a = fract(idx.r/4.0) + fract(idx.g/4.0)/8.0 + fract(idx.b/4.0)/64.0; \n \
			return vec4(result.rgb/255.0,result.a); \n \
		} \n \
		highp vec3 unpackR11G11B10(lowp vec4 raw){ \n \
			mediump vec3 idx; \n \
			mediump vec4 num; \n \
			num = floor(raw*256.0); \n \
			idx.r = fract(raw.r*255.0/4.0)*0.0 + floor(raw.a*255.0/32.0); \n \
			idx.g = fract(raw.g*255.0/4.0)*0.0 + floor(fract(raw.a*255.0/32.0)*8.0); \n \
			idx.b = fract(raw.b*255.0/8.0)*0.0 + floor(fract(raw.a*255.0/4.0)*4.0); \n \
			num.r = floor(num.r/4.0)*4.0/255.0; \n \
			num.g = floor(num.g/4.0)*4.0/255.0; \n \
			num.b = floor(num.b/8.0)*8.0/255.0; \n \
			return  (num.rgb )* exp2(idx -1.0) ; \n \
		} \n \
		vec4 packRGBE(lowp vec3 src){ \n \
			float m = max(src.r,max(src.g,src.b)); \n \
			float idx = ceil(log2(m+0.001)); \n \
			return vec4(src.rgb / exp2(idx),(idx+128.0)/255.0); \n \
		} \n \
		vec4 unpackRGBE(vec4 src){ \n \
			float idx = floor(src.a * 256.0 - 128.0); \n \
			return vec4(src.rgb * exp2(idx),1.0); \n \
		} \n \
		vec4 packFloat(highp vec3 src){ \n \
			float e = floor((-sign(src.b)+1.0)*0.5); \n \
			e = e+floor((-sign(src.g)+1.0)*0.5)*2.0; \n \
			e = e+floor((-sign(src.r)+1.0)*0.5)*4.0; \n \
			float m = max(abs(src.r),max(abs(src.g),abs(src.b))); \n \
			float idx = ceil(log2(m+0.001)); \n \
			e = e*32.0 +(idx+16.0); \n \
			return vec4(abs(src.rgb) / exp2(idx),e/255.0); \n \
		} \n \
		highp vec3 unpackFloat(lowp vec4 src){ \n \
			mediump vec3 rgb = src.rgb; \n \
			mediump float e = src.a; \n \
			rgb.r *=  sign(0.5-floor(e*2.0)); \n \
			e=fract(e*2.0); \n \
			rgb.g *= sign(0.5-floor(e*2.0)); \n \
			e=fract(e*2.0); \n \
			rgb.b *=  sign(0.5-floor(e*2.0)); \n \
			float idx = floor(fract(src.a*8.0) * 32.0 - 16.0); \n \
			return rgb* exp2(idx); \n \
		} \n \
		lowp vec2 packUFP16(highp float raw){ \n \
			if(raw==0.0)return vec2(0.0,0.0); \n \
			float idx = min(15.0,max(-16.0,floor(log2(raw))));  \n \
			float f = raw /exp2(idx) -1.0; \n \
			f = fract(f)*255.0; \n \
			float a = floor(f); \n \
			float b = floor((f - a)*8.0); \n \
			return vec2(a,b*32.0 + (idx+16.0))/255.0; \n \
		} \n \
		highp float unpackUFP16(lowp vec2 src){ \n \
			if(src.r==0.0 && src.g==0.0)return 0.0; \n \
			float idx = floor(fract(src.g*8.0) * 32.0 - 16.0); \n \
			float b = floor(src.g*8.0) /8.0 ; \n \
			return ((src.r + b/256.0) +1.0)* exp2(idx) ; \n \
		} \n \
		lowp vec2 packUXP16(highp float ff){ \n \
			lowp vec2 color; \n \
			highp float f = ff*255.0; \n \
			color.r = floor(f); \n \
			f=(f-color.r)*255.0; \n \
			color.g = floor(f); \n \
 \n \
			return color*(1.0/255.0); \n \
		} \n \
		highp float unpackUXP16(lowp vec2 src){ \n \
			return (src.r*256.0  + src.g)/256.0; \n \
		} \n \
		highp vec2 decodeFull_(lowp vec4 src){ \n \
			return vec2(unpackUFP16(src.rg),unpackUFP16(src.ba)); \n \
		} \n \
		highp vec2 decodeShadow(sampler2D tex,vec2 texsize,vec2 uv){ \n \
			vec2 unit = 1.0/texsize; \
			uv = uv - 0.5 * unit; \
	 		vec2 r = fract(uv*texsize); \n \
			return mix(mix(decodeFull_(texture2D(tex,uv)) \n \
					,decodeFull_(texture2D(tex,uv+vec2(unit.x,0.0))),r.x) \n \
				,mix(decodeFull_(texture2D(tex,uv+vec2(0.0,unit.y))) \n \
					,decodeFull_(texture2D(tex,uv+unit)),r.x) \n \
				,r.y); \n \
		} \n \
		vec4 encode2(vec4 src){ \n \
			float idx = ceil(log2(src.r+0.01)); \n \
			float idx2 = ceil(log2(src.g+0.01)); \n \
			return vec4(src.r/ exp2(idx),src.g/exp2(idx2),(idx+128.0)/255.0,(idx2+128.0)/255.0); \n \
		} \n \
		vec4 decode2(vec4 src){ \n \
			float idx = floor(src.b * 256.0 - 128.0); \n \
			float idx2 = floor(src.a * 256.0 - 128.0); \n \
			return vec4(src.r * exp2(idx),src.g*exp2(idx2),1.0,1.0); \n \
		} \n \
		const highp float PI =3.14159265359;  \n \
		float atan2(in float y, in float x) { \n \
			return x == 0.0 ? sign(y)*PI/2.0 : atan(y, x); \n \
		} \n \
		const highp float _PI =1.0/3.14159265359; \n \
		vec2 angle2uv(vec3 angle) { \n \
			return vec2(atan2(angle.z,angle.x)*_PI*0.5 + 0.5  \n \
				,-atan2(angle.y,length(angle.xz))*_PI + 0.5); \n \
		} \n \
		vec3 uv2angle(vec2 uv) { \n \
			vec3 va; \n \
			va.y = sin((0.5-uv.y)*PI); \n \
			float l = sqrt(1.0-va.y*va.y); \n \
			float r = (-uv.x*2.0-0.5)* PI; \n \
			va.x = sin(r)*l; \n \
			va.z = cos(r)*l; \n \
			return va; \n \
		} \n \
		lowp vec4 encode(highp vec4 src){ \n \
			return packR11G11B10(src.rgb); \n \
		} \n \
		highp vec4 decode(vec4 src){ \n \
			return vec4(unpackR11G11B10(src),1.0); \n \
		} \n \
	";

	ret.textureRGBE=" \n \
		vec4 textureRGBE(sampler2D tex,vec2 texsize,vec2 uv){ \n \
			vec2 unit = 1.0/texsize; \
			uv = uv - 0.5 * unit; \
	 		vec2 r = fract(uv*texsize); \n \
			return mix(mix(unpackRGBE(texture2D(tex,uv)) \n \
					,unpackRGBE(texture2D(tex,uv+vec2(unit.x,0.0))),r.x) \n \
				,mix(unpackRGBE(texture2D(tex,uv+vec2(0.0,unit.y))) \n \
					,unpackRGBE(texture2D(tex,uv+unit)),r.x) \n \
				,r.y); \n \
		} \n \
		highp vec3 textureR11G11B10(sampler2D tex,vec2 texsize,vec2 uv){ \n \
			vec2 unit = 1.0/texsize; \
			uv = uv - 0.5 * unit; \
	 		vec2 r = fract(uv*texsize); \n \
			return mix(mix(unpackR11G11B10(texture2D(tex,uv)) \n \
					,unpackR11G11B10(texture2D(tex,uv+vec2(unit.x,0.0))),r.x) \n \
				,mix(unpackR11G11B10(texture2D(tex,uv+vec2(0.0,unit.y))) \n \
					,unpackR11G11B10(texture2D(tex,uv+unit)),r.x) \n \
				,r.y); \n \
		} \n \
		vec3 textureDecode(sampler2D tex,vec2 texsize,vec2 uv){ \n \
			vec2 unit = 1.0/texsize; \
			uv = uv - 0.5 * unit; \
	 		vec2 r = fract(uv*texsize); \n \
			return mix(mix(decode(texture2D(tex,uv)) \n \
					,decode(texture2D(tex,uv+vec2(unit.x,0.0))),r.x) \n \
				,mix(decode(texture2D(tex,uv+vec2(0.0,unit.y))) \n \
					,decode(texture2D(tex,uv+unit)),r.x) \n \
				,r.y).rgb; \n \
		} \n \
	";


	return ret;
})();

