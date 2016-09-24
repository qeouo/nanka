"use strict"
var MainShader=(function(){
var gl;
var ret= function(){};
var args;
var attributes;
var program;
var bM= new Array(16);
var svec=new Array(3);
var tvec=new Array(3);
var sqrt=Math.sqrt;
var glbuffer;
var jsbuffer;
var jsbuffer2;
var _offset;

ret.init= function(){
	gl = Rastgl.gl;

	glbuffer=Rastgl.glbuffer;

	program = Rastgl.setShaderProgram(" \
precision lowp float; \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec2 aUv; \
varying vec2 vUv; \
varying vec3 vNormal; \
varying vec3 vEye; \
varying float vFar; \
varying mat3 vView; \
varying vec4 vLightPos; \
uniform mat4 projectionMat; \
uniform mat4 lightMat; \
uniform vec3 anglePos;  \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vFar =1.-(aPos.z-3000.0)/1000.; \
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
varying float vFar; \
varying vec4 vLightPos; \
varying mat3 vView; \
uniform sampler2D uSampler; \
uniform sampler2D uNormalmap; \
uniform sampler2D uShadowmap; \
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
uniform vec3 uReflectionColor; \
uniform float uRefract ; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	vec3 nrm; \
	vec2 uv = vUv; \
	vec3 eye = normalize(vEye); \
	if(normalmappow>0.){ \
		vec4 nrmmap = texture2D(uNormalmap,uv); \
		uv = uv + (vView*eye).xy * nrmmap.w * normalmappow*0.5; \
		nrmmap = texture2D(uNormalmap,uv); \
		nrm = nrmmap.rgb*2.0-1.0; \
		nrm.rg = nrm.rg*normalmappow; \
		nrm = normalize( vView * nrm); \
	}else{ \
	    nrm = normalize(vNormal); \
	} \
	\
	mediump vec3 angle = reflect(eye,nrm); \
	vec4 colA = textureCube(uReflectmap,angle); \
	colA.rgb = max(colA*2.0,(colA - 0.5)*10.0+1.0).rgb * uReflectionColor; \
	angle = eye + dot(eye,nrm)* ( uRefract -1.0) * nrm; \
	vec4 colB = textureCube(uReflectmap,angle); \
	colB.rgb = max(colB*2.0,(colB - 0.5)*10.0+1.0).rgb * uColor.rgb; \
	vec3 light; \
	float diffuse = -dot(normalize(nrm),uLight)*.5+.5; \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	vec4 shadowmap; \
	shadowmap=texture2D(uShadowmap,vLightPos.xy*0.5+0.5); \
	float lightz = max(min(vLightPos.z,1.0),-1.); \
	diffuse = (1.-sign(lightz*0.5+0.5-0.01 -shadowmap.z))*0.5 * diffuse; \
	light = diffuse * uLightColor + uAmbColor; \
	light = clamp(max(light,uEmi),0.0,1.0); \
	vec4 vColor2 = vec4(uColor.xyz * light *clamp(vFar,0.,1.),uColor.w); \
	vColor2 = vColor2 * texture2D(uSampler,uv); \
	vColor2 = mix(vColor2,colB ,1.0-uColor.w); \
	gl_FragColor = mix(vColor2,colA \
		,clamp(uReflect + (1.0 - uReflect)*pow(1.0 +dot(eye,nrm),5.0)*uF,0.0,1.0)); \
} \
")
//gl_FragColor = mix(vColor2,colA,clamp(f0 + (1.0 - f0)*pow(1.0 +dot(eye,nrm),5.0),0.0,1.0)); \
	args={};
_offset=0;
	gl.useProgram(program);
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	args["lightMat"]=gl.getUniformLocation(program,"lightMat");
	attributes=[
		{name:"aPos",size:3}
		,{name:"aNormal",size:3}
		,{name:"aSvec",size:3}
		,{name:"aTvec",size:3}
		,{name:"aUv",size:2}
	];
	Rastgl.initAttReset();
	for(var i=0;i<attributes.length;i++){
		args[attributes[i].name]=Rastgl.initAtt(program,attributes[i].name,attributes[i].size,gl.FLOAT);
		attributes[i].arg=args[attributes[i].name];
	}
	args["uEmi"]=gl.getUniformLocation(program,"uEmi");
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uShadowmap"]=gl.getUniformLocation(program,"uShadowmap");
	args["uNormalmap"]=gl.getUniformLocation(program,"uNormalmap");
	args["uReflectmap"]=gl.getUniformLocation(program,"uReflectmap");
	args["uTex"]=gl.getUniformLocation(program,"uTex");
	args["uLight"]= gl.getUniformLocation(program,"uLight");
	args["uLightColor"]= gl.getUniformLocation(program,"uLightColor");
	args["uAmb"]= gl.getUniformLocation(program,"uAmb");
	args["uAmbColor"]= gl.getUniformLocation(program,"uAmbColor");
	args["lightThreshold1"]= gl.getUniformLocation(program,"lightThreshold1");
	args["lightThreshold2"]= gl.getUniformLocation(program,"lightThreshold2");
	args["normalmappow"]= gl.getUniformLocation(program,"normalmappow");
	args["anglePos"]=gl.getUniformLocation(program,"anglePos");
	args["uReflect"]=gl.getUniformLocation(program,"uReflect");
	args["uF"]=gl.getUniformLocation(program,"uF");
	args["uReflectionColor"]=gl.getUniformLocation(program,"uReflectionColor");
	args["uRefract"]=gl.getUniformLocation(program,"uRefract");
	
	var size=0;
	for(var i=0;i<attributes.length;i++){
		size+=attributes[i].size;
	}
	jsbuffer=new Float32Array(Rastgl.VERTEX_MAX*6);
	jsbuffer2=new Float32Array(Rastgl.VERTEX_MAX*10);

}

	ret.draw=function(ono3d,shadowTex,envtexes,camerap,frenel){
		var faceflg=Rastgl.faceflg;
		var renderface
		var posindex=0;
		var index=0;
		var uvindex=args["aUv"].offset;
		var faces=ono3d.renderFaces;
		var facessize=ono3d.renderFaces_index;
		var vertices=ono3d.renderVertices;
		var verticessize=ono3d.renderVertices_index;
		var posbuffer = jsbuffer;
		var normalbuffer =jsbuffer;
		var normalindex=args["aNormal"].offset;
		var sindex=args["aSvec"].offset-args["aSvec"].offset;
		var tindex=args["aTvec"].offset-args["aSvec"].offset;
		var uvbuffer = jsbuffer2;

		gl.useProgram(program);

		gl.enable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
		gl.cullFace(gl.BACK);
		var lightSources=ono3d.lightSources


			var lightSource = ono3d.lightSources[0]
			Mat43.setInit(lightSource.matrix);
			Mat43.getRotVector(lightSource.matrix,lightSource.angle);
			Mat43.setInit(bM);
			bM[12]=-lightSource.pos[0]
			bM[13]=-lightSource.pos[1]
			bM[14]=-lightSource.pos[2]

			Mat43.dot(lightSource.matrix,lightSource.matrix,bM);
			Mat44.copy(bM,ono3d.projectionMat);
			ono3d.setOrtho(10.0,10.0,8.0,40.0)
			Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,lightSource.matrix);
			gl.uniformMatrix4fv(args["lightMat"],false,new Float32Array(ono3d.projectionMat));

			Mat44.copy(ono3d.projectionMat,bM);

		gl.uniform1f(args["lightThreshold1"],ono3d.lightThreshold1);
		var dif=(ono3d.lightThreshold2-ono3d.lightThreshold1);
		if(dif<0.01){
			dif=0.01;
		}
		gl.uniform1f(args["lightThreshold2"],1./(ono3d.lightThreshold2-ono3d.lightThreshold1));

		for(var i=0;i<lightSources.length;i++){
			var lightSource = lightSources[i]
			if(lightSource.type ==Rastgl.LT_DIRECTION){
				gl.uniform3fv(args["uLight"],new Float32Array(lightSource.viewAngle));
				gl.uniform3fv(args["uLightColor"],new Float32Array(lightSource.color));
			}else if(lightSource.type == Rastgl.LT_AMBIENT){
				gl.uniform3fv(args["uAmbColor"],new Float32Array(lightSource.color));
			}
		}

		for(var i=0;i<facessize;i++){
			faceflg[i]=false;
		}
		var flg;
		var uv;
		var tex=null;
		var material=null;
		var normalmap=null;
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D,shadowTex);
		gl.uniform1i(args["uShadowmap"],1);
		var fa =new Float32Array(3);
		fa[0] = camerap[0];
		fa[1] = camerap[1];
		fa[2] = camerap[2];
		gl.activeTexture(gl.TEXTURE3);

		gl.uniform3fv(args["anglePos"],fa);
			for(var i=0;i<attributes.length;i++){
				var arg=attributes[i].arg;
				gl.vertexAttribPointer(arg.att, arg.size,arg.type, false, 0, arg.offset*4);
			}
		while(1){
			flg=false;
			uvindex=args["aUv"].offset-args["aSvec"].offset;
			posindex=0;
			index=0;
			for(var i=0;i<facessize;i++){
				if(faceflg[i])continue;
				renderface=faces[i];
				if( renderface.operator !== Ono3d.OP_TRIANGLES){
					continue;
				}
				if(index !== 0 && renderface.material !== material)continue;
				material = renderface.material;
				faceflg[i]=true;
				var smoothing=renderface.smoothing
				var vertices = renderface.vertices;
				var nx = renderface.normal[0] * (1-smoothing);
				var ny = renderface.normal[1] * (1-smoothing);
				var nz = renderface.normal[2] * (1-smoothing);
				var r=material.r;
				var g=material.g;
				var b=material.b;
				var a=material.a;
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
			gl.uniform1f(args["uEmi"],material.emt);
			gl.uniform1f(args["uReflect"],material.reflect);
			gl.uniform1f(args["uF"],frenel);
			gl.uniform3f(args["uReflectionColor"]
				,material.reflectionColor[0]
				,material.reflectionColor[1]
				,material.reflectionColor[2]);
			gl.uniform1f(args["uRefract"],material.refract);

			if(material.texture){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,material.texture.gltexture);
				gl.uniform1i(args["uSampler"],0);
				//gl.uniform1i(args["uTex"],1);
			}else{
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture);
				gl.uniform1i(args["uSampler"],0);
				//gl.uniform1i(args["uTex"],0);
			}
			if(material.normalmap){
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D,material.normalmap.gltexture);
				gl.uniform1i(args["uNormalmap"],2);
				gl.uniform1f(args["normalmappow"],material.normal*0.02);
			}else{
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D,Rastgl.dummyTexture);
				gl.uniform1f(args["normalmappow"],-1);
			}
			var envtex=envtexes[1];
			for(var j=0;j<envtexes.length;j+=2){
				if(material.rough<=envtexes[j]){
					envtex=envtexes[j+1];
					break;
				}
			}
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP,envtex);
			gl.uniform1i(args["uReflectmap"],3);
				
			gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, jsbuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, jsbuffer.length*4, jsbuffer2);

			Rastgl.stereoDraw(ono3d,function(){
				gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
				gl.drawArrays(gl.TRIANGLES, 0, index);
			});

		
		}
	}
var setNormalMap = function(s,t,p0,p1,p2,u0,v0,u1,v1,u2,v2){
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

	var d,d2;
	d2=1/(du1*dv2-du2*dv1)
	s[0]=-(dv1*dx2-dv2*dx1)*d2
	s[1]=-(dv1*dy2-dv2*dy1)*d2
	s[2]=-(dv1*dz2-dv2*dz1)*d2
	t[0]=(du1*dx2-du2*dx1)*d2
	t[1]=(du1*dy2-du2*dy1)*d2
	t[2]=(du1*dz2-du2*dz1)*d2
	//d=d2/sqrt(s[0]*s[0] +s[1]*s[1] +s[2]*s[2]);
	//s[0]*=d
	//s[1]*=d
	//s[2]*=d
	//d=d2/sqrt(t[0]*t[0] +t[1]*t[1] +t[2]*t[2]);
	//t[0]*=d
	//t[1]*=d
	//t[2]*=d


		
}
	ret.init();
	return ret;

})();
