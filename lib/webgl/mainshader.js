"use strict"
var MainShader=(function(){
var gl;
var ret= function(){};
var args;
var program;
var bM= new Array(16);
var svec=new Array(3);
var tvec=new Array(3);
var sbuffer=new Float32Array(2048*3);
var tbuffer=new Float32Array(2048*3);
var sqrt=Math.sqrt;

ret.init= function(){
	gl = Rastgl.gl;

	program = Rastgl.setShaderProgram(" \
attribute vec3 aPos; \
attribute vec3 aNormal; \
attribute vec3 aSvec; \
attribute vec3 aTvec; \
attribute vec4 aColor; \
attribute vec2 aUv; \
attribute float aEmi; \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vSvec; \
varying lowp vec3 vTvec; \
varying lowp vec3 vEye; \
varying lowp float vFar; \
varying lowp float vEmi; \
uniform mat4 projectionMat; \
uniform mat4 lightMat; \
uniform vec3 anglePos;  \
varying lowp vec4 vLightPos; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vFar =1.-(aPos.z-3000.0)/1000.; \
	vColor = vec4(aColor.xyz,aColor.w); \
	vNormal= aNormal; \
	vSvec= normalize(aSvec - dot(aNormal,aSvec)*aNormal); \
	vTvec= normalize(aTvec - dot(aNormal,aTvec)*aNormal); \
	vUv = aUv; \
	vLightPos= lightMat * vec4(aPos,1.0); \
	vEmi = aEmi; \
	vEye = aPos - anglePos ; \
} \
" , " \
varying lowp vec4 vColor; \
varying highp vec2 vUv; \
varying lowp vec3 vNormal; \
varying lowp vec3 vSvec; \
varying lowp vec3 vTvec; \
varying lowp vec3 vEye; \
varying lowp float vFar; \
varying lowp float vEmi; \
varying lowp vec4 vLightPos; \
uniform sampler2D uSampler; \
uniform sampler2D uNormalmap; \
uniform sampler2D uShadowmap; \
uniform sampler2D uEnvmap; \
uniform int uTex; \
uniform lowp vec3 uLight; \
uniform lowp vec3 uLightColor; \
uniform lowp float uAmb; \
uniform lowp vec3 uAmbColor; \
uniform lowp float lightThreshold1; \
uniform lowp float lightThreshold2; \
uniform lowp float normalmappow; \
uniform lowp float f0; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	lowp vec3 nrm; \
	lowp vec2 uv = vUv; \
	if(normalmappow>0.){ \
		lowp mat3 mView = mat3(vSvec,vTvec,vNormal); \
		lowp vec4 nrmmap = texture2D(uNormalmap,vec2(vUv.s,vUv.t)); \
		uv = vUv + vec2( dot(vSvec,vEye),dot(vTvec,vEye))* nrmmap.w/128.0; \
		nrmmap = texture2D(uNormalmap,uv); \
		nrm = normalize(vec3((nrmmap.rg*2.0-1.0).rg,1.0/normalmappow/1.0)); \
		nrm =normalize( mView * nrm); \
	}else{ \
	    nrm = vNormal; \
	} \
	\
	mediump vec3 angle = -dot(vEye,nrm)*nrm*2.0 + vEye; \
	highp vec4 col; \
	highp vec4 colA; \
	col = texture2D(uEnvmap \
		,vec2(atan(angle.x,-angle.z)*_PI*0.5 + 0.5 \
		,-atan(angle.y,length(angle.xz))*_PI + 0.5)); \
	\
	if(col.r<0.5){ colA.r = col.r*2.0;}else{colA.r=col.r*10.0 -4.0;} \
	if(col.g<0.5){ colA.g = col.g*2.0;}else{colA.g=col.g*10.0 -4.0;} \
	if(col.b<0.5){ colA.b = col.b*2.0;}else{colA.b=col.b*10.0 -4.0;} \
	colA.a =  col.a; \
	lowp vec3 light; \
	lowp float diffuse = -dot(normalize(nrm),uLight)*.5+.5; \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	lowp vec4 shadowmap; \
	shadowmap=texture2D(uShadowmap,vec2(vLightPos.x*0.5+0.5,vLightPos.y*0.5+0.5)); \
	lowp float lightz = max(min(vLightPos.z,1.0),-1.); \
	diffuse = (1.-sign(lightz*0.5+0.5-0.01 -shadowmap.z))*0.5 * diffuse; \
	light = diffuse * uLightColor + uAmbColor; \
	light = max(light,clamp(vEmi,0.,1.)); \
	light = clamp(light,0.,1.); \
	lowp vec4 vColor2 = vec4(vColor.xyz * light *clamp(vFar,0.,1.),vColor.w); \
	if(uTex==1){ \
		vColor2 = vColor2 * texture2D(uSampler,vec2(uv.s,uv.t)); \
	} \
	gl_FragColor = mix(vColor2,colA,f0); \
} \
")
	args={};
	gl.useProgram(program);
	args["projectionMat"]=(gl.getUniformLocation(program,"projectionMat"));
	args["lightMat"]=gl.getUniformLocation(program,"lightMat");
	args["aPos"]=Rastgl.initAtt(program,"aPos",3,gl.FLOAT,Rastgl.posGlBuffer);
	args["aNormal"]=Rastgl.initAtt(program,"aNormal",3,gl.FLOAT,Rastgl.normalGlBuffer);
	args["aSvec"]=Rastgl.initAtt(program,"aSvec",3,gl.FLOAT,Rastgl.normalGlBuffer,2048*3*4);
	args["aTvec"]=Rastgl.initAtt(program,"aTvec",3,gl.FLOAT,Rastgl.normalGlBuffer,2048*3*4*2);
	args["aUv"]=Rastgl.initAtt(program,"aUv",2,gl.FLOAT,Rastgl.uvGlBuffer);
	args["aColor"]=Rastgl.initAtt(program,"aColor",4,gl.FLOAT,Rastgl.colorGlBuffer);
	args["aEmi"]=Rastgl.initAtt(program,"aEmi",1,gl.FLOAT,Rastgl.emiGlBuffer);
	args["uColor"]=gl.getUniformLocation(program,"uColor");
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uShadowmap"]=gl.getUniformLocation(program,"uShadowmap");
	args["uNormalmap"]=gl.getUniformLocation(program,"uNormalmap");
	args["uEnvmap"]=gl.getUniformLocation(program,"uEnvmap");
	args["uTex"]=gl.getUniformLocation(program,"uTex");
	args["uLight"]= gl.getUniformLocation(program,"uLight");
	args["uLightColor"]= gl.getUniformLocation(program,"uLightColor");
	args["uAmb"]= gl.getUniformLocation(program,"uAmb");
	args["uAmbColor"]= gl.getUniformLocation(program,"uAmbColor");
	args["lightThreshold1"]= gl.getUniformLocation(program,"lightThreshold1");
	args["lightThreshold2"]= gl.getUniformLocation(program,"lightThreshold2");
	args["normalmappow"]= gl.getUniformLocation(program,"normalmappow");
	args["anglePos"]=gl.getUniformLocation(program,"anglePos");
	args["f0"]=gl.getUniformLocation(program,"f0");
}

	ret.draw=function(ono3d,shadowTex,envtexes,camerap){
		var faceflg=Rastgl.faceflg;
		var renderface
		var posindex=0;
		var index=0;
		var colorindex=0;
		var uvindex=0;
		var faces=ono3d.renderFaces;
		var facessize=ono3d.renderFaces_index;
		var vertices=ono3d.renderVertices;
		var verticessize=ono3d.renderVertices_index;
		var posbuffer = args["aPos"].buffer.jsbuffer;
		var normalbuffer = args["aNormal"].buffer.jsbuffer;
		var colorbuffer = args["aColor"].buffer.jsbuffer;
		var uvbuffer = args["aUv"].buffer.jsbuffer;
		var emibuffer = args["aEmi"].buffer.jsbuffer;

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
				//gl.uniform1f(args["uAmb"],lightSource.power);
				gl.uniform3fv(args["uAmbColor"],new Float32Array(lightSource.color));
			}
		}

		for(var i=0;i<facessize;i++){
			faceflg[i]=false;
		}
		var flg;
		var uv;
		var tex=null;
		var normalmap=null;
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D,shadowTex);
		gl.uniform1i(args["uShadowmap"],1);
		var fa =new Float32Array(3);
		fa[0] = camerap[0];
		fa[1] = camerap[1];
		fa[2] = camerap[2];
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D,envtexes[envtexes.length-1]);
		gl.bindTexture(gl.TEXTURE_2D,envtexes[0]);
		gl.uniform1i(args["uEnvmap"],3);

		gl.uniform3fv(args["anglePos"],fa);
		while(1){
			flg=false;
			colorindex=0;
			uvindex=0;
			posindex=0;
			index=0;
		for(var i=0;i<facessize;i++){
			if(faceflg[i])continue;
			renderface=faces[i];
			if(renderface.operator == Ono3d.OP_TRIANGLES){
			if(flg){
				if(renderface.texture !== tex)continue;
			}else{
				tex=renderface.texture;
				normalmap=renderface.normalmap;
			}
				flg=true;
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

				posindex+=3;
				colorindex+=4;

				if(renderface.texture){
					uvbuffer[uvindex]=renderface.uv[0][0]
					uvbuffer[uvindex+1]=renderface.uv[0][1]
					uvbuffer[uvindex+2]=renderface.uv[1][0]
					uvbuffer[uvindex+3]=renderface.uv[1][1]
					uvbuffer[uvindex+4]=renderface.uv[2][0]
					uvbuffer[uvindex+5]=renderface.uv[2][1]
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
					normalbuffer[2048*3+posindex-9]=svec[0]
					normalbuffer[2048*3+posindex-9+1]=svec[1]
					normalbuffer[2048*3+posindex-9+2]=svec[2]
					normalbuffer[2048*3+posindex-9+3]=svec[0]
					normalbuffer[2048*3+posindex-9+4]=svec[1]
					normalbuffer[2048*3+posindex-9+5]=svec[2]
					normalbuffer[2048*3+posindex-9+6]=svec[0]
					normalbuffer[2048*3+posindex-9+7]=svec[1]
					normalbuffer[2048*3+posindex-9+8]=svec[2]
					normalbuffer[2048*6+posindex-9]=tvec[0]
					normalbuffer[2048*6+posindex-9+1]=tvec[1]
					normalbuffer[2048*6+posindex-9+2]=tvec[2]
					normalbuffer[2048*6+posindex-9+3]=tvec[0]
					normalbuffer[2048*6+posindex-9+4]=tvec[1]
					normalbuffer[2048*6+posindex-9+5]=tvec[2]
					normalbuffer[2048*6+posindex-9+6]=tvec[0]
					normalbuffer[2048*6+posindex-9+7]=tvec[1]
					normalbuffer[2048*6+posindex-9+8]=tvec[2]

				}

				emibuffer[index]=renderface.emt;
				emibuffer[index+1]=renderface.emt;
				emibuffer[index+2]=renderface.emt;

				uvindex+=6;
				index+=3;
			}
			}
			if(!flg)break;
			if(tex){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,tex.gltexture);
				gl.uniform1i(args["uSampler"],0);
				gl.uniform1i(args["uTex"],1);
			}else{
				gl.uniform1i(args["uTex"],0);
				gl.activeTexture(gl.TEXTURE0);
			}
			if(normalmap){
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D,normalmap.gltexture);
				gl.uniform1i(args["uNormalmap"],2);
				gl.uniform1f(args["normalmappow"],normalmap.width/64.);
			}else{
				gl.uniform1f(args["normalmappow"],-1);
			}
				
			Rastgl.setArg(args["aPos"],posbuffer);
			Rastgl.setArg(args["aNormal"],normalbuffer,false);
			Rastgl.setArg(args["aSvec"],null,true);
			Rastgl.setArg(args["aTvec"],null,true);
			Rastgl.setArg(args["aColor"],colorbuffer);
			Rastgl.setArg(args["aUv"],uvbuffer);
			Rastgl.setArg(args["aEmi"],emibuffer);
			gl.uniform1f(args["f0"],0);

			Rastgl.stereoDraw(ono3d,function(){
				gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
				gl.drawArrays(gl.TRIANGLES, 0, colorindex>>2);
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
	return ret;

})();
