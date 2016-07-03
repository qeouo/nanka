"use strict"
var plainShader;
var edgeShader;
var mainShader;
var Rastgl= (function(){
	var ret=function(){}
	var i;
	var OP_DOT=i=1
		,OP_LINE=++i
		,OP_LINES=++i
		,OP_TRIANGLES=++i
		,OP_POLYGON=++i
		,OP_POINT=++i
		,OP_LINELOOP=++i
		,RF_SHADE=1<<(i=0)
		,RF_SMOOTH=1<<(++i)
		,RF_TOON=1<<(++i)
		,RF_LINE=1<<(++i)
		,RF_TEXTURE=1<<(++i)
		,RF_OUTLINE=1<<(++i)
		,RF_ENVMAP=1<<(++i)
		,RF_DOUBLE_SIDED = 1<<(++i)
		,RF_DEPTHTEST = 1<<(++i)
		,RF_PERSCOLLECT = 1<<(++i)
		,RF_PHONGSHADING= 1<<(++i)

		,LT_DIRECTION=i=1
		,LT_AMBIENT=++i
	;
	ret.LT_DIRECTION=LT_DIRECTION;
	ret.LT_AMBIENT=LT_AMBIENT;

	var bV0 = new Vec3()
	,bV1=new Vec3()
	,bV2=new Vec3()
	,bM=new Array(16)
	;
var VERTEX_MAX=4096;

var gl;
var ono3d;
var renderBuffer;
var frameBuffer;
var fTexture;
var fTexture2;
var normal= new Float32Array(3*3);
var calcLighting;
var calcSpc;


var idxGlBuffer;
var posGlBuffer;
var colorGlBuffer;
var normalGlBuffer;
var uvGlBuffer;
var emiGlBuffer;
var floatGlBuffer;

var faceflg = ret.faceflg=new Array(4096);

var uniSampler;
var uniEnvSampler;
var uniEnv;
var uniFlg;
var uniLight;
var uniAmb;
var uniPersW;
var uniPersH;
var uniNrmSampler;
var uniMatT;
var uniNrmMap;
var uniSpc;
var uniSpca;

var pointVs=" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec4 aColor; \
varying vec3 vNormal; \
varying vec4 vColor; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vNormal= aNormal; \
	vColor = aColor; \
	gl_PointSize = 10.; \
} \
";
var pointFs=" \
varying lowp vec4 vColor; \
varying lowp vec3 vNormal; \
uniform lowp vec4 uColor; \
void main(void){ \
	gl_FragColor = vColor; \
} \
";
var pointProgram;
var pointArgs=new Array();
var createPointShader= function(){

	var program= setShaderProgram(pointVs,pointFs);
	var args=[];

	args["aPos"]=initAtt(program,"aPos",3,gl.FLOAT,posGlBuffer);
	//args["aNormal"]=initAtt(program,"aNormal",3,gl.FLOAT,normalGlBuffer);
	args["aColor"]=initAtt(program,"aColor",4,gl.FLOAT,colorGlBuffer);
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	pointProgram=program;
	pointArgs=args;
}	

var stereoDraw=ret.stereoDraw = function(ono3d,func){
	var HEIGHT=480,WIDTH=360;
	var p=1.0;
	var q=(1-p)*0.5;
	var stereo;

	if(globalParam.stereomode==0){
		globalParam.gl.viewport(0,0,WIDTH*2,HEIGHT);
		ono3d.setPers(0.577,HEIGHT/(WIDTH*2))
//		ono3d.projectionMat[8]=0//stereo/10;
//		ono3d.projectionMat[12]=stereo;
		Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,ono3d.viewMatrix);
		func();
	}else{
		globalParam.gl.viewport(WIDTH*q,HEIGHT*q,WIDTH*p,HEIGHT*p);
		stereo=globalParam.stereo;
		ono3d.setPers(0.577,HEIGHT/WIDTH)
		ono3d.projectionMat[8]=0//stereo/10;
		ono3d.projectionMat[12]=stereo;
		Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,ono3d.viewMatrix);
		func();


		stereo=-globalParam.stereo;
		ono3d.setPers(0.577,HEIGHT/WIDTH)
		ono3d.projectionMat[8]=0//stereo/10;
		ono3d.projectionMat[12]=stereo;
		Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,ono3d.viewMatrix);
		globalParam.gl.viewport(WIDTH+WIDTH*q,HEIGHT*q,WIDTH*p,HEIGHT*p);
		func();
	}
}

