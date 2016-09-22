"use strict"
//var Envi;
var Env=(function(){
var gl;
var ret= {};

var args;
var program;
var mrrArgs;
var mrrProgram;

ret.init= function(){
	gl = Rastgl.gl;

	program= Rastgl.setShaderProgram(

" \
attribute vec2 aPos; \
varying vec3 vAngle; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = vec4(aPos,1.0,1.0); \
	vAngle = (projectionMat * gl_Position).xyz; \
} \
" , " \
varying highp vec3 vAngle; \
uniform samplerCube uSampler; \
const highp float PI = 3.141592; \
void main(void){ \
	gl_FragColor= textureCube(uSampler,vAngle); \
} \
"
//	gl_FragColor= texture2D(uSampler \
//		,vec2(atan(vAngle.x,-vAngle.z)/PI*0.5 + 0.5 \
//		,-atan(vAngle.y,length(vAngle.xz))/PI + 0.5)); \

	);
	gl.useProgram(program);
	args ={};
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
}	
var mat44 = new Array(16);
ret.env=function(src){
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D,src);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP,src);
	gl.uniform1i(args["uSampler"],0);

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
	gl.vertexAttribPointer(args["aPos"].att, args["aPos"].size,args["aPos"].type, false, 0,0);

	var ono3d = Rastgl.ono3d;
	Mat44.copy(mat44,ono3d.viewMatrix);
	mat44[12]=0;
	mat44[13]=0;
	mat44[14]=0;
	Mat44.dot(mat44,ono3d.projectionMat,mat44);
	Mat44.getInv(mat44,mat44);
	mat44[0]*=-1;
	mat44[4]*=-1;
	mat44[8]*=-1;
	mat44[12]*=-1;
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(mat44));

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
}
//****************　拡散環境マップ作成用   *************************
	var Rough = (function(){
		var ret =function(){};
		var args={};
		var program;
		ret.init= function(){
			gl = Rastgl.gl;
			program= Rastgl.setShaderProgram(

" \
attribute vec2 aPos; \
varying vec3 vAngle; \
varying vec2 vUv; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = vec4(aPos,1.0,1.0); \
	vUv = aPos.xy; \
	vAngle = (projectionMat * gl_Position).xyz; \
	vAngle.y *= -1.0; \
} \
" , " \
varying lowp vec3 vAngle; \n \
varying highp vec2 vUv; \n \
uniform samplerCube uSampler; \n \
uniform samplerCube uDst; \n \
uniform highp float uPow; \n \
uniform lowp float uRough ; \n \
const highp float PI =3.14159265359; \n \
uniform highp float uSeed; \n \
highp float rndcount=uSeed*0.1234; \n \
highp float random(){ \n \
	rndcount = (rndcount+0.123); \n \
	return fract(sin(dot(vUv*rndcount,vec2(12.9898,78.233))) * 43758.5453); \n \
} \n \
highp vec3 randvec(lowp vec3 vecN,lowp vec3 vecS,lowp vec3 vecT,lowp float rand){ \n \
	highp float r=acos(sqrt(1.0-random()*rand)); \n \
	highp float r2=random()*PI*2.0; \n \
	highp float n=cos(r); \n \
	highp float s=sin(r); \n \
	highp float t=s*cos(r2); \n \
	s=s*sin(r2); \n \
 \n \
	return n*vecN + s*vecS + t*vecT; \n \
} \n \
const int MAX = 1; \n \
void main(void){ \n \
	lowp vec3 svec,tvec; \n \
	lowp vec3 vAngle2; \n \
	highp vec3 col; \n \
	highp vec3 col2; \n \
	highp vec3 color = vec3(0.0,0.0,0.0); \n \
	lowp vec3 va = normalize(vAngle); \n \
    if(abs(vAngle.y)<0.75){ \n \
		svec=vec3(vAngle.z/length(vAngle.xz) \n \
		,0.0 \n \
		,-vAngle.x/length(vAngle.xz)); \n \
 \n \
		tvec=vec3(-svec.z*vAngle.y \n \
		,svec.z*vAngle.x-svec.x*vAngle.z \n \
		,svec.x*vAngle.y); \n \
	}else{ \n \
		svec=vec3(0.0 \n \
		,-vAngle.z/length(vAngle.yz) \n \
		,vAngle.y/length(vAngle.yz)); \n \
 \n \
		tvec=vec3(svec.y*vAngle.z-svec.z*vAngle.y \n \
		,svec.z*vAngle.x \n \
		,-svec.y*vAngle.x); \n \
	} \n \
	for(int i=0;i<MAX;i++){ \n \
		vAngle2 = randvec(va,svec,tvec,uRough); \n \
		vAngle2.x *=-1.0; \n \
		col = textureCube(uSampler,vAngle2).rgb; \n \
		col = max(col,(col-0.95)*100.0); \n \
		color = color + col; \n \
	} \n \
	col = color / (float(MAX)); \n \
	col2 = textureCube(uDst,vAngle).rgb; \n \
	col2 = max(col2*2.0,(col2 - 0.5)*10.0+1.0); \n \
	col = mix(col2,col,uPow); \n \
	col = min(col*0.5,col*0.1+0.4); \n \
	gl_FragColor = vec4(col,1.0); \n \
} \n \
"

			);
			gl.useProgram(program);
			args ={};
			args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT);
			args["uSampler"]=gl.getUniformLocation(program,"uSampler");
			args["uDst"]=gl.getUniformLocation(program,"uDst");
			args["uRough"]=gl.getUniformLocation(program,"uRough");
			args["uSeed"]=gl.getUniformLocation(program,"uSeed");
			args["uPow"]=gl.getUniformLocation(program,"uPow");
			args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
		}	
		ret.draw=function(src,rough,dst,x,y,mat,target){
			gl.disable(gl.BLEND);

			gl.useProgram(program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP,src);
			gl.uniform1i(args["uSampler"],0);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP,dst);
			gl.uniform1i(args["uDst"],1);

			gl.uniform1f(args["uRough"],1-Math.cos(rough*Math.PI*0.5));

			gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
			gl.vertexAttribPointer(args["aPos"].att, args["aPos"].size,args["aPos"].type, false, 0,0);
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(mat));

			//gl.enable(gl.BLEND);
			//gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);
			var max =128;
			if(rough==0.0){
				max=1;
			}
			for(var i=0;i<max;i++){
				gl.uniform1f(args["uSeed"],Math.random());
				gl.uniform1f(args["uPow"],1.0/(i+1.0));
				//gl.blendColor(0,0,0,1.0/(1.0+i));
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP,dst);
				gl.copyTexImage2D(target,0,gl.RGBA,0,0,x,y,0);
			}
			
		}
		return ret;
	})();
ret.rough = Rough.draw;
ret.init();
	Rough.init();
	return ret;
})();

