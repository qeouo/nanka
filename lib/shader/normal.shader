[vertexshader]
precision mediump float;
attribute vec2 aPos;
varying lowp vec2 vUv;
void main(void){
	gl_Position = vec4(aPos,1,1.0);
	vUv= aPos*0.5 + vec2(0.5,0.5);
}
[fragmentshader]
varying lowp vec2 vUv;
uniform sampler2D uSampler;
uniform highp float ux;
uniform highp float uy; 
const highp float PI = 3.141592;
void main(void){
	highp vec4 def= texture2D(uSampler ,vec2(vUv.s,vUv.t));
	highp vec4 xm= texture2D(uSampler ,vec2(vUv.s-ux,vUv.t));
	highp vec4 ym= texture2D(uSampler ,vec2(vUv.s,vUv.t-uy));
	highp vec4 xp= texture2D(uSampler ,vec2(vUv.s+ux,vUv.t));
	highp vec4 yp= texture2D(uSampler ,vec2(vUv.s,vUv.t+uy));
	highp vec3 aa=vec3(-(xp.r-xm.r),-(yp.r-ym.r),ux);
	aa = normalize(aa);
	aa=aa*0.5+0.5;
	gl_FragColor = vec4(aa.xyz,(1.0-def.r));
}
