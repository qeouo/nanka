"use strict"
var MainShader=(function(){
var TEXSIZE= 1024;
var gl;
var ret= function(){};
var targs;
var tattributes;
var tprogram;
var svec=new Array(3);
var tvec=new Array(3);
var fa16 =new Float32Array(16);
var jsbuffer;
var jsbuffer2;

var envs=[0.0,0.1,0.2,0.5,0.8,1.0];
var textures = new Array(envs.length);
ret.init= function(){
	gl = Rastgl.gl;

	var size=TEXSIZE;
	for(var i=0;i<envs.length;i++){
		textures[i]= Rastgl.createTexture(null,size,size);
		size/=2;
	}

	tprogram= Rastgl.setShaderProgram(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying vec3 vNormal; \
varying vec3 vEye; \
varying mat3 vView; \
varying vec4 vLightPos; \
uniform mat4 projectionMat; \
uniform mat4 lightMat; \
uniform vec3 anglePos;  \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vNormal= aNormal; \
	vUv = aUv; \
	vLightPos= lightMat * vec4(aPos,1.0); \
	vEye = aPos - anglePos ; \
	vView = mat3(normalize(aSvec - dot(aNormal,aSvec)*aNormal) \
		,normalize(aTvec - dot(aNormal,aTvec)*aNormal) \
		,vNormal); \
} \
" , " \
precision lowp float; \
varying vec2 vUv; \
varying vec3 vNormal; \
varying vec3 vEye; \
varying vec4 vLightPos; \
varying mat3 vView; \
uniform sampler2D uSampler; \
uniform sampler2D uNormalmap; \
uniform sampler2D uShadowmap; \
uniform sampler2D uTransparentmap; \
uniform samplerCube uReflectmap; \
uniform vec3 uLight; \
uniform vec3 uLightColor; \
uniform float uAmb; \
uniform vec3 uAmbColor; \
uniform float lightThreshold1; \
uniform float lightThreshold2; \
uniform float normalmappow; \
uniform float uReflect; \
uniform float uF; \
uniform float uEmi; \
uniform vec4 uColor; \
uniform float uOpacity; \
uniform vec3 uReflectionColor; \
uniform float uRefract ; \
uniform mat3 uViewMat; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	vec3 nrm; \
	vec2 uv = vUv; \
	vec3 eye = normalize(vEye); \
	\n \
	/*ノーマルマップ*/ \
	vec4 nrmmap = texture2D(uNormalmap,uv); \
	uv = uv + (vView*eye).xy * nrmmap.w * normalmappow*0.5; \
	nrmmap = texture2D(uNormalmap,uv); \
	nrm.rg = ( nrmmap.rg*2.0 - 1.0 ) * (normalmappow); \
	nrm.b = nrmmap.b ; \
	nrm = normalize( vView * nrm); \
	/*全反射*/ \
	mediump vec3 angle = reflect(eye,nrm); \
	vec4 refCol = textureCube(uReflectmap,angle); \
	refCol.rgb = refCol.rgb * (refCol.a * 3.0 + 1.0) * uReflectionColor; \
	/*屈折*/ \
	/*angle = eye + dot(eye,nrm)* ( uRefract -1.0) * nrm;*/ \
	/*angle = refract(eye,nrm,1.0/uRefract);*/ \
	angle = normalize(uViewMat * nrm); \
	/*mediump vec3 angle2; \
	angle2= vec3((gl_FragCoord.x/360.0 - 1.0)*0.577,(gl_FragCoord.y/240.0 -1.0)*(480.0/720.0)*0.577,1.0); \
	angle2 = normalize(angle2);*/ \
	vec4 refCol2 = texture2D(uTransparentmap,gl_FragCoord.xy/1024.0+(angle).xy*(1.0/uRefract-1.0)*0.2); \
	refCol2.rgb = refCol2.rgb  * (refCol2.a * 3.0 + 1.0) * uColor.rgb; \
	/*乱反射強度*/ \
	vec3 light; \
	float diffuse = -dot(normalize(nrm),uLight)*.5+.5; \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	/*影判定*/ \
	vec4 shadowmap; \
	shadowmap=texture2D(uShadowmap,vLightPos.xy*0.5+0.5); \
	float lightz = max(min(vLightPos.z,1.0),-1.); \
	diffuse = (1.0-sign(lightz*0.5+0.5-0.01 -shadowmap.z))*0.5 * diffuse; \
	/*拡散反射+環境光+自己発光*/ \
	light = diffuse * uLightColor + uAmbColor; \
	light = light +uEmi; \
	/*表面色*/ \
	vec4 vColor2 = vec4(uColor.xyz * light ,uOpacity); \
	vColor2 = vColor2 * texture2D(uSampler,uv); \
	/*透過合成*/ \
	vColor2 = mix(vColor2,refCol2,1.0 - uOpacity); \
	/*全反射合成*/ \
	vColor2 = mix(vColor2,refCol \
		,clamp(uReflect + (1.0 - uReflect)*pow(1.0 +dot(eye,nrm),5.0)*uF,0.0,1.0)); \
	/*スケーリング*/ \
    highp float m = max(1.0,max(vColor2.r,max(vColor2.g,vColor2.b))); \n \
	gl_FragColor = vec4(vColor2.rgb/m,(m-1.0)/3.0); \
} \
")
	targs={};
	gl.useProgram(tprogram);
	tattributes=[
		{name:"aPos",size:3}
		,{name:"aNormal",size:3}
		,{name:"aSvec",size:3}
		,{name:"aTvec",size:3}
		,{name:"aUv",size:2}
	];
	Rastgl.initAtts(tprogram,tattributes,targs);
	var uniforms=[
		"projectionMat",
		"lightMat",
		"uEmi",
		"uColor",
		"uOpacity",
		"uSampler",
		"uShadowmap",
		"uNormalmap",
		"uReflectmap",
		"uTransparentmap",
		"uTex",
		"uLight",
		"uLightColor",
		"uAmb",
		"uAmbColor",
		"lightThreshold1",
		"lightThreshold2",
		"normalmappow",
		"anglePos",
		"uReflect",
		"uF",
		"uReflectionColor",
		"uRefract",
		"uViewMat"
	];
	for(var i=0;i<uniforms.length;i++){
		var name = uniforms[i];
		targs[name]=gl.getUniformLocation(tprogram,name);
	}
	
	var size=0;
	for(var i=0;i<tattributes.length;i++){
		size+=tattributes[i].size;
	}
	jsbuffer=new Float32Array(Rastgl.VERTEX_MAX*6);
	jsbuffer2=new Float32Array(Rastgl.VERTEX_MAX*10);

}

ret.draw=function(ono3d,shadowTex,envtexes,camerap,frenel){


	render(ono3d,shadowTex,envtexes,camerap,frenel,false);

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
	//gl.flush();

	//不透明レンダリング結果からラフネス別テクスチャ作成
	gl.bindTexture(gl.TEXTURE_2D,textures[0]);
	var i32a = gl.getParameter(gl.VIEWPORT);
	//gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,i32a[0],i32a[1],i32a[2],i32a[3]);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,960,540);

	var bf = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	var size=TEXSIZE;
	for(var i=1;i<envtexes.length/2;i++){
		size/=2;
		Gauss.filter(textures[i],textures[i-1],10,2/size,size);
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, bf);

	render(ono3d,shadowTex,envtexes,camerap,frenel,true);

	//gl.viewport(i32a[0],i32a[1],i32a[2],i32a[3]);
	//Rastgl.copyframe(textures[1],0,0,2,2,0,0,1,1);
	
}
var render = function(ono3d,shadowTex,envtexes,camerap,frenel,opFlg){

	var glbuffer=Rastgl.glbuffer;
	var faceflg=Rastgl.faceflg;
	var renderface
	var posindex=0;
	var index=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var posbuffer = jsbuffer;
	var normalbuffer =jsbuffer;
	var normalindex=0;
	var sindex=0;
	var tindex=0;
	var uvbuffer = jsbuffer2;
	var flg;
	var uv;
	var tex=null;
	var material=null;
	var normalmap=null;
	var args,attributes;

	gl.enable(gl.DEPTH_TEST);
	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	gl.disable(gl.BLEND);
	gl.cullFace(gl.BACK);
	gl.enable(gl.CULL_FACE);
	var lightSources=ono3d.lightSources

	gl.useProgram(tprogram);
	args = targs;
	attributes= tattributes;
	

	gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer);
	for(var i=0;i<attributes.length;i++){
		var arg=attributes[i].arg;
		gl.vertexAttribPointer(arg.att, arg.size,arg.type, false, 0, arg.offset*4);
	}

	gl.uniform1f(args["lightThreshold1"],ono3d.lightThreshold1);
	var dif=(ono3d.lightThreshold2-ono3d.lightThreshold1);
	if(dif<0.01){
		dif=0.01;
	}
	gl.uniform1f(args["lightThreshold2"],1./dif);

	for(var i=0;i<lightSources.length;i++){
		var lightSource = lightSources[i]
		if(lightSource.type ===Rastgl.LT_DIRECTION){
			gl.uniform3fv(args["uLight"],new Float32Array(lightSource.viewAngle));
			gl.uniform3fv(args["uLightColor"],new Float32Array(lightSource.color));

			Mat44.copy(fa16,lightSource.matrix);
		}else if(lightSource.type === Rastgl.LT_AMBIENT){
			gl.uniform3fv(args["uAmbColor"],new Float32Array(lightSource.color));
		}
	}
	gl.uniformMatrix4fv(args["lightMat"],false,fa16);

	for(var i=0;i<facessize;i++){
		faceflg[i]=false;
	}
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,shadowTex);
	gl.uniform1i(args["uShadowmap"],1);
	gl.activeTexture(gl.TEXTURE3);

	var fa =new Float32Array(3);
	fa[0] = ono3d.viewMatrix[12];
	fa[1] = ono3d.viewMatrix[13];
	fa[2] = ono3d.viewMatrix[14];
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
	

	while(1){
		flg=false;
		uvindex=args["aUv"].offset-args["aSvec"].offset;
		normalindex=args["aNormal"].offset;
		sindex=args["aSvec"].offset-args["aSvec"].offset;
		tindex=args["aTvec"].offset-args["aSvec"].offset;
		posindex=0;
		index=0;
		for(var i=0;i<facessize;i++){
			if(faceflg[i])continue;
			renderface=faces[i];
			if( renderface.operator !== Ono3d.OP_TRIANGLES){continue;}
			if(index !== 0 && renderface.material !== material){continue;}
			if((renderface.material.opacity < 1.0) !== opFlg){
				continue;
			}

			material = renderface.material;
			faceflg[i]=true;

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

			jsbuffer2[uvindex]=renderface.uv[0][0]
			jsbuffer2[uvindex+1]=renderface.uv[0][1]
			jsbuffer2[uvindex+2]=renderface.uv[1][0]
			jsbuffer2[uvindex+3]=renderface.uv[1][1]
			jsbuffer2[uvindex+4]=renderface.uv[2][0]
			jsbuffer2[uvindex+5]=renderface.uv[2][1]
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
			  )
			jsbuffer2[sindex+posindex-9]=svec[0]
			jsbuffer2[sindex+posindex-9+1]=svec[1]
			jsbuffer2[sindex+posindex-9+2]=svec[2]
			jsbuffer2[sindex+posindex-9+3]=svec[0]
			jsbuffer2[sindex+posindex-9+4]=svec[1]
			jsbuffer2[sindex+posindex-9+5]=svec[2]
			jsbuffer2[sindex+posindex-9+6]=svec[0]
			jsbuffer2[sindex+posindex-9+7]=svec[1]
			jsbuffer2[sindex+posindex-9+8]=svec[2]
			jsbuffer2[tindex+posindex-9]=tvec[0]
			jsbuffer2[tindex+posindex-9+1]=tvec[1]
			jsbuffer2[tindex+posindex-9+2]=tvec[2]
			jsbuffer2[tindex+posindex-9+3]=tvec[0]
			jsbuffer2[tindex+posindex-9+4]=tvec[1]
			jsbuffer2[tindex+posindex-9+5]=tvec[2]
			jsbuffer2[tindex+posindex-9+6]=tvec[0]
			jsbuffer2[tindex+posindex-9+7]=tvec[1]
			jsbuffer2[tindex+posindex-9+8]=tvec[2]


			uvindex+=6;
			index+=3;

		}
		if(index === 0)break;

		gl.uniform4f(args["uColor"],material.r,material.g,material.b,material.a);
		gl.uniform1f(args["uOpacity"],material.opacity);
		gl.uniform1f(args["uEmi"],material.emt);
		gl.uniform1f(args["uReflect"],material.reflect);
		gl.uniform1f(args["uF"],frenel);
		gl.uniform3f(args["uReflectionColor"]
			,material.reflectionColor[0]
			,material.reflectionColor[1]
			,material.reflectionColor[2]);
		gl.uniform1f(args["uRefract"],material.ior);

		gl.activeTexture(gl.TEXTURE0); //カラーテクスチャ
		gl.uniform1i(args["uSampler"],0);
		if(material.texture){
			gl.bindTexture(gl.TEXTURE_2D,material.texture.gltexture);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture); //テクスチャ未指定の場合はダミーを設定
		}

		gl.activeTexture(gl.TEXTURE2); //ノーマルマップ
		gl.uniform1i(args["uNormalmap"],2);
		if(material.normalmap){
			gl.bindTexture(gl.TEXTURE_2D,material.normalmap.gltexture);
			gl.uniform1f(args["normalmappow"],material.normal*0.1);
		}else{
			gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture);
			gl.uniform1f(args["normalmappow"],0.0);
		}
		var envindex=envtexes.lenght/2-1;
		for(envindex=0;envindex<envtexes.length/2-1;envindex++){
			if(material.rough<=envtexes[envindex*2]){
				break;
			}
		}
		gl.activeTexture(gl.TEXTURE3); //反射マップ
		gl.bindTexture(gl.TEXTURE_CUBE_MAP,envtexes[envindex*2+1]);
		gl.uniform1i(args["uReflectmap"],3);
			
		envindex=envtexes.lenght/2-1;
		for(envindex=0;envindex<envtexes.length/2-1;envindex++){
			if(material.trans_rough<=envtexes[envindex*2]){
				break;
			}
		}
		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D,textures[envindex]);
		gl.uniform1i(args["uTransparentmap"],4);
		

		gl.bufferSubData(gl.ARRAY_BUFFER, 0, jsbuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, jsbuffer.length*4, jsbuffer2);

		Rastgl.stereoDraw(ono3d,function(){
			gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.pvMat));
			gl.drawArrays(gl.TRIANGLES, 0, index);
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

	var d2;
	d2=1/(du1*dv2-du2*dv1);
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

