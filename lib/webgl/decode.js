"use strict"
 
var decodeShader = (function(){
	var shader = Ono3d.createShader("decode"," \
attribute vec2 aPos; \
uniform vec2 uUvScale; \
uniform vec2 uUvOffset; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1.0,1.0); \
	vUv = (aPos+ 1.0) * 0.5 * uUvScale +  uUvOffset; \
} \
"," \
precision lowp float; \
" + Rastgl.commonFunction + " \
varying lowp vec2 vUv; \
uniform sampler2D uSampler; \
float uA = 0.48; \
float uL = 0.5; \
void main(void){ \
	vec4 a = decode(texture2D(uSampler,vUv)); \
	vec4 b = texture2D(uSampler,vUv); \
	if(b.a*255.0>=128.4 && false){ \
	gl_FragColor= vec4(0.0,1.0,0.0,1.0); \
	}else { \
	a.rgb= a.rgb * uA / uL; \
	a.rgb= a.rgb / (1.0 + a.rgb); \
	a.r= pow(a.r , 1.0/2.2); \
	a.g= pow(a.g , 1.0/2.2); \
	a.b= pow(a.b , 1.0/2.2); \
	gl_FragColor= a; \
	} \
} " 
,["aPos"],[ "uPosScale", "uPosOffset", "uUvScale", "uUvOffset","uSampler","uSampler2"]);

	return shader;
})();

