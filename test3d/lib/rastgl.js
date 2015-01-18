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

var gl;
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

var vertexshader=" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec4 aColor; \
attribute vec2 aUv; \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vEye; \
uniform lowp float uPersW; \
uniform lowp float uPersH; \
void main(void){ \
	gl_Position = vec4(-aPos.x*uPersW,aPos.y*uPersH,-1.0, aPos.z); \
	vColor = aColor; \
	vNormal= aNormal; \
	vUv = aUv; \
} \
";
var fragmentshader=" \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vEye; \
uniform sampler2D uSampler; \
uniform int iFlg; \
uniform lowp vec3 uLight; \
uniform lowp float uAmb; \
uniform sampler2D uEnvSampler; \
uniform lowp float uEnv; \
uniform sampler2D uNrmSampler; \
uniform int  uNrmMap; \
uniform lowp mat4 uMatT; \
uniform lowp float uSpc; \
uniform lowp float uSpca; \
void main(void){ \
	lowp vec3 nrm = vNormal; \
	lowp float diffuse = -dot(normalize(nrm),uLight)*0.5+0.5; \
	diffuse = clamp(diffuse + uAmb,0.0,1.0); \
	if(diffuse<0.5){ \
		diffuse=0.7; \
	}else{ \
		diffuse=1.; \
	} \
	diffuse = clamp(diffuse + uAmb,0.0,1.0); \
	lowp vec4 vColor2 = vec4(vColor.xyz * diffuse,vColor.w); \
	vColor2 = vColor2 * texture2D(uSampler,vec2(vUv.s,vUv.t)); \
	gl_FragColor = vColor2; \
} \
";
var createShader = function(){
	var program = setShaderProgram(vertexshader,fragmentshader);
	gl.useProgram(program);

	posBuffer = createBuffer(program,"aPos",3,gl.FLOAT);
	normalBuffer = createBuffer(program,"aNormal",3,gl.FLOAT);
	uvBuffer = createBuffer(program,"aUv",2,gl.FLOAT);
	idxBuffer = createElementBuffer();
	colorBuffer = createBuffer(program,"aColor",4,gl.FLOAT);
	normalBuffer = createBuffer(program,"aNormal",3,gl.FLOAT);
	//textureBuffer = createBuffer2(program,"aTexture",1,gl.FLOAT);
	uvBuffer  = createBuffer(program,"aUv",2,gl.FLOAT);
	uvBuffer.itemSize=2;
	uvBuffer.numltems=3;
	normalBuffer = createBuffer(program,"aNormal",3,gl.FLOAT);
	//uniform
	uniNrmMap = gl.getUniformLocation(program,"uNrmMap");
	uniFlg = gl.getUniformLocation(program,"iFlg");
	uniSampler = gl.getUniformLocation(program,"uSampler");
	uniEnvSampler= gl.getUniformLocation(program,"uEnvSampler");
	uniEnv= gl.getUniformLocation(program,"uEnv");
	uniNrmSampler= gl.getUniformLocation(program,"uNrmSampler");
	uniAmb = gl.getUniformLocation(program,"uAmb");
	uniLight = gl.getUniformLocation(program,"uLight");
	uniPersW= gl.getUniformLocation(program,"uPersW");
	uniPersH= gl.getUniformLocation(program,"uPersH");
	uniMatT= gl.getUniformLocation(program,"uMatT");
	uniSpc= gl.getUniformLocation(program,"uSpc");
	uniSpca= gl.getUniformLocation(program,"uSpca");
}	

var colorBuffer =null; 
var posBuffer =null; 
var idxBuffer =null; 
var uvBuffer=null; 
var normal= new Float32Array(3*3);
var normalBuffer=null; 

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
var createBuffer=function(program,attName,size,type){
  var att = gl.getAttribLocation(program,attName); 
  var buffer = gl.createBuffer();
  gl.enableVertexAttribArray(att);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(att , size, type, false, 0, 0);
  return buffer;
}
var createBuffer2=function(program,attName,size,type){
  var att = gl.getAttribLocation(program,attName); 
  var buffer = gl.createBuffer();
  gl.enableVertexAttribArray(att);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  return buffer;
}
var createElementBuffer=function(){
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  return buffer;
}

ret.set=function(ono3d){
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER);
	var lightSources=ono3d.lightSources
	var amb=0;

	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ==LT_DIRECTION){
			gl.uniform3fv(uniLight,new Float32Array(lightSource.viewAngle));
		}else if(lightSource.type == LT_AMBIENT){
			amb=lightSource.power;
		}
	}
	gl.uniform1f(uniAmb,amb);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,ono3d.envTexture.gltexture);
	gl.uniform1i(uniEnvSampler,1);
}
//var idxbuffer=new Int16Array(1024*3);
var posbuffer=new Float32Array(4096*3);
var colorbuffer=new Float32Array(4096*4);
var normalbuffer=new Float32Array(4096*3);
var uvbuffer=new Float32Array(4096*2);

ret.flush=function(faces,facesize,vertices,vertexsize){
	var faceindex=0;
	var renderface;
	var vertexindex=0;
	var posindex=0;
	var colorindex=0;
	var uvindex=0;

//	for(var i=0;i<facesize;i++){
//		renderface=faces[i];
//		if(renderface.operator == Ono3d.OP_TRIANGLES){
//			idxbuffer[faceindex]=renderface.vertices[0].idx;
//			idxbuffer[faceindex+1]=renderface.vertices[1].idx;
//			idxbuffer[faceindex+2]=renderface.vertices[2].idx;
//			faceindex+=3;
//		}
//	}
//	for(var i=0;i<vertexsize;i++){
//		posbuffer[i*3]=vertices[i].pos[0]
//		posbuffer[i*3+1]=vertices[i].pos[1]
//		posbuffer[i*3+2]=vertices[i].pos[2]
//		colorbuffer[i*4]=1;
//		colorbuffer[i*4+1]=1;
//		colorbuffer[i*4+2]=1;
//		colorbuffer[i*4+3]=1;
//	}
	var texture=null;
	for(var i=0;i<facesize;i++){
		renderface=faces[i];
		if(renderface.operator == Ono3d.OP_TRIANGLES){
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
				texture=renderface.texture.gltexture;
			}

			posindex+=3;
			colorindex+=4;
				uvindex+=6;
		}
	}
	if(texture){
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,texture);
		gl.uniform1i(uniSampler,0);
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colorbuffer, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normalbuffer, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, uvbuffer, gl.STATIC_DRAW);

//	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
//	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxbuffer, gl.STATIC_DRAW);

//    gl.drawElements(gl.TRIANGLES, faceindex, gl.UNSIGNED_SHORT, 0);
	gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
	gl.flush();
}
ret.setPers=function(w,h){
	gl.uniform1f(uniPersW,w);
	gl.uniform1f(uniPersH,h);

}
ret.setTexture= function(image){
	var neheTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return neheTexture;
}

ret.init=function(canvas){

	gl = null;
	try{
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if(gl){

			createShader();

			gl.clearColor(0.0, 0.0, 0.0, 0.0);
			gl.clearDepth(1.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER);
			gl.enable(gl.CULL_FACE);

			calcLighting=Ono3d.calcLighting;
			calcSpc=Ono3d.calcSpc;
		}else{
			return true;
		}
	}
	catch(e){
		return true;
	}
	return false;

}

	return ret;
})();
