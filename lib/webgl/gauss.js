"use strict"
var Gauss=(function(){
//gauss shader
var gauss={};
var gauss2={};
var gl;
var ret= function(){};
ret.init= function(){
	gl = Rastgl.gl;
	var program= Rastgl.setShaderProgram(
" \
attribute vec2 aPos; \
attribute vec2 aUv; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv = aUv; \
} \
"
			,
" \
varying highp vec2 vUv; \
uniform sampler2D uSampler; \
uniform lowp float weight[10]; \
void main(void){ \
	lowp vec4 col=vec4(0.); \
	lowp vec2 fc = gl_FragCoord.st; \
	col += texture2D(uSampler,(fc+vec2(-4.,0.))/1024.)*weight[4]; \
	col += texture2D(uSampler,(fc+vec2(-3.,0.))/1024.)*weight[3]; \
	col += texture2D(uSampler,(fc+vec2(-2.,0.))/1024.)*weight[2]; \
	col += texture2D(uSampler,(fc+vec2(-1.,0.))/1024.)*weight[1]; \
	col += texture2D(uSampler,(fc+vec2(0.,0.))/1024.)*weight[0]; \
	col += texture2D(uSampler,(fc+vec2(1.,0.))/1024.)*weight[1]; \
	col += texture2D(uSampler,(fc+vec2(2.,0.))/1024.)*weight[2]; \
	col += texture2D(uSampler,(fc+vec2(3.,0.))/1024.)*weight[3]; \
	col += texture2D(uSampler,(fc+vec2(4.,0.))/1024.)*weight[4]; \
	gl_FragColor= vec4(col.rgb,1.0); \
} \
"
	);
	var args=[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
	//args["aUv"]=Rastgl.initAtt(program,"aUv",2,gl.FLOAT,Rastgl.uvGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["weight"]=gl.getUniformLocation(program,"weight");
	gauss.program=program;
	gauss.args=args;

	program= Rastgl.setShaderProgram(
" \
attribute vec2 aPos; \
attribute vec2 aUv; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv = aUv; \
} \
"
			,
" \
varying highp vec2 vUv; \
uniform sampler2D uSampler; \
uniform lowp float weight[10]; \
void main(void){ \
	lowp vec4 col=vec4(0.); \
	lowp vec2 fc = gl_FragCoord.st; \
	col += texture2D(uSampler,(fc+vec2(0.,-4.))/1024.)*weight[4]; \
	col += texture2D(uSampler,(fc+vec2(0.,-3.))/1024.)*weight[3]; \
	col += texture2D(uSampler,(fc+vec2(0.,-2.))/1024.)*weight[2]; \
	col += texture2D(uSampler,(fc+vec2(0.,-1.))/1024.)*weight[1]; \
	col += texture2D(uSampler,(fc+vec2(0.,0.))/1024.)*weight[0]; \
	col += texture2D(uSampler,(fc+vec2(0.,1.))/1024.)*weight[1]; \
	col += texture2D(uSampler,(fc+vec2(0.,2.))/1024.)*weight[2]; \
	col += texture2D(uSampler,(fc+vec2(0.,3.))/1024.)*weight[3]; \
	col += texture2D(uSampler,(fc+vec2(0.,4.))/1024.)*weight[4]; \
	gl_FragColor= col; \
} \
"
	);
	var args=[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
//	args["aUv"]=Rastgl.initAtt(program,"aUv",2,gl.FLOAT,Rastgl.uvGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["weight"]=gl.getUniformLocation(program,"weight");
	gauss2.program=program;
	gauss2.args=args;
}	
ret.filter=function(dst,src,d){
	var weight = new Array(5);
var t = 0.0;
for(i = 0; i < weight.length; i++){
    var r = 1.0 + 2.0 * i;
    var w = Math.exp(-0.5 * (r * r) / d);
    weight[i] = w;
    if(i > 0){w *= 2.0;}
    t += w;
}
for(i = 0; i < weight.length; i++){
    weight[i] /= t;
	var posbuffer=Rastgl.posGlBuffer.jsbuffer;
	var uvbuffer=Rastgl.uvGlBuffer.jsbuffer;
}
	var args=gauss.args;
	gl.bindFramebuffer(gl.FRAMEBUFFER, dst);
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0,0,720,480);

	posbuffer[0]=-1;
	posbuffer[1]=-1;
	posbuffer[2]=1;
	posbuffer[3]=-1;
	posbuffer[4]=1;
	posbuffer[5]=1;
	posbuffer[6]=-1;
	posbuffer[7]=1;

	uvbuffer[0]=0;
	uvbuffer[1]=0;
	uvbuffer[2]=1*720/1024;
	uvbuffer[3]=0;
	uvbuffer[4]=1*720/1024;
	uvbuffer[5]=1*480/1024;
	uvbuffer[6]=0;
	uvbuffer[7]=1*480/1024;

	gl.useProgram(gauss.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);

	gl.uniform1fv(args["weight"],weight);

	Rastgl.setArg(args.aPos);
	//Rastgl.setArg(args.aUv);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);

	args=gauss2.args;
	gl.useProgram(gauss2.program);
	gl.activeTexture(gl.TEXTURE0);
	
	gl.uniform1i(args["uSampler"],0);
	gl.bindTexture(gl.TEXTURE_2D,src);

	gl.uniform1fv(args["weight"],weight);
			
//	setArg(args.aPos);
//	Rastgl.setArg(args.aUv);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);
}
	return ret;
})();

