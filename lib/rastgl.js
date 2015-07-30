"use strict"
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

	var bV0 = new Vec3()
	,bV1=new Vec3()
	,bV2=new Vec3()

var renderBuffer;
var frameBuffer;
var fTexture;
var frameBuffer2;
var fTexture2;
var gl;
var idxbuffer=new Int16Array(1024*3);
var colorBuffer =null; 
var posBuffer =null; 
var uvBuffer=null; 
var normal= new Float32Array(3*3);
var normalBuffer=null; 
var calcLighting;
var calcSpc;

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

	args["aPos"]=createBuffer2(program,"aPos",3,gl.FLOAT);
	args["aNormal"]=createBuffer2(program,"aNormal",3,gl.FLOAT);
	args["aColor"]=createBuffer2(program,"aColor",4,gl.FLOAT);
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	pointProgram=program;
	pointArgs=args;
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
	gl.enableVertexAttribArray(pointArgs["aPos"].att);
	gl.vertexAttribPointer(pointArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, pointArgs["aColor"].buffer);
	gl.enableVertexAttribArray(pointArgs["aColor"].att);
	gl.vertexAttribPointer(pointArgs["aColor"].att, 4,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, colorbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, pointArgs["aNormal"].buffer);
	gl.enableVertexAttribArray(pointArgs["aNormal"].att);
	gl.vertexAttribPointer(pointArgs["aNormal"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, normalbuffer, gl.STATIC_DRAW);

	gl.drawArrays(gl.POINTS,0, j);
}

var edge_vs=" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
varying lowp vec3 vNormal; \
uniform mat4 projectionMat; \
void main(void){ \
	lowp vec3 p = aPos + aNormal*0.05 ; \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vNormal= aNormal; \
} \
";
var edge_fs=" \
varying lowp vec4 vColor; \
varying lowp vec3 vNormal; \
uniform lowp vec4 uColor; \
void main(void){ \
	gl_FragColor = uColor; \
} \
";
var edgeProgram;
var edgeArgs=new Array();
var edge_createShader= function(){

	var program= setShaderProgram(edge_vs,edge_fs);
	var args=[];

	gl.useProgram(edgeProgram);
	args["idx"]=createElementBuffer();
	args["aPos"]=createBuffer2(program,"aPos",3,gl.FLOAT);
	args["aNormal"]=createBuffer2(program,"aNormal",3,gl.FLOAT);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));

	edgeProgram=program;
	edgeArgs=args;
}	

var drawEdge=function(ono3d){
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

	gl.useProgram(edgeProgram);
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
		colorbuffer[i*4]=1;
		colorbuffer[i*4+1]=1;
		colorbuffer[i*4+2]=1;
		colorbuffer[i*4+3]=1;
		normalbuffer[i*3]=vertex.normal[0] 
		normalbuffer[i*3+1]=vertex.normal[1]
		normalbuffer[i*3+2]=vertex.normal[2]
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, edgeArgs["aPos"].buffer);
	gl.enableVertexAttribArray(edgeArgs["aPos"].att);
	gl.vertexAttribPointer(edgeArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, edgeArgs["aNormal"].buffer);
	gl.enableVertexAttribArray(edgeArgs["aNormal"].att);
	gl.vertexAttribPointer(edgeArgs["aNormal"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, normalbuffer, gl.STATIC_DRAW);

	gl.uniform4f(edgeArgs["uColor"],0,0,0,1);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeArgs["idx"]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxbuffer, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, faceindex, gl.UNSIGNED_SHORT, 0);
}

//plain shader
var plain_vs=" \
attribute vec3 aPos; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
} \
";
var plain_fs=" \
uniform lowp vec4 uColor; \
void main(void){ \
	gl_FragColor = uColor; \
} \
";
var plainProgram;
var plainArgs;
var plainCreateShader= function(){

	var program= setShaderProgram(plain_vs,plain_fs);
	var args=[];
	args["idx"]=createElementBuffer();
	args["aPos"]=createBuffer2(program,"aPos",3,gl.FLOAT);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	plainProgram=program;
	plainArgs=args;
}	