var drawPoint=function(ono3d){
	var faceindex=0;
	var renderface;
	var vertexindex=0;
	var posindex=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;

	gl.useProgram(pointProgram);
	gl.cullFace(gl.BACK);
	var j=0;
	var vertex;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(renderface.operator == Ono3d.OP_POINT){
			vertex=vertices[renderface.vertices[0].idx];
			posbuffer[j*3]=vertex.pos[0]
			posbuffer[j*3+1]=vertex.pos[1]
			posbuffer[j*3+2]=vertex.pos[2]
			colorbuffer[j*4]=renderface.r;
			colorbuffer[j*4+1]=renderface.g;
			colorbuffer[j*4+2]=renderface.b;
			colorbuffer[j*4+3]=renderface.a;
			normalbuffer[j*3]=vertex.normal[0] 
			normalbuffer[j*3+1]=vertex.normal[1]
			normalbuffer[j*3+2]=vertex.normal[2]
			j+=1;
		}
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, pointArgs["aPos"].buffer);
	gl.vertexAttribPointer(pointArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, pointArgs["aColor"].buffer);
	gl.vertexAttribPointer(pointArgs["aColor"].att, 4,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, colorbuffer, gl.STATIC_DRAW);

//	gl.bindBuffer(gl.ARRAY_BUFFER, pointArgs["aNormal"].buffer);
//	gl.vertexAttribPointer(pointArgs["aNormal"].att, 3,gl.FLOAT , false, 0, 0);
//	gl.bufferData(gl.ARRAY_BUFFER, normalbuffer, gl.STATIC_DRAW);

	gl.drawArrays(gl.POINTS,0, j);
	
}

var edge_createShader= function(){

	var program= setShaderProgram( " \
precision mediump float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
uniform mat4 projectionMat; \
void main(void){ \
	lowp vec3 p = aPos + aNormal*0.05 ; \
	gl_Position = projectionMat * vec4(p,1.0); \
}","  \
precision mediump float; \
varying lowp vec4 vColor; \
uniform lowp vec4 uColor; \
void main(void){ \
	gl_FragColor = uColor; \
} ");
	var args=[];

	gl.useProgram(program);
	args["idx"]=createElementBuffer();
	args["aPos"]=initAtt(program,"aPos",3,gl.FLOAT,posGlBuffer);
	args["aNormal"]=initAtt(program,"aNormal",3,gl.FLOAT,normalGlBuffer);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	var shader={};

	shader.draw=function(ono3d){
		var faceindex=0;
		var renderface;
		var vertexindex=0;
		var posindex=0;
		var colorindex=0;
		var uvindex=0;
		var faces=ono3d.renderFaces;
		var facessize=ono3d.renderFaces_index;
		var vertices=ono3d.renderVertices;
		var verticessize=ono3d.renderVertices_index;
		var idxbuffer=idxGlBuffer.jsbuffer;
		var posbuffer=posGlBuffer.jsbuffer;
		var normalbuffer=normalGlBuffer.jsbuffer;

		gl.useProgram(program);
		gl.cullFace(gl.FRONT);
		for(var i=0;i<facessize;i++){
			renderface=faces[i];
			if(renderface.operator == Ono3d.OP_TRIANGLES){
				idxbuffer[faceindex]=renderface.vertices[0].idx;
				idxbuffer[faceindex+1]=renderface.vertices[1].idx;
				idxbuffer[faceindex+2]=renderface.vertices[2].idx;
				faceindex+=3;
			}
		}
		var vertex;
		for(var i=0;i<verticessize;i++){
			vertex=vertices[i]
			posbuffer[i*3]=vertex.pos[0]
			posbuffer[i*3+1]=vertex.pos[1]
			posbuffer[i*3+2]=vertex.pos[2]
			normalbuffer[i*3]=vertex.normal[0] 
			normalbuffer[i*3+1]=vertex.normal[1]
			normalbuffer[i*3+2]=vertex.normal[2]
		}
			
		setArg(args["aPos"]);
		setArg(args["aNormal"]);

		gl.uniform4f(args["uColor"],0,0,0,1);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxGlBuffer.glbuffer);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idxGlBuffer.jsbuffer);

		stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawElements(gl.TRIANGLES, faceindex, gl.UNSIGNED_SHORT, 0);
		});
		
	}
	return shader;
}

