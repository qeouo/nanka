"use strict"
var Env=(function(){
var gl;
var ret= function(){};
var args = {};
var program;
ret.init= function(){
	gl = Rastgl.gl;

	program= Rastgl.setShaderProgram(

" \
attribute vec2 aPos; \
varying vec3 vAngle; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vAngle = (projectionMat * vec4(aPos,1,1.0)).xyz; \
} \
" , " \
varying highp vec3 vAngle; \
uniform sampler2D uSampler; \
const highp float PI = 3.141592; \
void main(void){ \
	gl_FragColor= texture2D(uSampler \
		,vec2(atan(vAngle.x,-vAngle.z)/PI*0.5 + 0.5 \
		,-atan(vAngle.y,length(vAngle.xz))/PI + 0.5)); \
} \
"

	);
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
}	
var mat44 = new Array(16);
ret.env=function(src){
	var posbuffer = args["aPos"].buffer.jsbuffer;

	posbuffer[0]=-1;
	posbuffer[1]=-1;
	posbuffer[2]=1;
	posbuffer[3]=-1;
	posbuffer[4]=1;
	posbuffer[5]=1;
	posbuffer[6]=-1;
	posbuffer[7]=1;


	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);

	Rastgl.setArg(args["aPos"]);

	var ono3d = Rastgl.ono3d;
	Mat44.copy(mat44,ono3d.viewMatrix);
	mat44[12]=0;
	mat44[13]=0;
	mat44[14]=0;
	Mat44.dot(mat44,ono3d.projectionMat,mat44);
	Mat44.getInv(mat44,mat44);
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(mat44));

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
}
	return ret;
})();

