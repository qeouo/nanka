"use strict"
var Color=(function(){
var gl;
var ret= function(){};

var args;
var program;

ret.init= function(){
	gl = Rastgl.gl;

	program = Rastgl.setShaderProgram(
" \
precision mediump float; \
attribute vec3 aPos; \
attribute vec4 aColor; \
attribute vec2 aUv; \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vColor = aColor; \
	vUv = aUv; \
} \
" , " \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
uniform sampler2D uSampler; \
uniform int uTex; \
void main(void){ \
	gl_FragColor = mix( \
		vColor \
		,vColor * texture2D(uSampler,vec2(vUv.s,vUv.t)) \
		,float(uTex)); \
} \
 ");

	args=[];
	gl.useProgram(program);
	args["projectionMat"]=gl.getUniformLocation(program,"projectionMat");
	args["lightMat"]=gl.getUniformLocation(program,"lightMat");
	args["aPos"]=Rastgl.initAtt(program,"aPos",3,gl.FLOAT,Rastgl.posGlBuffer);
	args["aUv"]=Rastgl.initAtt(program,"aUv",2,gl.FLOAT,Rastgl.uvGlBuffer);
	args["aColor"]=Rastgl.initAtt(program,"aColor",4,gl.FLOAT,Rastgl.colorGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uTex"]=gl.getUniformLocation(program,"uTex");
}

ret.draw=function(ono3d){
	var renderface
	var posindex=0;
	var index=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var faceflg = Rastgl.faceflg;

	var posbuffer=args["aPos"].buffer.jsbuffer;
	var colorbuffer=args["aColor"].buffer.jsbuffer;
	var uvbuffer=args["aUv"].buffer.jsbuffer;

	gl.useProgram(program);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.DST_COLOR,gl.ZERO);
	gl.cullFace(gl.BACK);
	for(var i=0;i<facessize;i++){
		faceflg[i]=false;
	}
	var tex;
	while(1){
		colorindex=0;
		uvindex=0;
		posindex=0;
		index=0;
		tex=null;
		for(var i=0;i<facessize;i++){
			if(faceflg[i])continue;
			renderface=faces[i];
			if(renderface.operator == Ono3d.OP_TRIANGLES){
				if(tex){
					if(renderface.texture !== tex)continue;
				}else{
					tex=renderface.texture;
				}
				faceflg[i]=true;
				var smoothing=renderface.smoothing
				var vertices = renderface.vertices;
				var nx = renderface.normal[0] * (1-smoothing);
				var ny = renderface.normal[1] * (1-smoothing);
				var nz = renderface.normal[2] * (1-smoothing);
				var r=renderface.r;
				var g=renderface.g;
				var b=renderface.b;
				var a=renderface.a;
				var vertex=vertices[0];
				posbuffer[posindex]=vertex.pos[0]
				posbuffer[posindex+1]=vertex.pos[1]
				posbuffer[posindex+2]=vertex.pos[2]
				colorbuffer[colorindex]=r;
				colorbuffer[colorindex+1]=g;
				colorbuffer[colorindex+2]=b;
				colorbuffer[colorindex+3]=a;;
				posindex+=3;
				colorindex+=4;

				vertex=vertices[1]
				posbuffer[posindex]=vertex.pos[0]
				posbuffer[posindex+1]=vertex.pos[1]
				posbuffer[posindex+2]=vertex.pos[2]
				colorbuffer[colorindex]=r;
				colorbuffer[colorindex+1]=g;
				colorbuffer[colorindex+2]=b;
				colorbuffer[colorindex+3]=a;;
				posindex+=3;
				colorindex+=4;

				vertex=vertices[2]
				posbuffer[posindex]=vertex.pos[0]
				posbuffer[posindex+1]=vertex.pos[1]
				posbuffer[posindex+2]=vertex.pos[2]
				colorbuffer[colorindex]=r;
				colorbuffer[colorindex+1]=g;
				colorbuffer[colorindex+2]=b;
				colorbuffer[colorindex+3]=a;;

				if(renderface.texture){
					uvbuffer[uvindex]=renderface.uv[0][0]
					uvbuffer[uvindex+1]=renderface.uv[0][1]
					uvbuffer[uvindex+2]=renderface.uv[1][0]
					uvbuffer[uvindex+3]=renderface.uv[1][1]
					uvbuffer[uvindex+4]=renderface.uv[2][0]
					uvbuffer[uvindex+5]=renderface.uv[2][1]
				}
				posindex+=3;
				colorindex+=4;
				uvindex+=6;
				index+=3;
			}
		}
		if(index==0)break;
		if(tex){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,tex.gltexture);
			gl.uniform1i(args["uSampler"],0);
			gl.uniform1i(args["uTex"],1);
		}else{
			gl.uniform1i(args["uTex"],0);
			//gl.activeTexture(gl.TEXTURE0);
		}
			
		Rastgl.setArg(args["aPos"],posbuffer);
		Rastgl.setArg(args["aColor"],colorbuffer);
		Rastgl.setArg(args["aUv"],uvbuffer);

		Rastgl.stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawArrays(gl.TRIANGLES, 0, index);
		});
	}
}
	ret.init();
	return ret;
})();