//plainShader
var createPlainShader = function(){
	var shader={};

	var program= setShaderProgram(" \
attribute vec3 aPos; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	gl_Position = vec4(gl_Position.xy,gl_Position.z*0.9997,gl_Position.w); \
} ","  \
uniform lowp vec4 uColor; \
void main(void){ \
	gl_FragColor = uColor; \
} ");
	var args=[];
	args["idx"]=createElementBuffer();
	args["aPos"]=initAtt(program,"aPos",3,gl.FLOAT,posGlBuffer);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	shader.draw=function(ono3d){
	gl.enable(gl.DEPTH_TEST);
		var faceindex=0;
		var renderface;
		var faces=ono3d.renderFaces;
		var facessize=ono3d.renderFaces_index;
		var vertices=ono3d.renderVertices;
		var verticessize=ono3d.renderVertices_index;
		var posbuffer=posGlBuffer.jsbuffer;
		var idxbuffer=idxGlBuffer.jsbuffer;
		if(!globalParam.windows){
			gl.lineWidth(ono3d.lineWidth);
		}
		gl.useProgram(program);
		gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
		for(var i=0;i<facessize;i++){
			renderface=faces[i];
			if(renderface.operator == Ono3d.OP_LINE){
				idxbuffer[faceindex]=renderface.vertices[0].idx;
				idxbuffer[faceindex+1]=renderface.vertices[1].idx;
				faceindex+=2;
			}
		}
		var vertex;
		for(var i=0;i<verticessize;i++){
			vertex=vertices[i]
			posbuffer[i*3]=vertex.pos[0]
			posbuffer[i*3+1]=vertex.pos[1]
			posbuffer[i*3+2]=vertex.pos[2]
		}
			
		setArg(args["aPos"]);

		gl.uniform4f(args["uColor"]
			,ono3d.outlineColor[0],ono3d.outlineColor[1],ono3d.outlineColor[2],1);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxGlBuffer.glbuffer);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idxGlBuffer.jsbuffer);
		
		stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawElements(gl.LINES, faceindex, gl.UNSIGNED_SHORT, 0);
		//	gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
		});
	}
	return shader;
}



var setArg = ret.setArg = function(arg,buffer,flg){
	gl.bindBuffer(gl.ARRAY_BUFFER, arg.buffer.glbuffer);
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false, 0, arg.offset);
	if(flg)return;
	if(buffer){
	gl.bufferSubData(gl.ARRAY_BUFFER, arg.offset, buffer);
	}else{
	gl.bufferSubData(gl.ARRAY_BUFFER, arg.offset, arg.buffer.jsbuffer);
	}
}

var ttt=false;
var NUVec=new Vec3()
	,NVVec=new Vec3()
		,NTVec=new Vec3()
