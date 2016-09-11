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
	gl.bindTexture(gl.TEXTURE_2D,src);
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
precision lowp float; \
attribute vec2 aPos; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv= aPos*0.5 + vec2(0.5,0.5); \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
uniform sampler2D uSampler; \
uniform sampler2D uDst; \
uniform float uPow; \
uniform float uRough ; \
const float PI =3.14159265359; \
uniform float uSeed; \
highp float rndcount=uSeed; \
float random(){ \
	rndcount = (rndcount+0.00123); \
    return fract(sin(dot(vUv*rndcount,vec2(12.9898,78.233))) * 43758.5453); \
} \
vec3 randvec(vec3 vecN,vec3 vecS,vec3 vecT,float rand){ \
	vec3 v; \
	float r=acos(sqrt(1.0-random()*rand)); \
	float r2=random()*PI*2.0; \
	float n=cos(r); \
	float s=sin(r); \
	float t=s*cos(r2); \
	s=s*sin(r2); \
 \
	return n*vecN + s*vecS + t*vecT; \
} \
const int MAX = 1; \
void main(void){ \
	vec3 vAngle,svec,tvec; \
	vec3 vAngle2; \
	highp vec4 col; \
	highp vec4 col2; \
	highp vec4 color = vec4(0.0,0.0,0.0,0.0); \
	vAngle[1]=-sin((vUv[1]-0.5)*PI); \
	float l=sqrt(1.0-vAngle[1]*vAngle[1]); \
	float r=-vUv[0]*PI*2.0; \
	vAngle[0]=sin(r)*l; \
	vAngle[2]=cos(r)*l; \
    if(abs(vUv[1])<0.75){ \
		svec=vec3(vAngle.z/length(vAngle.xz) \
		,0.0 \
		,-vAngle.x/length(vAngle.xz)); \
 \
		tvec=vec3(-svec.z*vAngle.y \
		,svec.z*vAngle.x-svec.x*vAngle.z \
		,svec.x*vAngle.y); \
	}else{ \
		svec=vec3(0.0 \
		,-vAngle.z/length(vAngle.yz) \
		,vAngle.y/length(vAngle.yz)); \
 \
		tvec=vec3(svec.y*vAngle.z-svec.z*vAngle.y \
		,svec.z*vAngle.x \
		,-svec.y*vAngle.x); \
	} \
	for(int i=0;i<MAX;i++){ \
		vAngle2 = randvec(vAngle,svec,tvec,uRough); \
		col = texture2D(uSampler \
			,vec2(atan(vAngle2.x,-vAngle2.z)/PI*0.5 + 0.5 \
			,-atan(vAngle2.y,length(vAngle2.xz))/PI + 0.5)); \
		col.r = max(col.r*2.0,col.r*10.0-4.0); \
		col.g = max(col.g*2.0,col.g*10.0-4.0); \
		col.b = max(col.b*2.0,col.b*10.0-4.0); \
		color = color + col; \
	} \
	col = color / (float(MAX)); \
	col2 = texture2D(uDst,vUv); \
	col2.r = max(col2.r*2.0,col2.r*10.0-4.0); \
	col2.g = max(col2.g*2.0,col2.g*10.0-4.0); \
	col2.b = max(col2.b*2.0,col2.b*10.0-4.0); \
	col = mix(col2,col,uPow); \
	gl_FragColor.r = min(col.r*0.5,col.r*0.1+0.4); \
	gl_FragColor.g = min(col.g*0.5,col.g*0.1+0.4); \
	gl_FragColor.b = min(col.b*0.5,col.b*0.1+0.4); \
	gl_FragColor.a = color.a; \
} \
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
		}	
		ret.draw=function(src,rough,dst,x,y){
			gl.disable(gl.BLEND);

			gl.useProgram(program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,src);
			gl.uniform1i(args["uSampler"],0);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D,dst);
			gl.uniform1i(args["uDst"],1);

			gl.uniform1f(args["uRough"],1-Math.cos(rough*Math.PI*0.5));

			gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
			gl.vertexAttribPointer(args["aPos"].att, args["aPos"].size,args["aPos"].type, false, 0,0);

			//gl.enable(gl.BLEND);
			//gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);
			for(var i=0;i<128;i++){
				gl.uniform1f(args["uSeed"],Math.random());
				gl.uniform1f(args["uPow"],1.0/(i+1.0));
				//gl.blendColor(0,0,0,1.0/(1.0+i));
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
				gl.bindTexture(gl.TEXTURE_2D,dst);
				gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,x,y,0);
			}
			
		}
		return ret;
	})();
ret.rough = Rough.draw;
ret.init();
	Rough.init();
	return ret;
})();

