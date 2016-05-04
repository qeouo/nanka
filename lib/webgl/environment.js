"use strict"
var Env=(function(){
var gl;
var ret= function(){};

var args;
var program;
var mrrArgs;
var mrrProgram;

ret.init= function(){
	Rough.init();
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
	args =[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	mrrProgram = Rastgl.setShaderProgram(
" \
precision mediump float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec4 aColor; \
varying vec3 vNormal; \
varying vec3 vAngle; \
varying vec4 vColor; \
uniform mat4 projectionMat; \
uniform vec3 anglePos; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vAngle = aPos - anglePos ; \
	vNormal= aNormal; \
	vColor= aColor; \
} " ," \
precision mediump float; \
varying vec3 vNormal; \
varying vec3 vAngle; \
varying vec4 vColor; \
uniform sampler2D uSampler; \
uniform sampler2D uSampler2; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	vec3 nrm= normalize(vNormal); \
	vec3 angle = -dot(vAngle,nrm)*nrm*2.0 + vAngle; \
	gl_FragColor= vColor * texture2D(uSampler \
		,vec2(atan(angle.x,-angle.z)*_PI*0.5 + 0.5 \
		,-atan(angle.y,length(angle.xz))*_PI + 0.5)); \
	gl_FragColor= mix(0.9*vColor * texture2D(uSampler2 \
		,vec2(atan(nrm.x,-nrm.z)*_PI*0.5 + 0.5 \
		,-atan(nrm.y,length(nrm.xz))*_PI + 0.5)),gl_FragColor,vColor.w); \
	gl_FragColor.w=1.0; \
} \
")
	mrrArgs=[];
	mrrArgs["aPos"]=Rastgl.initAtt(mrrProgram,"aPos",3,gl.FLOAT,Rastgl.posGlBuffer);
	mrrArgs["aNormal"]=Rastgl.initAtt(mrrProgram,"aNormal",3,gl.FLOAT,Rastgl.normalGlBuffer);
	mrrArgs["aColor"]=Rastgl.initAtt(mrrProgram,"aColor",4,gl.FLOAT,Rastgl.colorGlBuffer);
	mrrArgs["uSampler"]=gl.getUniformLocation(mrrProgram,"uSampler");
	mrrArgs["uSampler2"]=gl.getUniformLocation(mrrProgram,"uSampler2");
	mrrArgs["anglePos"]=gl.getUniformLocation(mrrProgram,"anglePos");
	mrrArgs["projectionMat"]=gl.getUniformLocation(mrrProgram,"projectionMat");
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
//mirror shader
ret.drawMrr=function(ono3d,texes,camerap){
	var faceflg=Rastgl.faceflg;
	var renderface
	var posindex=0;
	var colorindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var index;
	var args=mrrArgs;
	var posbuffer=args['aPos'].buffer.jsbuffer;
	var normalbuffer=args['aNormal'].buffer.jsbuffer;
	var colorbuffer=args['aColor'].buffer.jsbuffer;

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	gl.useProgram(mrrProgram);
	gl.cullFace(gl.BACK);
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
	var fa =new Float32Array(3);
	fa[0] = camerap[0];
	fa[1] = camerap[1];
	fa[2] = camerap[2];
	gl.uniform3fv(args["anglePos"],fa);

	for(var i=0;i<facessize;i++){
		if(faces[i].mrr>0){
			faceflg[i]=false;
		}else{
			faceflg[i]=true;
		}
	}
	var flg=0;
	var tex;
	for(var j=0;j<texes.length/2.0;j++){
		tex=texes[j*2];
		var sss;
		if(j*2+1==texes.length){
			sss=100;
		}else{
			sss=texes[j*2+1];
		}

		flg=false;
		colorindex=0;
		posindex=0;
		index=0;
	for(var i=0;i<facessize;i++){
		if(faceflg[i])continue;
		renderface=faces[i];
		if(renderface.rough>=sss)continue;
		if(renderface.mrr<=0.0)continue;
	//	if(!flg){
	//		tex=renderface.texture;
	//	}else{
	//		if(renderface.texture !== tex)continue;
	//	}
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			faceflg[i]=true;
			flg=true;
			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
			var nx = renderface.normal[0] * (1-smoothing);
			var ny = renderface.normal[1] * (1-smoothing);
			var nz = renderface.normal[2] * (1-smoothing);

			var vertex=vertices[0];
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[1]
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[2]
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz

			posindex+=3;

			colorbuffer[colorindex+0] = 1.0;
			colorbuffer[colorindex+1] = 1.0;
			colorbuffer[colorindex+2] = 1.0;
			colorbuffer[colorindex+3] = renderface.mrr;
			colorbuffer[colorindex+4] = 1.0;
			colorbuffer[colorindex+5] = 1.0;
			colorbuffer[colorindex+6] = 1.0;
			colorbuffer[colorindex+7] = renderface.mrr;
			colorbuffer[colorindex+8] = 1.0;
			colorbuffer[colorindex+9] = 1.0;
			colorbuffer[colorindex+10] = 1.0;
			colorbuffer[colorindex+11] = renderface.mrr;
			colorindex+=12;

			index+=3;
		}
		}
		//if(!flg)break;
		if(index==0)continue;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.uniform1i(args["uSampler"],0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D,texes[texes.length-1]);
		gl.uniform1i(args["uSampler2"],1);
			
		Rastgl.setArg(args["aPos"]);
		Rastgl.setArg(args["aNormal"]);
		Rastgl.setArg(args["aColor"]);

		Rastgl.stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawArrays(gl.TRIANGLES, 0, index);
		});
	
	}
}
	var Rough = (function(){
		var ret =function(){};
		var args={};
		var program;
		ret.init= function(){
			gl = Rastgl.gl;

			program= Rastgl.setShaderProgram(

" \
precision mediump float; \
attribute vec2 aPos; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv= aPos*0.5 + vec2(0.5,0.5); \
} \
" , " \
precision mediump float; \
varying vec2 vUv; \
uniform sampler2D uSampler; \
uniform float uRough ; \
const float PI =3.14159265359; \
lowp float rndcount=0.0; \
float random(){ \
	rndcount = (rndcount+0.00000123); \
    return fract(sin(dot(gl_FragCoord.xy*rndcount,vec2(12.9898,78.233))) * 43758.5453); \
} \
vec3 randvec(vec3 dst,float rand){ \
	vec3 v; \
	float r=acos(sqrt(1.0-random()*rand)); \
	float r2=random()*PI*2.0; \
	float sx,sy,sz,tx,ty,tz; \
	float n=cos(r); \
	float s=sin(r); \
	float t=s*cos(r2); \
	s=s*sin(r2); \
 \
    if(dst.y*dst.y<0.25){ \
		sx=dst.z/length(dst.xz); \
		sy=0.0; \
		sz=-dst.x/length(dst.xz); \
 \
		tx=-sz*dst.y; \
		ty=sz*dst.x-sx*dst.z; \
		tz=sx*dst.y; \
	}else{ \
		sx=0.0; \
		sy=-dst.z/length(dst.yz); \
		sz=dst.y/length(dst.yz); \
 \
		tx=sy*dst.z-sz*dst.y; \
		ty=sz*dst.x; \
		tz=-sy*dst.x; \
	} \
	v.x=n*dst.x + s*sx + t*tx; \
	v.y=n*dst.y + s*sy + t*ty; \
	v.z=n*dst.z + s*sz + t*tz; \
	return v; \
} \
const int MAX = 128; \
void main(void){ \
	vec3 vAngle; \
	vec3 vAngle2; \
	highp vec4 color = vec4(0.0,0.0,0.0,0.0); \
	vAngle[1]=-sin((vUv[1]-0.5)*PI); \
	float l=sqrt(1.0-vAngle[1]*vAngle[1]); \
	float r=-vUv[0]*PI*2.0; \
	vAngle[0]=sin(r)*l; \
	vAngle[2]=cos(r)*l; \
	for(int i=0;i<MAX;i++){ \
		vAngle2 = randvec(vAngle,uRough); \
		color = color +texture2D(uSampler \
			,vec2(atan(vAngle2.x,-vAngle2.z)/PI*0.5 + 0.5 \
			,-atan(vAngle2.y,length(vAngle2.xz))/PI + 0.5)); \
	} \
	gl_FragColor = color / float(MAX); \
} \
"

			);
			args =[];
			args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
			args["uSampler"]=gl.getUniformLocation(program,"uSampler");
			args["uRough"]=gl.getUniformLocation(program,"uRough");
		}	
		ret.draw=function(src,rough){
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
			gl.uniform1f(args["uRough"],1-Math.cos(rough*Math.PI*0.5));

			Rastgl.setArg(args["aPos"]);

			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			
		}
		return ret;
	})();
ret.rough = Rough.draw;
	return ret;
})();