var setShaderProgram = ret.setShaderProgram = function(vs,fs){
  // Vertex shader
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vshader, vs);
  gl.compileShader(vshader);
  if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)){
    alert(gl.getShaderInfoLog(vshader));
    return null;
  }

  // Fragment shader
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fshader, fs);
  gl.compileShader(fshader);
  if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
    alert(gl.getShaderInfoLog(fshader));
    return null;
  }
  // Create shader program
  var program = gl.createProgram();
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    alert(gl.getProgramInfoLog(program));
    return null;
  }
	gl.useProgram(program);

  return program;
}
var createArrayBuffer= function(target,size){
	var buffer={};
	var glbuffer;
	var jsbuffer;
	glbuffer=gl.createBuffer();
	gl.bindBuffer(target, glbuffer);
	if(target==gl.ARRAY_BUFFER){
		jsbuffer=new Float32Array(size);
	}else{
		jsbuffer=new Int16Array(size);
	}
	gl.bufferData(target, jsbuffer, gl.STATIC_DRAW);
	buffer.glbuffer=glbuffer;
	buffer.jsbuffer=jsbuffer;
	buffer.target=target;
	buffer.size=size;
	return buffer;
}
var initAtt=ret.initAtt = function(program,attName,size,type,buffer,offset){
	if(offset==null)offset=0;
	var arg={};
	arg.att = gl.getAttribLocation(program,attName); 
	arg.size=size;
	arg.type=type;
	arg.offset=offset;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glbuffer);
	gl.enableVertexAttribArray(arg.att);
	gl.vertexAttribPointer(arg.att, arg.size,arg.type , false, 0, arg.offset);
	arg.buffer=buffer;

  return arg;
}
var createElementBuffer=ret.createElementBuffer=function(){
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  return buffer;
}


//paste shader
var paste={};
var createPaste= function(){
var vs=" \
attribute vec2 aPos; \
attribute vec2 aUv; \
varying vec2 vUv; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vUv = aUv; \
} \
";
var fs=" \
varying highp vec2 vUv; \
uniform sampler2D uSampler; \
void main(void){ \
	gl_FragColor= texture2D(uSampler,vec2(vUv.s,vUv.t)); \
} \
";
	var program= setShaderProgram(vs,fs);
	var args=[];
	args["aPos"]=initAtt(program,"aPos",2,gl.FLOAT,posGlBuffer);
	args["aUv"]=initAtt(program,"aUv",2,gl.FLOAT,uvGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	paste.program=program;
	paste.args=args;
}	
var copyframe = ret.copyframe =function(src,x,y,w,h){
	var posbuffer=posGlBuffer.jsbuffer;
	var uvbuffer=uvGlBuffer.jsbuffer;
	var args=paste.args;
	gl.disable(gl.DEPTH_TEST);

	posbuffer[0]=-1;
	posbuffer[1]=-1;
	posbuffer[2]=1;
	posbuffer[3]=-1;
	posbuffer[4]=1;
	posbuffer[5]=1;
	posbuffer[6]=-1;
	posbuffer[7]=1;

	uvbuffer[0]=x;
	uvbuffer[1]=y//*480/1024;
	uvbuffer[2]=x+w//*720/1024;
	uvbuffer[3]=y//*480/1024;
	uvbuffer[4]=x+w//*720/1024;
	uvbuffer[5]=y+h;
	uvbuffer[6]=x;
	uvbuffer[7]=y+h;

	gl.useProgram(paste.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);
			
	setArg(args.aPos);
	setArg(args.aUv);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	
}
ret.framebuffer=function(ono3d){
	gl.viewport(0,0,720,480);
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE);
	gl.blendColor(0,0,0,0.7);
	copyframe(fTexture2,0,0,720/1024,480/1024);
	gl.disable(gl.BLEND);
	gl.bindTexture(gl.TEXTURE_2D, fTexture2);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);

	Gauss.filter(frameBuffer,fTexture2,100);
	

}
//emi shader
var emi={};
var createEmi= function(){
	var program= setShaderProgram(
" \
precision mediump float; \
attribute vec3 aPos; \
attribute vec4 aColor; \
attribute vec2 aUv; \
attribute float aEmi; \
varying vec4 vColor; \
varying vec2 vUv; \
varying float vEmi; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vColor = vec4(aColor.xyz,aColor.w); \
	vUv = aUv; \
	vEmi= aEmi; \
} \
"
," \
precision mediump float; \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying float vEmi; \
uniform sampler2D uSampler; \
uniform int uTex; \
void main(void){ \
	vec4 vColor2=vColor; \
	if(uTex==1){ \
		vColor2 = vColor2 * texture2D(uSampler,vec2(vUv.s,vUv.t)); \
	} \
	gl_FragColor = vec4(vColor2.rgb * (vEmi-1.)*0.2,1.) ; \
} \
"
)
	var args=[];
	args["aPos"]=initAtt(program,"aPos",3,gl.FLOAT,posGlBuffer);
	args["aColor"]=initAtt(program,"aColor",4,gl.FLOAT,colorGlBuffer);
	args["aUv"]=initAtt(program,"aUv",2,gl.FLOAT,uvGlBuffer);
	args["aEmi"]=initAtt(program,"aEmi",1,gl.FLOAT,emiGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uTex"]=gl.getUniformLocation(program,"uTex");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	emi.program=program;
	emi.args=args;
}	
ret.flush=function(ono3d){

	plainShader.draw(ono3d);
	MainShader.draw(ono3d);
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

	gl.clearColor(0.0,0.0,0.0 ,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	drawEmi(ono3d);
	//drawPoint(ono3d);



	return;
}
var drawEmi=function(ono3d){
	var renderface
	var posindex=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var index;
	var args=emi.args;
	var posbuffer=posGlBuffer.jsbuffer;
	var uvbuffer=uvGlBuffer.jsbuffer;
	var colorbuffer=colorGlBuffer.jsbuffer;
	var emibuffer=emiGlBuffer.jsbuffer;

	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	gl.useProgram(emi.program);
	gl.cullFace(gl.BACK);
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));

	for(var i=0;i<facessize;i++){
		faceflg[i]=false;
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
		if(renderface.emt<=0)continue;
		if(faceflg[i])continue;
		if(!flg){
			tex=renderface.texture;
		}else{
			if(renderface.texture !== tex)continue;
		}
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			faceflg[i]=true;
			flg=true;
			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
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
//				texture=renderface.texture.gltexture;
			}

			emibuffer[index]=renderface.emt;
			emibuffer[index+1]=renderface.emt;
			emibuffer[index+2]=renderface.emt;

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
			gl.activeTexture(gl.TEXTURE0);
		}
			
		setArg(args.aPos);
		setArg(args.aColor);
		setArg(args.aUv);
		setArg(args.aEmi);
		

		stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
			gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
		});
	
	}
}
ret.drawEmi=function(ono3d){
	drawEmi(ono3d);
}
ret.setTexture= function(image){
	var neheTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}