var drawLine=function(ono3d){
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

	gl.lineWidth(ono3d.lineWidth);
	gl.useProgram(plainProgram);
	gl.uniformMatrix4fv(plainArgs["projectionMat"],false,new Float32Array(ono3d.projectionMat));
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
		
	gl.bindBuffer(gl.ARRAY_BUFFER, plainArgs["aPos"].buffer);
	gl.enableVertexAttribArray(plainArgs["aPos"].att);
	gl.vertexAttribPointer(plainArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.uniform4f(plainArgs["uColor"]
		,ono3d.outlineColor[0],ono3d.outlineColor[1],ono3d.outlineColor[2],1);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plainArgs["idx"]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxbuffer, gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, faceindex, gl.UNSIGNED_SHORT, 0);



}


var main_vs=" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec4 aColor; \
attribute vec2 aUv; \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vEye; \
varying lowp float vFar; \
uniform mat4 projectionMat; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vFar =1.-(aPos.z-3000.0)/1000.; \
	vColor = vec4(aColor.xyz,aColor.w); \
	vNormal= aNormal; \
	vUv = aUv; \
} \
";
var fragment_vs=" \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vEye; \
varying lowp float vFar; \
uniform sampler2D uSampler; \
uniform int uTex; \
uniform lowp vec3 uLight; \
uniform lowp vec3 uLightColor; \
uniform lowp float uAmb; \
uniform lowp vec3 uAmbColor; \
uniform lowp float lightThreshold1; \
uniform lowp float lightThreshold2; \
void main(void){ \
	lowp vec3 nrm = vNormal; \
	lowp vec3 light; \
	lowp float diffuse = -dot(normalize(nrm),uLight)*.5+.5; \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	light = diffuse * uLightColor; \
	light = light + uAmbColor; \
	light = clamp(light,0.,1.); \
	lowp vec4 vColor2 = vec4(vColor.xyz * light *clamp(vFar,0.,1.),vColor.w); \
	if(uTex==1){ \
		vColor2 = vColor2 * texture2D(uSampler,vec2(vUv.s,vUv.t)); \
	} \
	gl_FragColor = vColor2; \
} \
";

