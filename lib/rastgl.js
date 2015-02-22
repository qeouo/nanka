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

var edge_vs=" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
varying lowp vec3 vNormal; \
uniform lowp float uPersW; \
uniform lowp float uPersH; \
void main(void){ \
	lowp vec3 p = aPos + aNormal*0.05 ; \
	gl_Position = vec4(-p.x*uPersW,p.y*uPersH,-1.0, p.z); \
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
var idxbuffer=new Int16Array(1024*3);
var edgeArgs=new Array();
var edge_createShader= function(){

	edgeProgram= setShaderProgram(edge_vs,edge_fs);

	gl.useProgram(edgeProgram);
	edgeArgs["idx"]=createElementBuffer();
	edgeArgs["aPos"]=createBuffer2(edgeProgram,"aPos",3,gl.FLOAT);
	edgeArgs["aNormal"]=createBuffer2(edgeProgram,"aNormal",3,gl.FLOAT);
	edgeArgs["uColor"]=gl.getUniformLocation(edgeProgram,"uColor");
	edgeArgs["uPersW"]=gl.getUniformLocation(edgeProgram,"uPersW");
	edgeArgs["uPersH"]=gl.getUniformLocation(edgeProgram,"uPersH");
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
	gl.uniform1f(edgeArgs["uPersW"],2.0/ono3d.persx);
	gl.uniform1f(edgeArgs["uPersH"],2.0/ono3d.persy);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeArgs["idx"]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxbuffer, gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, faceindex, gl.UNSIGNED_SHORT, 0);
}

//plain shader
var plain_vs=" \
attribute vec3 aPos; \
uniform lowp float uPersW; \
uniform lowp float uPersH; \
void main(void){ \
	gl_Position = vec4(-aPos.x*uPersW,aPos.y*uPersH,-1.0, aPos.z-0.0001); \
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
	args["uPersW"]=gl.getUniformLocation(program,"uPersW");
	args["uPersH"]=gl.getUniformLocation(program,"uPersH");
	args["idx"]=createElementBuffer();
	args["aPos"]=createBuffer2(program,"aPos",3,gl.FLOAT);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
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

	gl.useProgram(plainProgram);
	gl.lineWidth(2);
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

	gl.uniform4f(plainArgs["uColor"],0,0,0,1);
	gl.uniform1f(plainArgs["uPersW"],2.0/ono3d.persx);
	gl.uniform1f(plainArgs["uPersH"],2.0/ono3d.persy);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plainArgs["idx"]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxbuffer, gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, faceindex, gl.UNSIGNED_SHORT, 0);

}



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
	diffuse = clamp(diffuse,0.0,1.0); \
	if(diffuse<0.5){ \
		diffuse=0.0; \
	}else{ \
		diffuse=1.; \
	} \
	diffuse = clamp(diffuse + uAmb,0.0,1.0); \
	lowp vec4 vColor2 = vec4(vColor.xyz * diffuse,vColor.w); \
	vColor2 = vColor2 * texture2D(uSampler,vec2(vUv.s,vUv.t)); \
	gl_FragColor = vColor2; \
} \
";
var mainArgs={};
var mainProgram;
var createShader = function(){
	var program = setShaderProgram(vertexshader,fragmentshader);

	//gl.useProgram(program);
	mainArgs["uPersW"]=(gl.getUniformLocation(program,"uPersW"));
	mainArgs["uPersH"]=(gl.getUniformLocation(program,"uPersH"));
	mainArgs["aPos"]=(createBuffer2(program,"aPos",3,gl.FLOAT));
	mainArgs["aNormal"]=(createBuffer2(program,"aNormal",3,gl.FLOAT));
	mainArgs["aUv"]=(createBuffer2(program,"aUv",2,gl.FLOAT));
	mainArgs["aUv"].buffer.itemSize=2;
	mainArgs["aUv"].buffer.numltems=3;
	mainArgs["aColor"]=createBuffer2(program,"aColor",4,gl.FLOAT);
	mainArgs["uColor"]=gl.getUniformLocation(program,"uColor");
	mainArgs["uSampler"]=gl.getUniformLocation(program,"uSampler");
	mainArgs["uNrmMap"]=gl.getUniformLocation(program,"uNrmMap");
	mainArgs["iFlg"]=gl.getUniformLocation(program,"iFlg");
	mainArgs["uLight"]= gl.getUniformLocation(program,"uLight");
	mainArgs["uAmb"]= gl.getUniformLocation(program,"uAmb");

	//uniform
	uniEnvSampler= gl.getUniformLocation(program,"uEnvSampler");
	uniEnv= gl.getUniformLocation(program,"uEnv");
	uniNrmSampler= gl.getUniformLocation(program,"uNrmSampler");
	uniMatT= gl.getUniformLocation(program,"uMatT");
	uniSpc= gl.getUniformLocation(program,"uSpc");
	uniSpca= gl.getUniformLocation(program,"uSpca");

	mainProgram=program;
}	

var drawMain=function(ono3d){
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

	gl.useProgram(mainProgram);
	gl.cullFace(gl.BACK);
	var lightSources=ono3d.lightSources
	var amb=0;
	gl.uniform1f(mainArgs["uPersW"],2.0/ono3d.persx);
	gl.uniform1f(mainArgs["uPersH"],2.0/ono3d.persy);

	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ==LT_DIRECTION){
			gl.uniform3fv(mainArgs["uLight"],new Float32Array(lightSource.viewAngle));
		}else if(lightSource.type == LT_AMBIENT){
			amb=lightSource.power;
		}
	}
	gl.uniform1f(mainArgs["uAmb"],amb);

//	gl.activeTexture(gl.TEXTURE1);
//	gl.bindTexture(gl.TEXTURE_2D,ono3d.envTexture.gltexture);
//	gl.uniform1i(mainArgs["uSampler"],1);

	var texture=null;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
			var nx = renderface.normal[0] * (1-smoothing);
			var ny = renderface.normal[1] * (1-smoothing);
			var nz = renderface.normal[2] * (1-smoothing);
			var r=1//renderface.r;
			var g=1//renderface.g;
			var b=1//renderface.b;
			var a=1//renderface.a;
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
		gl.uniform1i(mainArgs["uSampler"],0);
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aPos"].buffer);
	gl.enableVertexAttribArray(mainArgs["aPos"].att);
	gl.vertexAttribPointer(mainArgs["aPos"].att, 3,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, mainArgs["aColor"].buffer);
	gl.enableVertexAttribArray(mainArgs["aColor"].att);
	gl.vertexAttribPointer(mainArgs["aColor"].att, 3,gl.FLOAT , false, 0, 0);
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
var colorBuffer =null; 
var posBuffer =null; 
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
	drawLine(ono3d);
	drawMain(ono3d);
	gl.flush();
	return;
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
			edge_createShader();
			plainCreateShader();

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
