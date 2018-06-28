"use strict"
var MainShader4=(function(){
var MainShader4 = function(){};
var ret= MainShader4;
var TEXSIZE= 1024;
var gl;

var parallaxShader={};
var parallax2Shader={};
var reflectShader={};
var reflect2Shader={};
var transparent2Shader={};
var baseShader={};
var normalShader={};
var compositeShader={};

var parallaxTexture;
var roughTexture;
var baseTexture;
var normalTexture;
var reflectTexture;
var transparentTexture;
var transTexture;

var fa16 =new Float32Array(16);
var jsbuffers;
var WIDTH=0;
var HEIGHT=0;
var buff;

var arr;
var arrIndex;

var envs=[0.0,0.1,0.2,0.4,0.8,1.0];
var textures = new Array(envs.length);
ret.init= function(){
	gl = Rastgl.gl;

	var size=TEXSIZE;
	transTexture = Rastgl.createTexture(null,TEXSIZE,TEXSIZE);

	var size =64*3;
	jsbuffers=[];
	for(var i=0;i<8;i++){
		size*=2;
		jsbuffers.push(new Float32Array(size));
	}
	buff=new Float32Array(4096*2*14);

	parallaxShader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying vec3 vEye; \
varying mat3 vView; \
uniform mat4 uProjectionMatrix; \
uniform vec3 uAnglePos;  \
uniform float uNormpow; \
void main(void){ \
	gl_Position = uProjectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
	vEye = aPos - uAnglePos ; \
	vView = mat3(normalize(aSvec - dot(aNormal,aSvec)*aNormal) \
		,normalize(aTvec - dot(aNormal,aTvec)*aNormal) \
		,aNormal) * uNormpow * 0.5; \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
varying vec3 vEye; \
varying mat3 vView; \
uniform sampler2D uNormalmap; \
void main(void){ \
	vec2 uv = vUv; \
	vec3 eye = normalize(vEye); \
	/*視線と高さから視差を求める*/ \
	vec4 nrmmap = texture2D(uNormalmap,uv); \
	uv =  (vView*eye).xy * nrmmap.w ; \
	/*視差*/ \
	gl_FragColor =vec4((uv*10.0+1.0)*0.5,0.0,0.0); \
} \
",
	[	{name:"aPos",size:3}
		,{name:"aNormal",size:3}
		,{name:"aSvec",size:3}
		,{name:"aTvec",size:3}
		,{name:"aUv",size:2}
	]
	,[ "uProjectionMatrix",
		"uNormalmap",
		"uNormpow",
		"uAnglePos",
	]);
	parallaxTexture= Rastgl.createTexture(null,TEXSIZE,TEXSIZE);

	parallax2Shader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
uniform mat4 uProjectionMatrix; \
void main(void){ \
	gl_Position = uProjectionMatrix * vec4(aPos,1.0); \
} \
" , " \
precision lowp float; \
void main(void){ \
	gl_FragColor =vec4(0.5,0.5,0.0,0.0); \
} \
"
	,[ {name:"aPos",size:3}
	]
	,[ "uProjectionMatrix"
	]);

	reflectShader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec2 aUv; \
varying vec2 vUv; \
uniform mat4 uProjectionMatrix; \
void main(void){ \
	gl_Position = uProjectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
uniform sampler2D uParallax; \
uniform sampler2D uSampler; \
uniform vec4 uColor; \
void main(void){ \
	vec2 st = gl_FragCoord.st/1024.0; \
	/*視差*/ \
	vec2 plx = (texture2D(uParallax,st).rg -0.5)*0.01; \
	vec2 uv = vUv + plx ; \
	/*反射強度とラフネス*/ \
	gl_FragColor = uColor * texture2D(uSampler,uv); \
} \
"
	,[	{name:"aPos",size:3}
		,{name:"aUv",size:2}
	]
	,["uProjectionMatrix",
		"uColor",
		"uSampler",
		"uParallax",
	]);
	roughTexture= Rastgl.createTexture(null,TEXSIZE,TEXSIZE);
	
	baseShader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec2 aUv; \
varying vec2 vUv; \
uniform mat4 uProjectionMatrix; \
void main(void){ \
	gl_Position = uProjectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
uniform sampler2D uSampler; \
uniform sampler2D uParallax; \
uniform vec4 uColor; \
void main(void){ \
	vec2 st = gl_FragCoord.st/1024.0; \
	/*視差*/ \
	vec2 plx = (texture2D(uParallax,st).rg -0.5)*0.01; \
	vec2 uv = vUv + plx ; \
	/*表面色*/ \
	vec4 base = texture2D(uSampler,uv); \
	/*base.rgb = base.rgb * (base.a * 3.0 + 1.0) ;*/ \
	gl_FragColor = uColor* base; \
    highp float m = max(1.0,max(gl_FragColor.r,max(gl_FragColor.g,gl_FragColor.b))); \n \
	gl_FragColor = vec4(gl_FragColor.rgb/m,(m-1.0)/3.0); \
} \
"
	,[ {name:"aPos",size:3}
		,{name:"aUv",size:2}
	]
	,[ "uProjectionMatrix",
		"uColor",
		"uSampler",
		"uParallax",
	]);
	baseTexture= Rastgl.createTexture(null,TEXSIZE,TEXSIZE);
	

	normalShader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying mat3 vView; \
uniform mat4 uProjectionMatrix; \
void main(void){ \
	gl_Position = uProjectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
	vView = mat3(normalize(aSvec - dot(aNormal,aSvec)*aNormal) \
		,normalize(aTvec - dot(aNormal,aTvec)*aNormal) \
		,aNormal); \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
varying mat3 vView; \
uniform sampler2D uSampler; \
uniform sampler2D uNormalmap; \
uniform sampler2D uParallax; \
uniform float uNormpow; \
uniform vec4 uColor; \
void main(void){ \
	vec2 st = gl_FragCoord.st/1024.0; \
	vec2 plx = (texture2D(uParallax,st).rg -0.5)*0.01; \
	vec2 uv = vUv + plx ; \
	vec3 nrm; \
	\n \
	/*ノーマルマップ*/ \
	vec4 nrmmap = texture2D(uNormalmap,uv); \
	nrm.rg = ( nrmmap.rg*2.0 - 1.0 ) * uNormpow ; \
	nrm.b = nrmmap.b ; \
	nrm = normalize( vView* nrm); \
	/*ノーマル,不透明度*/ \
	gl_FragColor =vec4((nrm+1.0)*0.5,uColor.a); \
} \
"
	,[ {name:"aPos",size:3}
		,{name:"aNormal",size:3}
		,{name:"aSvec",size:3}
		,{name:"aTvec",size:3}
		,{name:"aUv",size:2}
	]
	,[ "uProjectionMatrix",
		"uNormalmap",
		"uColor",
		"uParallax",
		"uNormpow",
	]);
	normalTexture= Rastgl.createTexture(null,TEXSIZE,TEXSIZE);

	compositeShader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec2 aPos; \
varying vec3 vEye; \
uniform mat4 uProjectionMatrix; \
void main(void){ \
	gl_Position = vec4(aPos ,1.0,1.0); \
	vEye = (uProjectionMatrix *  gl_Position).xyz; \
} \
" , " \
precision lowp float; \
uniform sampler2D uReflectmap; \
uniform sampler2D uNormal; \
uniform sampler2D uTransparentmap; \
uniform sampler2D uBaseColor; \
uniform sampler2D uEnvmap; \
uniform vec3 uLight; \
uniform vec3 uLightColor; \
uniform mat3 uViewMat; \
varying vec3 vEye; \
const highp float _PI =1.0/3.14159265359; \n \
void main(void){ \
	vec3 eye = normalize(vEye); \
	vec2 uv = gl_FragCoord.st/1024.0; \
	vec4 q = texture2D(uNormal,uv); \
	vec3 nrm= q.rgb*2.0-1.0; \
	float opacity = q.a; \
	vec4 base = texture2D(uBaseColor ,uv); \
	base.rgb *=(base.a * 3.0 + 1.0) ; \
	q =  texture2D(uReflectmap,uv); \
	float roughness = q.g; \
	float power = q.r; \
	float transRough = q.b; \
	float refract = q.a; \
	/*屈折*/ \
	float refx = min(floor(transRough/0.2),3.0); \
	float refa = (transRough-refx*0.2)/0.2; \
	refa = min(refa,1.0); \
	refx = pow(0.5,refx); \
	vec3 angle = normalize(uViewMat * nrm); \
	vec2 refV = uv +angle.xy *(-refract) ; \
	vec4 transCol = texture2D(uTransparentmap,refV*refx + vec2(0.0,1.0-refx)); \
	transCol.rgb *= (transCol.a * 3.0 + 1.0); \
	q = texture2D(uTransparentmap,refV*refx*0.5 + vec2(0.0,1.0-refx*0.5)); \
	q.rgb *= (q.a * 3.0 + 1.0); \
	transCol.rgb = mix(transCol.rgb,q.rgb,refa); \
	/*拡散*/ \
	refx = pow(0.5,4.0); \
	refV = vec2(atan(nrm.x,-nrm.z)*_PI*0.5 + 0.5 \
		,(-atan(nrm.y,length(nrm.xz))*_PI*0.95 + 0.5)*0.5); \
	vec4 env= texture2D(uEnvmap,refV*refx + vec2(0.0,1.0-refx)); \
	env.rgb *= (env.a * 3.0 + 1.0); \
	/*反射*/ \
	angle = reflect(eye,nrm); \
	refx = floor(sqrt(roughness/0.06)); \
	refa = (roughness -refx*refx*0.06)/((((1.0+refx)*(1.0+refx))-refx*refx)*0.06); \
	refa = min(refa,1.0); \
	refx = pow(0.5,refx); \
	refV = vec2(atan(angle.x,-angle.z)*_PI*0.5 + 0.5 \
		,(-atan(angle.y,length(angle.xz))*_PI*0.5  + 0.25)); \
	vec4 refCol = texture2D(uEnvmap,refV*refx + vec2(0.0,1.0-refx)); \
	refCol.rgb *= (refCol.a * 3.0 + 1.0); \
	q = texture2D(uEnvmap,refV*refx*0.5 + vec2(0.0,1.0-refx*0.5)); \
	q.rgb *= (q.a * 3.0 + 1.0); \
	refCol.rgb = mix(refCol.rgb,q.rgb,refa) ; \
	/* ライティング */ \
	float diffuse = -dot(nrm,uLight)*.5+.5; \
	vec3 col = diffuse * uLightColor; \
	col = (col + env.rgb*0.4) * base.rgb ; \
	/* 透過 */ \
	col = mix(transCol.rgb, col , opacity); \
	/* 反射 */ \
	gl_FragColor.rgb = mix(col, refCol.rgb, power); \
	 \
    highp float m = max(1.0,max(gl_FragColor.r,max(gl_FragColor.g,gl_FragColor.b))); \n \
	gl_FragColor = vec4(gl_FragColor.rgb/m,(m-1.0)/3.0); \
} \
"
	,[ {name:"aPos",size:2}
	]
	,[ 
		"uProjectionMatrix"
		,"uBaseColor",
		"uNormal",
		"uEnvmap",
		"uReflectmap",
		"uTransparentmap",
		"uLight",
		"uLightColor"
		,"uViewMat"
	]);
	compositeShader.texture= Rastgl.createTexture(null,TEXSIZE,TEXSIZE);
}
var drawSub = function(ono3d,env2dtex,camerap,transFlg){

	arr = [];
	arrIndex=[];
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	for(var i=0;i<facessize;i++){
		if ( faces[i].operator !== Ono3d.OP_TRIANGLES){
			continue;
		}
		arr.push(faces[i]);
	}
	arr.sort(function(a,b){return a.materialIndex-b.materialIndex;});

	var i=0;
	var materialIndex;
	var arrlength=arr.length;
	var j=0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		arrIndex.push({begin:i,size:j-i});
		i=j;
	}
	if(i-j){
		arrIndex.push({begin:i,size:i-j});
	}

	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	gl.cullFace(gl.BACK);
	gl.enable(gl.CULL_FACE);

	//視差
	gl.depthMask(true);
	gl.clearColor(0.0,0.0,0.0,0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	renderParallax(ono3d,camerap,transFlg);
	gl.bindTexture(gl.TEXTURE_2D,parallaxTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);
	gl.depthMask(false);
	
	//法線,不透明度
	//gl.clearColor(0.0,0.0,0.0,0.0);
	//gl.clear(gl.COLOR_BUFFER_BIT);
	renderNormal(ono3d,transFlg);
	gl.bindTexture(gl.TEXTURE_2D,normalTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);


	//反射
	//gl.clearColor(0.0,0.0,0.0,1.0);
	//gl.clear(gl.COLOR_BUFFER_BIT);
	renderReflect(ono3d,transFlg);
	gl.bindTexture(gl.TEXTURE_2D,roughTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

	//ベースカラー
	//gl.clearColor(1.0,1.0,1.0,0.0);
	//gl.clear(gl.COLOR_BUFFER_BIT);
	renderBaseColor(ono3d,transFlg);
	gl.bindTexture(gl.TEXTURE_2D,baseTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

	composite(ono3d,env2dtex);
}

ret.draw=function(ono3d,shadowTex,env2dtex,camerap,frenel){


	var svec = Vec3.poolAlloc();
	var tvec = Vec3.poolAlloc();

	arr = [];

	var faces = ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	for(var i=0;i<facessize;i++){
		if(faces[i].operator !== Ono3d.OP_TRIANGLES){
			continue;
		}
		arr.push(faces[i]);
	}
	arr.sort(function(a,b){return a.materialIndex-b.materialIndex;});

	var arrlength=arr.length;
	var jsize= arrlength*3;
	

	var shader=parallaxShader;
	Rastgl.useProgram(shader);
	var args = shader.args;
	var posindex=args["aPos"].offset2;
	var normalindex=args["aNormal"].offset2;
	var sindex=args["aSvec"].offset2;
	var tindex=args["aTvec"].offset2;
	var uvindex=args["aUv"].offset2;

	var voffset=shader.amax;
	var vindex=0;

	for(var i=0;i<arrlength;i++){
		var renderface = arr[i];
		var uv = renderface.uv;
		var material = renderface.material;

		var smoothing=renderface.smoothing
		var vertices = renderface.vertices;
		var nx = renderface.normal[0] * (1-smoothing);
		var ny = renderface.normal[1] * (1-smoothing);
		var nz = renderface.normal[2] * (1-smoothing);

		if(material.normalmap){
			setNormalMap(svec,tvec
				,vertices[0].pos
				,vertices[1].pos
				,vertices[2].pos
				,renderface.uv[0][0]
				,renderface.uv[0][1]
				,renderface.uv[1][0]
				,renderface.uv[1][1]
				,renderface.uv[2][0]
				,renderface.uv[2][1]
			);
		}else{
			Vec3.set(svec,-renderface.normal[1],renderface.normal[2],renderface.normal[0]);
			Vec3.set(tvec,renderface.normal[2],-renderface.normal[0],renderface.normal[1]);
		}


		for(var j=0;j<3;j++){
			var vertex=vertices[j];
			buff[posindex+vindex]=vertex.pos[0]
			buff[posindex+vindex+1]=vertex.pos[1]
			buff[posindex+vindex+2]=vertex.pos[2]
			buff[normalindex+vindex]=vertex.normal[0] * smoothing + nx
			buff[normalindex+vindex+1]=vertex.normal[1] * smoothing + ny
			buff[normalindex+vindex+2]=vertex.normal[2] * smoothing + nz
			buff[uvindex+vindex]=uv[j][0]
			buff[uvindex+vindex+1]=uv[j][1]

			buff[sindex+vindex]=svec[0]
			buff[sindex+vindex+1]=svec[1]
			buff[sindex+vindex+2]=svec[2]
			buff[tindex+vindex]=tvec[0]
			buff[tindex+vindex+1]=tvec[1]
			buff[tindex+vindex+2]=tvec[2]
			vindex+=voffset;
		}

	}

	Vec3.poolFree(2);

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.glbuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, buff);
	var i32a = ono3d.viewport;
	WIDTH=i32a[2]-i32a[0];
	HEIGHT=i32a[3]-i32a[1];

	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

	gl.depthMask(true);
	gl.depthFunc(gl.LEQUAL);

	drawSub(ono3d,env2dtex,camerap,false);

	//不透明レンダリング結果からラフネス別テクスチャ作成
	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,i32a[0],i32a[1],i32a[2],i32a[3]);

	gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
	gl.disable(gl.DEPTH_TEST);
	var size=TEXSIZE;
	gl.disable(gl.BLEND);
	for(var i=1;i<4;i++){
		size>>=1;
		gl.viewport(0,0,size,size*0.5);
	
		Gauss.filter(size,size*0.5,100
			,transTexture,0,(TEXSIZE-size*2)/TEXSIZE,size*2/TEXSIZE,size/TEXSIZE,TEXSIZE,TEXSIZE);
		gl.bindTexture(gl.TEXTURE_2D,transTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,1024-size,0,0,size,size*0.5);
	}
	size>>=1;
	var s=Math.pow(0.5,4);
	gl.viewport(0,0,i32a[2]*s,i32a[3]*s);

	s=Math.pow(0.5,4);
	Env2D.draw(env2dtex,0,1-s,s,s*0.5);
	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	s=Math.pow(0.5,4);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,1024-size,0,0,i32a[2]*s,i32a[3]*s);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,i32a[2],i32a[3]);
	
	ono3d.setViewport(i32a[0],i32a[1],i32a[2],i32a[3]);

	drawSub(ono3d,env2dtex,camerap,true);
	

	
}
var composite = function(ono3d,env2dtex,opFlg){
	var shader = compositeShader;
	//gl.clear(gl.COLOR_BUFFER_BIT);
	gl.disable(gl.DEPTH_TEST);
	gl.depthMask(false);
	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);
	gl.useProgram(shader.program);
	Rastgl.useProgram(shader,0);

	gl.activeTexture(gl.TEXTURE0); //カラー
	gl.uniform1i(shader.args["uBaseColor"],0);
	gl.bindTexture(gl.TEXTURE_2D,baseTexture);
	gl.activeTexture(gl.TEXTURE1); //法線
	gl.uniform1i(shader.args["uNormal"],1);
	gl.bindTexture(gl.TEXTURE_2D,normalTexture);
	gl.activeTexture(gl.TEXTURE2); //環境マップ
	gl.uniform1i(shader.args["uEnvmap"],2);
	gl.bindTexture(gl.TEXTURE_2D,env2dtex);
	gl.activeTexture(gl.TEXTURE3); //反射マップ
	gl.uniform1i(shader.args["uReflectmap"],3);
	gl.bindTexture(gl.TEXTURE_2D,roughTexture);
	gl.activeTexture(gl.TEXTURE5); //透過マップ
	gl.uniform1i(shader.args["uTransparentmap"],5);
	gl.bindTexture(gl.TEXTURE_2D,transTexture);

	var lightSources=ono3d.lightSources
	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ===Rastgl.LT_DIRECTION){
			gl.uniform3f(shader.args["uLight"],lightSource.matrix[8],lightSource.matrix[9],lightSource.matrix[10]);
			gl.uniform3fv(shader.args["uLightColor"],new Float32Array(lightSource.color));

			Mat44.copy(fa16,lightSource.viewmatrix);
		}
	}

	var mat=new Float32Array(9);
	mat[0] = ono3d.viewMatrix[0];
	mat[1] = ono3d.viewMatrix[1];
	mat[2] = ono3d.viewMatrix[2];
	mat[3] = ono3d.viewMatrix[4];
	mat[4] = ono3d.viewMatrix[5];
	mat[5] = ono3d.viewMatrix[6];
	mat[6] = ono3d.viewMatrix[8];
	mat[7] = ono3d.viewMatrix[9];
	mat[8] = ono3d.viewMatrix[10];
	
	gl.uniformMatrix3fv(shader.args["uViewMat"],false,mat);

	var mat44 = new Array(16);
	Mat44.getInv(mat44,ono3d.pvMatrix);
	gl.uniformMatrix4fv(shader.args["uProjectionMatrix"],false,new Float32Array(mat44));

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}
var setVertices=function(jsbuffer,shader,idx,size){
	var material;
	var renderface;
	var posindex=0;
	var uvindex=shader.args["aUv"].offset2*size*3;

	material = arr[idx].material;
	for(var i=0;i<size;i++){
		renderface = arr[idx+i];

		var vertices = renderface.vertices;
		var vertex=vertices[0];
		jsbuffer[posindex]=vertex.pos[0]
		jsbuffer[posindex+1]=vertex.pos[1]
		jsbuffer[posindex+2]=vertex.pos[2]
		posindex+=3;

		vertex=vertices[1]
		jsbuffer[posindex]=vertex.pos[0]
		jsbuffer[posindex+1]=vertex.pos[1]
		jsbuffer[posindex+2]=vertex.pos[2]
		posindex+=3;

		vertex=vertices[2]
		jsbuffer[posindex]=vertex.pos[0]
		jsbuffer[posindex+1]=vertex.pos[1]
		jsbuffer[posindex+2]=vertex.pos[2]
		posindex+=3;

		jsbuffer[uvindex]=renderface.uv[0][0]
		jsbuffer[uvindex+1]=renderface.uv[0][1]
		jsbuffer[uvindex+2]=renderface.uv[1][0]
		jsbuffer[uvindex+3]=renderface.uv[1][1]
		jsbuffer[uvindex+4]=renderface.uv[2][0]
		jsbuffer[uvindex+5]=renderface.uv[2][1]

		uvindex+=6;
	}
	return ;

}
var renderParallax = function(ono3d,camerap,opFlg){

	var renderface
	var material=null;

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.glbuffer);

	var shader=parallaxShader;
	gl.useProgram(shader.program);
	Rastgl.useProgram(shader);

	shader = parallaxShader;

	var fa =new Float32Array(3);
	fa[0] = camerap[0];
	fa[1] = camerap[1];
	fa[2] = camerap[2];
	gl.uniform3fv(shader.args["uAnglePos"],fa);

	var i=0;
	var materialIndex=-1;
	var arrlength=arr.length;
	var limit = jsbuffers[jsbuffers.length-1].length/(shader.amax*3) | 0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(var j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		material = arr[i].material;
		if((material.opacity<1.0) !== opFlg){
			i=j;
			continue;
		}

		gl.activeTexture(gl.TEXTURE0); //ノーマルマップ
		gl.uniform1i(parallaxShader.args["uNormalmap"],0);
		if(material.normalmap){
			gl.bindTexture(gl.TEXTURE_2D,material.normalmap.gltexture);
			gl.uniform1f(parallaxShader.args["uNormpow"],material.normal*0.1);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
			gl.uniform1f(parallaxShader.args["uNormpow"],0.0);
		}

		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(parallaxShader.args["uProjectionMatrix"],false,new Float32Array(ono3d.pvMatrix));
			gl.drawArrays(gl.TRIANGLES, i*3, (j-i)*3);
		});
		i=j;
	}

	
}
var renderBaseColor = function(ono3d,opFlg){
	var renderface
	var material=null;

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.glbuffer);

	var shader = baseShader;
	gl.useProgram(shader.program);

	var args = shader.args;
	var arg = args["aPos"];
	var pargs = parallaxShader.args;
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4  , pargs["aPos"].offset2*4);
	arg = args["aUv"];
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4,  pargs["aUv"].offset2*4);


	var i=0;
	var materialIndex=-1;
	var arrlength=arr.length;
	var limit = jsbuffers[jsbuffers.length-1].length/(shader.amax*3) | 0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(var j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		material = arr[i].material;
		if((material.opacity<1.0) !== opFlg){
			i=j;
			continue;
		}


		//ベースカラー
		gl.uniform4f(baseShader.args["uColor"],material.r,material.g,material.b,0.0);

		gl.activeTexture(gl.TEXTURE0); //カラーテクスチャ
		gl.uniform1i(baseShader.args["uSampler"],0);
		if(material.texture){
			gl.bindTexture(gl.TEXTURE_2D,material.texture.gltexture);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
		}

		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(baseShader.args["uProjectionMatrix"],false,new Float32Array(ono3d.pvMatrix));
			gl.drawArrays(gl.TRIANGLES, i*3, (j-i)*3);
		});

		i=j;
	}
}
var renderReflect = function(ono3d,opFlg){
	var renderface
	var material=null;

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.glbuffer);

	var shader = reflectShader;
	gl.useProgram(shader.program);

	var args = shader.args;
	var arg = args["aPos"];
	var pargs = parallaxShader.args;
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4  , pargs["aPos"].offset2*4);
	arg = args["aUv"];
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4,  pargs["aUv"].offset2*4);


	var i=0;
	var materialIndex=-1;
	var arrlength=arr.length;
	var limit = jsbuffers[jsbuffers.length-1].length/(shader.amax*3) | 0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(var j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		material = arr[i].material;
		if((material.opacity<1.0) !== opFlg){
			i=j;
			continue;
		}

		//反射強度,反射ラフネス,透過ラフネス,屈折率
		gl.uniform4f(shader.args["uColor"],material.spc,material.rough,material.trans_rough,-(1.0/material.ior-1.0)*0.2);

		gl.activeTexture(gl.TEXTURE0); //反射テクスチャ
		gl.uniform1i(shader.args["uSampler"],0);
		if(material.reflectTexture){
			gl.bindTexture(gl.TEXTURE_2D,material.reflectTexture.gltexture);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
		}

		gl.activeTexture(gl.TEXTURE1); //視差マップ
		gl.uniform1i(shader.args["uParallax"],1);
		gl.bindTexture(gl.TEXTURE_2D,parallaxTexture);


		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(shader.args["uProjectionMatrix"],false,new Float32Array(ono3d.pvMatrix));
			gl.drawArrays(gl.TRIANGLES, i*3, (j-i)*3);
		});

		i=j;
	}

}

