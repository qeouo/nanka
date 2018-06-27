"use strict"
var MainShader3=(function(){
var TEXSIZE= 1024;
var gl;
var ret= function(){};
var shader;
var svec=new Array(3);
var tvec=new Array(3);
var fa16 =new Float32Array(16);
var jsbuffers;

var transTexture;
ret.init= function(){
	gl = Rastgl.gl;

	transTexture = Rastgl.createTexture(null,TEXSIZE,TEXSIZE);

	shader= Rastgl.setShaderProgram2(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying vec3 vEye; \
varying mat3 vView; \
varying vec3 vLightPos; \
uniform mat4 projectionMatrix; \
uniform mat4 lightMat; \
uniform vec3 anglePos;  \
void main(void){ \
	gl_Position = projectionMatrix * vec4(aPos,1.0); \
	vUv = aUv; \
	vLightPos= (lightMat * vec4(aPos,1.0)).xyz; \
	vEye = aPos - anglePos ; \
	vView = mat3(normalize(aSvec - dot(aNormal,aSvec)*aNormal) \
		,normalize(aTvec - dot(aNormal,aTvec)*aNormal) \
		,aNormal); \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
varying vec3 vEye; \
uniform mat3 uViewMat; \
varying mat3 vView; \
uniform vec3 uBaseCol; \
uniform sampler2D uBaseColMap; \
uniform float uNormpow; \
uniform sampler2D uNormalMap; \
uniform sampler2D uTransMap; \
uniform float uRefract ; \
uniform float uOpacity; \
uniform float uTransRough; \
uniform float uReflect; \
uniform float uRough; \
uniform sampler2D uShadowmap; \
varying vec3 vLightPos; \
uniform vec3 uLight; \
uniform vec3 uLightColor; \
uniform vec3 uAmbColor; \
uniform float uEmi; \
uniform float lightThreshold1; \
uniform float lightThreshold2; \
uniform sampler2D uEnvMap; \
uniform vec3 uReflectionColor; \
uniform float uF; \
const highp float _PI =1.0/3.14159265359; \n \
void main(void){ \
	vec3 eye = normalize(vEye); \
	/*視差*/ \
	vec4 q = texture2D(uNormalMap,vUv); \
	vec2 uv = vUv + (vView*eye).xy * q.w * uNormpow; \
	/*ノーマルマップ*/ \
	q = texture2D(uNormalMap,uv); \
	vec3 nrm = vec3(( q.rg*2.0 - 1.0 ) * uNormpow,q.b) ; \
	nrm = normalize( vView* nrm); \
	/*ベースカラー*/ \
	vec3 baseCol = uBaseCol * texture2D(uBaseColMap,uv).rgb; \
	/*全反射*/ \
	vec3 angle = reflect(eye,nrm); \
	float refx = floor(sqrt(uRough/0.06)); \
	float refa = (uRough-refx*refx*0.06)/((((1.0+refx)*(1.0+refx))-refx*refx)*0.06); \
	refa = min(refa,1.0); \
	refx = pow(0.5,refx); \
	vec2 refV = vec2(atan(angle.x,-angle.z)*_PI*0.5 + 0.5 \
		,(-atan(angle.y,length(angle.xz))*_PI*0.5  + 0.25)); \
	vec4 refCol = texture2D(uEnvMap,refV*refx + vec2(0.0,1.0-refx)); \
	refCol.rgb *= (refCol.a * 3.0 + 1.0); \
	q = texture2D(uEnvMap,refV*refx*0.5 + vec2(0.0,1.0-refx*0.5)); \
	q.rgb *= (q.a * 3.0 + 1.0); \
	refCol.rgb = mix(refCol.rgb,q.rgb,refa) * uReflectionColor; \
	/*屈折*/ \
	refx = min(floor(uTransRough/0.2),3.0); \
	refa = (uTransRough-refx*0.2)/0.2; \
	refa = min(refa,1.0); \
	refx = pow(0.5,refx); \
	angle = normalize(uViewMat * nrm); \
	refV = gl_FragCoord.xy/1024.0+angle.xy*uRefract; \
	vec4 transCol = texture2D(uTransMap,refV*refx + vec2(0.0,1.0-refx)); \
	transCol.rgb *= (transCol.a * 3.0 + 1.0); \
	q = texture2D(uTransMap,refV*refx*0.5 + vec2(0.0,1.0-refx*0.5)); \
	q.rgb *= (q.a * 3.0 + 1.0); \
	transCol.rgb = mix(transCol.rgb,q.rgb,refa).rgb * baseCol; \
	/*乱反射強度*/ \
	float diffuse = max(-dot(nrm,uLight),0.0); \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	/*影判定*/ \
	vec4 shadowmap; \
	shadowmap=texture2D(uShadowmap,vLightPos.xy*0.5+0.5); \
	float lightz = max(min(vLightPos.z,1.0),-1.); \
	diffuse = (1.0-sign(lightz*0.5+0.5-0.01 -shadowmap.z))*0.5 * diffuse; \
	/*拡散反射+環境光+自己発光*/ \
	refx = pow(0.5,4.0); \
	refV = vec2(atan(nrm.x,-nrm.z)*_PI*0.5 + 0.5 \
		,(-atan(nrm.y,length(nrm.xz))*_PI*0.95 + 0.5)*0.5); \
	q= texture2D(uEnvMap,refV*refx + vec2(0.0,1.0-refx)); \
	q.rgb *= (q.a * 3.0 + 1.0); \
	/*表面色*/ \
	vec3 vColor2 = baseCol* (diffuse * uLightColor + uAmbColor*q.rgb  + uEmi); \
	/*透過合成*/ \
	vColor2 = mix(vColor2,transCol.rgb,1.0 - uOpacity); \
	/* フレネル */ \
	float reflect = uReflect + (1.0 - uReflect)*pow(1.0 + min(dot(eye,nrm),0.0),5.0)*uF; \
	/*全反射合成*/ \
	vColor2 = mix(vColor2,refCol.rgb,reflect); \
	/*スケーリング*/ \
    highp float m = max(1.0,max(vColor2.r,max(vColor2.g,vColor2.b))); \n \
	gl_FragColor = vec4(vColor2/m,(m-1.0)/3.0); \
} \
",
	[{name:"aPos",size:3}
	,{name:"aNormal",size:3}
	,{name:"aSvec",size:3}
	,{name:"aTvec",size:3}
	,{name:"aUv",size:2}
	],[
		"projectionMatrix",
		"lightMat",
		"uEmi",
		"uBaseCol",
		"uOpacity",
		"uBaseColMap",
		"uShadowmap",
		"uNormalMap",
		"uEnvMap",
		"uTransMap",
		"uLight",
		"uLightColor",
		"uAmbColor",
		"lightThreshold1",
		"lightThreshold2",
		"uNormpow",
		"anglePos",
		"uReflect",
		"uF",
		"uReflectionColor",
		"uRefract",
		"uRough",
		"uTransRough",
		"uViewMat"
	]);
	
	var size =512;
	jsbuffers=[];
	for(var i=0;i<8;i++){
		jsbuffers.push(new Float32Array(size*(i+1)));
	}

}

var arr;
ret.draw=function(ono3d,shadowTex,env2dtex,camerap,frenel){

	var i32a = ono3d.viewport;

	render(ono3d,shadowTex,env2dtex,camerap,frenel,false);

	//透明マテリアル
	var opacityFlg = false;
	for(var i=0;i<ono3d.renderMaterials_index;i++){
		if(ono3d.renderMaterials[i].opacity<1.0){
			opacityFlg = true;
			break;
		}
	}
	if(!opacityFlg){
		//透明マテリアルがない場合は終了
		return;
	}

	//不透明レンダリング結果からラフネス別テクスチャ作成
	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,i32a[0],i32a[1],i32a[2],i32a[3]);

	var bf = null;
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
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, bf);

	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,i32a[2],i32a[3]);

	gl.viewport(i32a[0],i32a[1],i32a[2],i32a[3]);

	gl.enable(gl.DEPTH_TEST);
	gl.depthMask(true);
	render(ono3d,shadowTex,env2dtex,camerap,frenel,true);

}
var render = function(ono3d,shadowTex,env2dtex,camerap,frenel,opFlg){

	var glbuffer=Rastgl.glbuffer;
	var faceflg=Rastgl.faceflg;
	var renderface
	var posindex=0;
	var index=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var normalindex=0;
	var sindex=0;
	var tindex=0;
	var uv;
	var material=null;

	gl.useProgram(shader.program);
	gl.enable(gl.DEPTH_TEST);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.BLEND);
	gl.cullFace(gl.BACK);
	gl.enable(gl.CULL_FACE);
	var lightSources=ono3d.lightSources

	gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer);
	var args = shader.args;
	var attributes= shader.attributes;
	
	gl.uniform1f(args["lightThreshold1"],ono3d.lightThreshold1);
	var dif=(ono3d.lightThreshold2-ono3d.lightThreshold1);
	if(dif<0.01){
		dif=0.01;
	}
	gl.uniform1f(args["lightThreshold2"],1./dif);

	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ===Rastgl.LT_DIRECTION){
			gl.uniform3f(args["uLight"],lightSource.matrix[8],lightSource.matrix[9],lightSource.matrix[10]);
			gl.uniform3fv(args["uLightColor"],new Float32Array(lightSource.color));

			Mat44.copy(fa16,lightSource.viewmatrix);
		}else if(lightSource.type === Rastgl.LT_AMBIENT){
			gl.uniform3fv(args["uAmbColor"],new Float32Array(lightSource.color));
		}
	}
	gl.uniformMatrix4fv(args["lightMat"],false,fa16);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,shadowTex);
	gl.uniform1i(args["uShadowmap"],1);
	gl.activeTexture(gl.TEXTURE3);

	var fa =new Float32Array(3);
	fa[0] = camerap[0];
	fa[1] = camerap[1];
	fa[2] = camerap[2];
	gl.uniform3fv(args["anglePos"],fa);

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
	
	gl.uniformMatrix3fv(args["uViewMat"],false,mat);
	
	//反射マップ
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D,env2dtex);
	gl.uniform1i(args["uEnvMap"],3);
		
	//透過マップ
	var envindex=0;
	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D,transTexture);
	gl.uniform1i(args["uTransMap"],4);

	arr = [];

	for(var i=0;i<facessize;i++){
		if(((faces[i].material.opacity < 1.0) !== opFlg)
		|| ( faces[i].operator !== Ono3d.OP_TRIANGLES)){
			continue;
		}
		arr.push(faces[i]);
	}
	arr.sort(function(a,b){return a.materialIndex-b.materialIndex;});
	var i=0;
	var materialIndex=-1;
	var arrlength=arr.length;
	var limit = jsbuffers[jsbuffers.length-1].length/(shader.amax*3) | 0;
	while(i<arrlength){
		materialIndex = arr[i].materialIndex;
		for(var j=i+1;j<arrlength;j++){
			if(arr[j].materialIndex !== materialIndex){break;}
		}
		var jmax=j;
		var jsize=(jmax-i);
		if(jsize>=limit){
			jmax= limit+i;
			jsize=limit;
		}
			
		jsize*=3;

		Rastgl.useProgram(shader,jsize);

		posindex=args["aPos"].offset2*jsize;
		normalindex=args["aNormal"].offset2*jsize;
		sindex=args["aSvec"].offset2*jsize;
		tindex=args["aTvec"].offset2*jsize;
		uvindex=args["aUv"].offset2*jsize;
	
		var jssize=shader.amax*jsize;


		for(var j=0;j<jsbuffers.length;j++){
			if(jssize<jsbuffers[j].length){
				break;
			}
		}
		var jsbuffer=jsbuffers[j];
		material = arr[i].material;
		for(var j=i;j<jmax;j++){
			//if(faceflg[i])continue;
			//renderface=faces[i];
			renderface = arr[j];


			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
			var nx = renderface.normal[0] * (1-smoothing);
			var ny = renderface.normal[1] * (1-smoothing);
			var nz = renderface.normal[2] * (1-smoothing);
			var vertex=vertices[0];
			jsbuffer[posindex]=vertex.pos[0]
			jsbuffer[posindex+1]=vertex.pos[1]
			jsbuffer[posindex+2]=vertex.pos[2]
			jsbuffer[normalindex+posindex]=vertex.normal[0] * smoothing + nx
			jsbuffer[normalindex+posindex+1]=vertex.normal[1] * smoothing + ny
			jsbuffer[normalindex+posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[1]
			jsbuffer[posindex]=vertex.pos[0]
			jsbuffer[posindex+1]=vertex.pos[1]
			jsbuffer[posindex+2]=vertex.pos[2]
			jsbuffer[normalindex+posindex]=vertex.normal[0] * smoothing + nx
			jsbuffer[normalindex+posindex+1]=vertex.normal[1] * smoothing + ny
			jsbuffer[normalindex+posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[2]
			jsbuffer[posindex]=vertex.pos[0]
			jsbuffer[posindex+1]=vertex.pos[1]
			jsbuffer[posindex+2]=vertex.pos[2]
			jsbuffer[normalindex+posindex]=vertex.normal[0] * smoothing + nx
			jsbuffer[normalindex+posindex+1]=vertex.normal[1] * smoothing + ny
			jsbuffer[normalindex+posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			jsbuffer[uvindex]=renderface.uv[0][0]
			jsbuffer[uvindex+1]=renderface.uv[0][1]
			jsbuffer[uvindex+2]=renderface.uv[1][0]
			jsbuffer[uvindex+3]=renderface.uv[1][1]
			jsbuffer[uvindex+4]=renderface.uv[2][0]
			jsbuffer[uvindex+5]=renderface.uv[2][1]
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
			jsbuffer[sindex+posindex-9]=svec[0]
			jsbuffer[sindex+posindex-9+1]=svec[1]
			jsbuffer[sindex+posindex-9+2]=svec[2]
			jsbuffer[sindex+posindex-9+3]=svec[0]
			jsbuffer[sindex+posindex-9+4]=svec[1]
			jsbuffer[sindex+posindex-9+5]=svec[2]
			jsbuffer[sindex+posindex-9+6]=svec[0]
			jsbuffer[sindex+posindex-9+7]=svec[1]
			jsbuffer[sindex+posindex-9+8]=svec[2]
			jsbuffer[tindex+posindex-9]=tvec[0]
			jsbuffer[tindex+posindex-9+1]=tvec[1]
			jsbuffer[tindex+posindex-9+2]=tvec[2]
			jsbuffer[tindex+posindex-9+3]=tvec[0]
			jsbuffer[tindex+posindex-9+4]=tvec[1]
			jsbuffer[tindex+posindex-9+5]=tvec[2]
			jsbuffer[tindex+posindex-9+6]=tvec[0]
			jsbuffer[tindex+posindex-9+7]=tvec[1]
			jsbuffer[tindex+posindex-9+8]=tvec[2]


			uvindex+=6;

		}
		i=jmax;

		gl.uniform3f(args["uBaseCol"],material.r,material.g,material.b);
		gl.uniform1f(args["uOpacity"],material.opacity);
		gl.uniform1f(args["uEmi"],material.emt);
		gl.uniform1f(args["uReflect"],material.spc);
		gl.uniform1f(args["uF"],frenel);
		gl.uniform3f(args["uReflectionColor"]
			,material.reflectionColor[0]
			,material.reflectionColor[1]
			,material.reflectionColor[2]);
		gl.uniform1f(args["uRefract"],(1.0/material.ior-1.0)*0.2);
		gl.uniform1f(args["uRough"],material.rough);
		gl.uniform1f(args["uTransRough"],material.transRough);

		gl.activeTexture(gl.TEXTURE0); //カラーテクスチャ
		gl.uniform1i(args["uBaseColMap"],0);
		if(material.texture){
			gl.bindTexture(gl.TEXTURE_2D,material.texture.gltexture);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
		}

		gl.activeTexture(gl.TEXTURE2); //ノーマルマップ
		gl.uniform1i(args["uNormalMap"],2);
		if(material.normalmap){
			gl.bindTexture(gl.TEXTURE_2D,material.normalmap.gltexture);
			gl.uniform1f(args["uNormpow"],material.normal*0.2*0.5);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture);
			gl.uniform1f(args["uNormpow"],0);
		}

		gl.bufferSubData(gl.ARRAY_BUFFER, 0, jsbuffer);
		//gl.bufferSubData(gl.ARRAY_BUFFER, args["aSvec"].offset2*jsize*4*3, jsbuffer2);

		ono3d.stereoDraw(function(){
			gl.uniformMatrix4fv(args["projectionMatrix"],false,new Float32Array(ono3d.pvMatrix));
			gl.drawArrays(gl.TRIANGLES, 0, jsize);
		});
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