var createTexture= function(image,x,y){
	var neheTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	if(image){
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}else{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}
ret.createTexture= function(x,y){
	var neheTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}


//shadowmap
var shadowmap=(function(){
	var ret={};
	var program={};
	var args={};
	ret.init= function(){
		program= setShaderProgram(
" \
uniform mat4 projectionMat; \
attribute vec3 aPos; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
} \
"
		,
" \
void main(void){ \
	gl_FragColor= vec4(gl_FragCoord.z,gl_FragCoord.z,gl_FragCoord.z,1.0); \
	if(abs(gl_FragCoord.x-512.)>510. || abs(gl_FragCoord.y-512.)>510.){ \
		gl_FragColor= vec4(1.,1.,1.,1.); \
	} \
} \
"
	);
		args.idx=createElementBuffer();
		args.aPos=initAtt(program,"aPos",3,gl.FLOAT,posGlBuffer);

		args["projectionMat"]=gl.getUniformLocation(program,"projectionMat");
	}	
	ret.render=function(){
		var renderface
		var posindex=0;
		var faces=ono3d.renderFaces;
		var facessize=ono3d.renderFaces_index;
		var vertices=ono3d.renderVertices;
		var verticessize=ono3d.renderVertices_index;
		var faceindex=0;
		var idxbuffer=idxGlBuffer.jsbuffer;
		var posbuffer=posGlBuffer.jsbuffer;

		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.disable(gl.BLEND);
		gl.viewport(0,0,1024,1024);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1., 1., 1.,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if(!globalParam.shadow)return;

		gl.cullFace(gl.BACK);

		var lightSource = ono3d.lightSources[0]
		Mat43.setInit(lightSource.matrix);
		Mat43.getRotVector(lightSource.matrix,lightSource.angle);
		Mat43.setInit(bM);
		bM[12]=-lightSource.pos[0]
		bM[13]=-lightSource.pos[1]
		bM[14]=-lightSource.pos[2]

		Mat43.dot(lightSource.matrix,lightSource.matrix,bM);
		ono3d.setOrtho(10.0,10.0,8.0,40.0)
		Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,lightSource.matrix);
		gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));

		for(var i=0;i<facessize;i++){
			renderface=faces[i];
			if(renderface.operator == Ono3d.OP_TRIANGLES){
				idxbuffer[faceindex]=renderface.vertices[0].idx;
				idxbuffer[faceindex+1]=renderface.vertices[1].idx;
				idxbuffer[faceindex+2]=renderface.vertices[2].idx;
				faceindex+=3;
			}
		}
		var vertex;
		for(var i=0;i<verticessize;i++){
			vertex=vertices[i]
			posbuffer[i*3]=vertex.pos[0]
			posbuffer[i*3+1]=vertex.pos[1]
			posbuffer[i*3+2]=vertex.pos[2]
		}
		setArg(args.aPos);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxGlBuffer.glbuffer);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idxGlBuffer.jsbuffer);

		gl.drawElements(gl.TRIANGLES, faceindex, gl.UNSIGNED_SHORT, 0);
	
	}
	return ret;
})();

	ret.renderShadowmap=function(ono3d){
		shadowmap.render(ono3d);
	}