var renderNormal = function(ono3d,opFlg){
	var renderface
	var material=null;

	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.glbuffer);

	var shader = normalShader;
	gl.useProgram(shader.program);

	var args = shader.args;
	var arg = args["aPos"];
	var pargs = parallaxShader.args;
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4  , pargs["aPos"].offset2*4);
	arg = args["aUv"];
	gl.vertexAttribPointer(arg.att, arg.size,arg.type, false,parallaxShader.amax*4,  pargs["aUv"].offset2*4);


	var i=0;
	var materialIndex=-1;
	var arrlength=arr.length;
	var limit = jsbuffers[jsbuffers.length-1].length/(shader.amax*3) | 0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(var j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		material = arr[i].material;
		if((material.opacity<1.0) !== opFlg){
			i=j;
			continue;
		}

		//不透明度
		gl.uniform4f(shader.args["uColor"],0,0,0,material.opacity);
		gl.activeTexture(gl.TEXTURE1); //ノーマルマップ
		gl.uniform1i(shader.args["uNormalmap"],1);
		if(material.normalmap){
			gl.bindTexture(gl.TEXTURE_2D,material.normalmap.gltexture);
			gl.uniform1f(shader.args["uNormpow"],material.normal*0.1);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture);
			gl.uniform1f(shader.args["uNormpow"],0);
		}
		gl.activeTexture(gl.TEXTURE2); //マップ
		gl.uniform1i(shader.args["uParallax"],2);
		gl.bindTexture(gl.TEXTURE_2D,parallaxTexture);

		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(shader.args["uProjectionMatrix"],false,new Float32Array(ono3d.pvMatrix));
			gl.drawArrays(gl.TRIANGLES, i*3, (j-i)*3);
		});
		i=j;

	}
}


var setNormalMap = function(s,t,p0,p1,p2,u0,v0,u1,v1,u2,v2){
	var du1=u1-u0;
	var dv1=v1-v0;
	var du2=u2-u0;
	var dv2=v2-v0;
	var dx1=p1[0]-p0[0];
	var dy1=p1[1]-p0[1];
	var dz1=p1[2]-p0[2];
	var dx2=p2[0]-p0[0];
	var dy2=p2[1]-p0[1];
	var dz2=p2[2]-p0[2];

	var d2=(du1*dv2-du2*dv1);
	d2=1/d2;
	s[0]=-(dv1*dx2-dv2*dx1)*d2;
	s[1]=-(dv1*dy2-dv2*dy1)*d2;
	s[2]=-(dv1*dz2-dv2*dz1)*d2;
	t[0]=(du1*dx2-du2*dx1)*d2;
	t[1]=(du1*dy2-du2*dy1)*d2;
	t[2]=(du1*dz2-du2*dz1)*d2;

}
	ret.init();
	return ret;

})();

