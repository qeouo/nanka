"use strict"
var TestShader=(function(){
var ret= function(){};

ret.init= function(){
	return Ono3d.loadShader("testshader"," \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying vec3 vEye; \
varying mat3 vView; \
uniform mat4 projectionMatrix; \
uniform vec3 anglePos;  \
void main(void){ \
	gl_Position = projectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
	vEye = aPos - anglePos ; \
	vView = mat3(normalize(aSvec - dot(aNormal,aSvec)*aNormal) \
		,normalize(aTvec - dot(aNormal,aTvec)*aNormal) \
		,aNormal); \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
varying vec3 vEye; \
varying mat3 vView; \
uniform sampler2D uBaseColMap; \
const float sqrt2 = sqrt(2.0); \
void main(void){ \
	vec3 a = vView * normalize(vEye); \
	vec3 uvw = vec3(fract(vUv)*2.0-1.0,1.0); \
	vec3 eye = (sign(a) - uvw) / a; \
 \
	a = uvw + a * min(min(eye.x,eye.y),eye.z); \
	gl_FragColor = texture2D(uBaseColMap,(a.xy * sqrt2/(sqrt2+1.0-a.z))*0.5+0.5); \
	gl_FragColor.a = 0.0; \
} \
");
}
	return ret;

})();

