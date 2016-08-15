"use strict"
var Gauss=(function(){
var gauss={};
var gauss2={};
var gl;
var ret= function(){};
ret.init= function(){
	gl = Rastgl.gl;
	var program= Rastgl.setShaderProgram(
" \
attribute vec2 aPos; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
} \
"
			,
" \
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
	gl.useProgram(program);
	var args=[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["weight"]=gl.getUniformLocation(program,"weight");
	gauss.program=program;
	gauss.args=args;

	program= Rastgl.setShaderProgram(
" \
attribute vec2 aPos; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
} \
"
			,
" \
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
	gl.useProgram(program);
	var args=[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT);
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
}
	var args=gauss.args;
	gl.bindFramebuffer(gl.FRAMEBUFFER, dst);
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0,0,720,480);


	gl.useProgram(gauss.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);

	gl.uniform1fv(args["weight"],weight);

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
	gl.vertexAttribPointer(args["aPos"].att, args["aPos"].size,args["aPos"].type , false, 0, 0);
	//Rastgl.setArg(args.aPos);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);

	args=gauss2.args;
	gl.useProgram(gauss2.program);
	gl.activeTexture(gl.TEXTURE0);
	
	gl.uniform1i(args["uSampler"],0);
	gl.bindTexture(gl.TEXTURE_2D,src);

	gl.uniform1fv(args["weight"],weight);
			
//	setArg(args.aPos);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);
}
ret.init();
	return ret;
})();