ret.init=function(_gl,_ono3d){

	ret.gl = gl = _gl;
	ret.ono3d = ono3d = _ono3d;
	try{
		ret.posGlBuffer =posGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX*3);
		ret.colorGlBuffer = colorGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX*4);
		ret.normalGlBuffer =normalGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX*3*3);
		ret.uvGlBuffer = uvGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX*2);
		ret.emiGlBuffer=emiGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX);
		ret.floatGlBuffer =floatGlBuffer=createArrayBuffer(gl.ARRAY_BUFFER,VERTEX_MAX*3);
//		gl.bufferData(gl.ARRAY_BUFFER, emiGlBuffer.jsbuffer, gl.STATIC_DRAW);
		idxGlBuffer=createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER,VERTEX_MAX);


		createPointShader();
		edgeShader=edge_createShader();
		plainShader=createPlainShader();
		createPaste();
		createEmi();
		MainShader.init();
		Gauss.init();
		Env.init();
		Nrm.init();
		shadowmap.init();

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.CULL_FACE);

		calcLighting=Ono3d.calcLighting;
		calcSpc=Ono3d.calcSpc;

		ret.frameBuffer =frameBuffer=gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

		ret.fTexture=fTexture = createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		fTexture2 = createTexture(null,1024,1024);

	}
	catch(e){
		return true;
	}
	return false;

}
var current = (function() {
    if (document.currentScript) {
        return document.currentScript.src;
    } else {
        var scripts = document.getElementsByTagName('script'),
        script = scripts[scripts.length-1];
        if (script.src) {
            return script.src;
        }
    }
})()
current = current.substring(0,current.lastIndexOf('/'));
document.write('<script type="text/javascript" src="' + current + '/webgl/mainshader.js" ></script>');
document.write('<script type="text/javascript" src="' + current + '/webgl/gauss.js" ></script>');
document.write('<script type="text/javascript" src="' + current + '/webgl/environment.js" ></script>');
document.write('<script type="text/javascript" src="' + current + '/webgl/normalmap.js" ></script>');
document.write('<script type="text/javascript" src="' + current + '/webgl/shade.js" ></script>');
document.write('<script type="text/javascript" src="' + current + '/webgl/color.js" ></script>');
	return ret;
})();
