"use strict"
var Env=(function(){
var gl;
var ret= function(){};

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
	args =[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",2,gl.FLOAT,Rastgl.posGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	mrrProgram = Rastgl.setShaderProgram(
" \
precision mediump float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
varying vec3 vNormal; \
varying vec3 vAngle; \
uniform mat4 projectionMat; \
uniform vec3 anglePos; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vAngle = aPos - anglePos ; \
	vNormal= aNormal; \
} " ," \
precision mediump float; \
varying vec3 vNormal; \
varying vec3 vAngle; \
uniform sampler2D uSampler; \
uniform vec4 uColor; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	vec3 nrm= normalize(vNormal); \
	vec3 angle = dot(vAngle,nrm)*nrm*2.0 + vAngle; \
	gl_FragColor= uColor * texture2D(uSampler \
		,vec2(atan(angle.x,-angle.z)*_PI*0.5 + 0.5 \
		,-atan(angle.y,length(angle.xz))*_PI + 0.5)); \
} \
")
	mrrArgs=[];
	mrrArgs["aPos"]=Rastgl.initAtt(mrrProgram,"aPos",3,gl.FLOAT,Rastgl.posGlBuffer);
	mrrArgs["aNormal"]=Rastgl.initAtt(mrrProgram,"aNormal",3,gl.FLOAT,Rastgl.normalGlBuffer);
	mrrArgs["uSampler"]=gl.getUniformLocation(mrrProgram,"uSampler");
	mrrArgs["anglePos"]=gl.getUniformLocation(mrrProgram,"anglePos");
	mrrArgs["projectionMat"]=gl.getUniformLocation(mrrProgram,"projectionMat");
	mrrArgs["uColor"]=gl.getUniformLocation(mrrProgram,"uColor");
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
ret.drawMrr=function(ono3d,tex){
	var renderface
	var posindex=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var index;
	var args=mrrArgs;
	var posbuffer=args['aPos'].buffer.jsbuffer;
	var normalbuffer=args['aNormal'].buffer.jsbuffer;

	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	gl.useProgram(mrrProgram);
	gl.cullFace(gl.BACK);
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
	var fa =new Float32Array(3);
	fa = ono3d.viewMatrix[12];
	fa = ono3d.viewMatrix[13];
	fa = ono3d.viewMatrix[14];
	gl.uniform3fv(args["anglePos"],false,fa);
	var color=new Float32Array(4);
	color[0] = 1.0;
	color[1] = 1.0;
	color[2] = 1.0;
	color[3] = 1.0;
	gl.uniform4fv(args["uColor"],false,color);

	for(var i=0;i<facessize;i++){
		if(faces[i].mrr>0){
			faceflg[i]=false;
		}else{
			faceflg[i]=true;
		}
	}
	var flg=0;
	var tex=null;
	while(1){
		flg=false;
		colorindex=0;
		uvindex=0;
		posindex=0;
		index=0;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(faceflg[i])continue;
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

			index+=3;
		}
		}
		if(!flg)break;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.uniform1i(args["uSampler"],0);
			
		Rastgl.setArg(args.aPos);
		Rastgl.setArg(args.aNormal);

		Rastgl.stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
		});
	
	}
}
	return ret;
})();

