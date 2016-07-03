"use strict"
var Nrm=(function(){
var gl;
var ret= function(){};

var args;
var program;

ret.init= function(){
	gl = Rastgl.gl;

	program= Rastgl.setShaderProgram(
" \
precision mediump float; \
attribute vec2 aPos; \
varying lowp vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv= aPos*0.5 + vec2(0.5,0.5); \
} \
" , " \
varying lowp vec2 vUv; \
uniform sampler2D uSampler; \
uniform highp float ux; \
uniform highp float uy;  \
const highp float PI = 3.141592; \
void main(void){ \
	highp vec4 def = texture2D(uSampler \
		,vec2(vUv.s,vUv.t)); \
	highp vec4 xp= texture2D(uSampler \
		,vec2(vUv.s+ux,vUv.t)); \
	highp vec4 yp= texture2D(uSampler \
		,vec2(vUv.s,vUv.t+uy)); \
	highp vec3 aa=vec3(xp.r-def.r,yp.r-def.r,1.0); \
	aa = normalize(aa); \
	gl_FragColor = vec4((-aa*0.5+0.5).xy,aa.z,1.0-def.r); \
} \
"

	);
	args =[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["ux"]=gl.getUniformLocation(program,"ux");
	args["uy"]=gl.getUniformLocation(program,"uy");
	}

	ret.draw=function(src,x,y){
		var posbuffer = args["aPos"].buffer.jsbuffer;

		posbuffer[0]=-1;
		posbuffer[1]=-1;
		posbuffer[2]=1;
		posbuffer[3]=-1;
		posbuffer[4]=1;
		posbuffer[5]=1;
		posbuffer[6]=-1;
		posbuffer[7]=1;

		gl.disable(gl.BLEND);

		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,src);
		gl.uniform1i(args["uSampler"],0);
		gl.uniform1f(args["ux"],1.0/x);
		gl.uniform1f(args["uy"],1.0/y);

		Rastgl.setArg(args["aPos"]);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
		
	}
	return ret;
})();