var mainArgs={};
var mainProgram;
var createShader = function(){
	var program = setShaderProgram(main_vs,fragment_vs);

	mainArgs["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	mainArgs["aPos"]=(createBuffer2(program,"aPos",3,gl.FLOAT));
	mainArgs["aNormal"]=(createBuffer2(program,"aNormal",3,gl.FLOAT));
	mainArgs["aUv"]=(createBuffer2(program,"aUv",2,gl.FLOAT));
	mainArgs["aUv"].buffer.itemSize=2;
	mainArgs["aUv"].buffer.numltems=3;
	mainArgs["aColor"]=createBuffer2(program,"aColor",4,gl.FLOAT);
	mainArgs["uColor"]=gl.getUniformLocation(program,"uColor");
	mainArgs["uSampler"]=gl.getUniformLocation(program,"uSampler");
	mainArgs["uTex"]=gl.getUniformLocation(program,"uTex");
	//mainArgs["uNrmMap"]=gl.getUniformLocation(program,"uNrmMap");
	mainArgs["uLight"]= gl.getUniformLocation(program,"uLight");
	mainArgs["uLightColor"]= gl.getUniformLocation(program,"uLightColor");
	mainArgs["uAmb"]= gl.getUniformLocation(program,"uAmb");
	mainArgs["uAmbColor"]= gl.getUniformLocation(program,"uAmbColor");
	mainArgs["uAmbColor"]= gl.getUniformLocation(program,"uAmbColor");
	mainArgs["lightThreshold1"]= gl.getUniformLocation(program,"lightThreshold1");
	mainArgs["lightThreshold2"]= gl.getUniformLocation(program,"lightThreshold2");

	mainProgram=program;
}	

var drawMain=function(ono3d){
	var renderface
	var posindex=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;

	gl.useProgram(mainProgram);
	gl.cullFace(gl.BACK);
	var lightSources=ono3d.lightSources
	gl.uniformMatrix4fv(mainArgs["projectionMat"],false,new Float32Array(ono3d.projectionMat));

	gl.uniform1f(mainArgs["lightThreshold1"],ono3d.lightThreshold1);
	var dif=(ono3d.lightThreshold2-ono3d.lightThreshold1);
	if(dif<0.01){
		dif=0.01;
	}
	gl.uniform1f(mainArgs["lightThreshold2"],1./(ono3d.lightThreshold2-ono3d.lightThreshold1));

	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ==LT_DIRECTION){
			gl.uniform3fv(mainArgs["uLight"],new Float32Array(lightSource.viewAngle));
			gl.uniform3fv(mainArgs["uLightColor"],new Float32Array(lightSource.color));
		}else if(lightSource.type == LT_AMBIENT){
			//gl.uniform1f(mainArgs["uAmb"],lightSource.power);
			gl.uniform3fv(mainArgs["uAmbColor"],new Float32Array(lightSource.color));
		}
	}

	for(var i=0;i<facessize;i++){
		faces[i].flg=0;
	}
	var flg=0;
	var tex=null;
	while(1){
		flg=0;
		colorindex=0;
		uvindex=0;
		posindex=0;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(renderface.flg)continue;
		if(flg== 0){
			tex=renderface.texture;
		}else{
			if(renderface.texture != tex)continue;
		}
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			flg=1;
			renderface.flg=1;
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
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
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
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
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
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
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

			posindex+=3;
			colorindex+=4;
			uvindex+=6;
		}
		}
		if(flg==0)break;
		if(tex){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,tex.gltexture);
			gl.uniform1i(mainArgs["uSampler"],0);
			gl.uniform1i(mainArgs["uTex"],1);
		}else{
			gl.uniform1i(mainArgs["uTex"],0);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,null);
		}
			
		gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aPos"].buffer);
		gl.enableVertexAttribArray(mainArgs["aPos"].att);
		gl.vertexAttribPointer(mainArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aColor"].buffer);
		gl.enableVertexAttribArray(mainArgs["aColor"].att);
		gl.vertexAttribPointer(mainArgs["aColor"].att, 4,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, colorbuffer, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aNormal"].buffer);
		gl.enableVertexAttribArray(mainArgs["aNormal"].att);
		gl.vertexAttribPointer(mainArgs["aNormal"].att, 3,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, normalbuffer, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aUv"].buffer);
		gl.enableVertexAttribArray(mainArgs["aUv"].att);
		gl.vertexAttribPointer(mainArgs["aUv"].att, 2,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

		gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
	}
}

var ttt=false;
var NUVec=new Vec3()
	,NVVec=new Vec3()
		,NTVec=new Vec3()
var setNormalMap = function(p0,p1,p2,u0,v0,u1,v1,u2,v2){
	var du1=u1-u0
	var dv1=v1-v0
	var du2=u2-u0
	var dv2=v2-v0
	var dx1=p1[0]-p0[0]
	var dy1=p1[1]-p0[1]
	var dz1=p1[2]-p0[2]
	var dx2=p2[0]-p0[0]
	var dy2=p2[1]-p0[1]
	var dz2=p2[2]-p0[2]

	var d=1/(du1*dv2-du2*dv1)
	NUVec[0]=(dv1*dx2-dv2*dx1)
	NUVec[1]=(dv1*dy2-dv2*dy1)
	NUVec[2]=(dv1*dz2-dv2*dz1)
	NVVec[0]=(du1*dx2-du2*dx1)
	NVVec[1]=(du1*dy2-du2*dy1)
	NVVec[2]=(du1*dz2-du2*dz1)
	d=1/Math.sqrt(NVVec[0]*NVVec[0]
	+NVVec[1]*NVVec[1]
	+NVVec[2]*NVVec[2])
	NVVec[0]*=d
	NVVec[1]*=d
	NVVec[2]*=d
	d=1/Math.sqrt(NUVec[0]*NUVec[0]
	+NUVec[1]*NUVec[1]
	+NUVec[2]*NUVec[2])
	NUVec[0]*=d
	NUVec[1]*=d
	NUVec[2]*=d
		
	Vec3.cross(NTVec,NUVec,NVVec);
	d=1/Math.sqrt(NTVec[0]*NTVec[0]
	+NTVec[1]*NTVec[1]
	+NTVec[2]*NTVec[2])
	NTVec[0]*=d
	NTVec[1]*=d
	NTVec[2]*=d

	matT[0]=NUVec[0]
	matT[1]=NUVec[1]
	matT[2]=NUVec[2]
	matT[3]=0;
	matT[4]=NVVec[0]
	matT[5]=NVVec[1]
	matT[6]=NVVec[2]
	matT[7]=0
	matT[8]=NTVec[0]
	matT[9]=NTVec[1]
	matT[10]=NTVec[2]
	matT[11]=0
	matT[12]=0
	matT[13]=0
	matT[14]=0
	matT[11]=1
	gl.uniformMatrix4fv(uniMatT,0,matT);
	gl.uniform1i(uniNrmMap,1);
}
var setShaderProgram = function(vs,fs){
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
  return program;
}
var createBuffer2=function(program,attName,size,type){
	var obj={};
  obj.att = gl.getAttribLocation(program,attName); 
  obj.buffer = gl.createBuffer();
  return obj;
}
var createBuffer=function(program,attName,size,type){
  var att = gl.getAttribLocation(program,attName); 
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(att , size, type, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return att;
}
var createElementBuffer=function(){
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  return buffer;
}

ret.set=function(ono3d){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
var posbuffer=new Float32Array(4096*3);
var colorbuffer=new Float32Array(4096*4);
var normalbuffer=new Float32Array(4096*3);
var uvbuffer=new Float32Array(4096*2);
var emibuffer=new Float32Array(4096);

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
uniform lowp float alpha; \
void main(void){ \
	gl_FragColor= texture2D(uSampler,vec2(vUv.s,vUv.t))*alpha; \
} \
";
	var program= setShaderProgram(vs,fs);
	var args=[];
	args["aPos"]=createBuffer2(program,"aPos",2,gl.FLOAT);
	args["aUv"]=createBuffer2(program,"aUv",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["alpha"]=gl.getUniformLocation(program,"alpha");
	paste.program=program;
	paste.args=args;
}	
var copyframe=function(dst,src,alpha){
	if(!alpha)alpha=1;
	var args=paste.args;
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

	gl.useProgram(paste.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);
	gl.uniform1f(args["alpha"],alpha);
			
	gl.bindBuffer(gl.ARRAY_BUFFER, args["aPos"].buffer);
	gl.enableVertexAttribArray(args["aPos"].att);
	gl.vertexAttribPointer(args["aPos"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, args["aUv"].buffer);
	gl.enableVertexAttribArray(args["aUv"].att);
	gl.vertexAttribPointer(args["aUv"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	gl.flush();
	
}
ret.drawEmi=function(ono3d){
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.disable(gl.BLEND);
	drawEmi(ono3d);
}
ret.framebuffer=function(ono3d){
	globalParam.gl.viewport(0,0,720,480);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
	copyframe(frameBuffer,fTexture2,0.7);
	gl.disable(gl.BLEND);

	gaussfilter(frameBuffer2,fTexture,frameBuffer,fTexture2,100);
	gaussfilter(frameBuffer2,fTexture,frameBuffer,fTexture2,100);
	copyframe(frameBuffer2,fTexture);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
	copyframe(null,fTexture);

	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.enable(gl.DEPTH_TEST);

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.clearColor(0, 0, 0,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

}
//emi shader
var emi={};
var createEmi= function(){
var vs=" \
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
";
var fs=" \
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
	gl_FragColor = vec4(vColor2.rgb * vEmi,1.) ; \
} \
";
	var program= setShaderProgram(vs,fs);
	var args=[];
	args["aPos"]=createBuffer2(program,"aPos",2,gl.FLOAT);
	args["aColor"]=createBuffer2(program,"aColor",4,gl.FLOAT);
	args["aUv"]=createBuffer2(program,"aUv",2,gl.FLOAT);
	args["aEmi"]=createBuffer2(program,"aEmi",1,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uTex"]=gl.getUniformLocation(program,"uTex");
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	emi.program=program;
	emi.args=args;
}	
ret.flush=function(ono3d){
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


	//drawEdge(ono3d);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	drawMain(ono3d);
	drawLine(ono3d);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	drawPoint(ono3d);



	gl.flush();
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

	gl.useProgram(emi.program);
	gl.cullFace(gl.BACK);
	gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));

	for(var i=0;i<facessize;i++){
		faces[i].flg=0;
	}
	var flg=0;
	var tex=null;
	while(1){
		flg=0;
		colorindex=0;
		uvindex=0;
		posindex=0;
		index=0;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(renderface.flg)continue;
		if(flg== 0){
			tex=renderface.texture;
		}else{
			if(renderface.texture != tex)continue;
		}
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			flg=1;
			renderface.flg=1;
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
		if(flg==0)break;
		if(tex){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,tex.gltexture);
			gl.uniform1i(args["uSampler"],0);
			gl.uniform1i(args["uTex"],1);

		}else{
			gl.uniform1i(args["uTex"],0);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,null);
		}
			
		gl.bindBuffer(gl.ARRAY_BUFFER, args["aPos"].buffer);
		gl.enableVertexAttribArray(args["aPos"].att);
		gl.vertexAttribPointer(args["aPos"].att, 3,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, args["aColor"].buffer);
		gl.enableVertexAttribArray(args["aColor"].att);
		gl.vertexAttribPointer(args["aColor"].att, 4,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, colorbuffer, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, args["aUv"].buffer);
		gl.enableVertexAttribArray(args["aUv"].att);
		gl.vertexAttribPointer(args["aUv"].att, 2,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, args["aEmi"].buffer);
		gl.enableVertexAttribArray(args["aEmi"].att);
		gl.vertexAttribPointer(args["aEmi"].att, 1,gl.FLOAT , false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, emibuffer, gl.STATIC_DRAW);

		gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
	}
}

ret.setTexture= function(image){
	var neheTexture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}

ret.init=function(_gl){

	gl = _gl;
	try{
		createShader();
		createPointShader();
		edge_createShader();
		plainCreateShader();
		createPaste();
		createEmi();
		createGauss();

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.CULL_FACE);

		calcLighting=Ono3d.calcLighting;
		calcSpc=Ono3d.calcSpc;

		frameBuffer=gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
		fTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		frameBuffer2=gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer2);
		fTexture2 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, fTexture2);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture2, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	catch(e){
		return true;
	}
	return false;

}

//gauss shader
var gauss={};
var gauss2={};
var createGauss= function(){
	var program= setShaderProgram(
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
	args["aPos"]=createBuffer2(program,"aPos",2,gl.FLOAT);
	args["aUv"]=createBuffer2(program,"aUv",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["weight"]=gl.getUniformLocation(program,"weight");
	gauss.program=program;
	gauss.args=args;

	program= setShaderProgram(
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
	args["aPos"]=createBuffer2(program,"aPos",2,gl.FLOAT);
	args["aUv"]=createBuffer2(program,"aUv",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["weight"]=gl.getUniformLocation(program,"weight");
	gauss2.program=program;
	gauss2.args=args;
}	
var gaussfilter=function(dst,src,dst2,src2,d){
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
//weight[0]=0.5;
//weight[1]=0.1;
//weight[2]=0.05;
//weight[3]=0.025;
//weight[4]=0.0125;
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
			
	gl.bindBuffer(gl.ARRAY_BUFFER, args["aPos"].buffer);
	gl.enableVertexAttribArray(args["aPos"].att);
	gl.vertexAttribPointer(args["aPos"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, args["aUv"].buffer);
	gl.enableVertexAttribArray(args["aUv"].att);
	gl.vertexAttribPointer(args["aUv"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	gl.flush();

	gl.bindFramebuffer(gl.FRAMEBUFFER, dst2);
	args=gauss2.args;
	gl.useProgram(gauss2.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src2);
	gl.uniform1i(args["uSampler"],0);

	gl.uniform1fv(args["weight"],weight);
			
	gl.bindBuffer(gl.ARRAY_BUFFER, args["aPos"].buffer);
	gl.enableVertexAttribArray(args["aPos"].att);
	gl.vertexAttribPointer(args["aPos"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, args["aUv"].buffer);
	gl.enableVertexAttribArray(args["aUv"].att);
	gl.vertexAttribPointer(args["aUv"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	gl.flush();
	
}

	return ret;
})();
