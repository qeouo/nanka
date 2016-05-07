"use strict"
var Shade=(function(){
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
attribute vec3 aNormal; \
attribute float aEmi; \
attribute float aAmb; \
varying vec3 vNormal; \
varying float vAmb; \
varying float vEmi; \
uniform mat4 projectionMat; \
uniform mat4 lightMat; \
varying lowp vec4 vLightPos; \
void main(void){ \
	gl_Position = projectionMat * vec4(aPos,1.0); \
	vNormal= aNormal; \
	vLightPos= lightMat * vec4(aPos,1.0); \
	vEmi = aEmi; \
	vAmb = aAmb; \
} " ," \
precision mediump float; \
varying vec3 vNormal; \
varying float vAmb; \
varying float vEmi; \
varying lowp vec4 vLightPos; \
uniform sampler2D uSampler; \
uniform sampler2D uShadowmap; \
uniform vec3 uLight; \
uniform vec3 uLightColor; \
uniform vec3 uAmbColor; \
uniform float lightThreshold1; \
uniform float lightThreshold2; \
const highp float _PI = 1.0/3.141592; \
void main(void){ \
	vec3 nrm= normalize(vNormal); \
	lowp vec3 amb = texture2D(uSampler \
		,vec2(atan(nrm.x,-nrm.z)*_PI*0.5 + 0.5 \
		,-atan(nrm.y,length(nrm.xz))*_PI + 0.5)).xyz; \
	float diffuse = -dot(nrm,uLight)*.5+.5; \
	diffuse = clamp((diffuse-lightThreshold1)*lightThreshold2,0.0,1.0); \
	lowp vec4 shadowmap; \
	shadowmap=texture2D(uShadowmap,vec2(vLightPos.x*0.5+0.5,vLightPos.y*0.5+0.5)); \
	lowp float lightz = max(min(vLightPos.z,1.0),-1.); \
	diffuse = (1.-sign(lightz*0.5+0.5-0.01 -shadowmap.z))*0.5 * diffuse; \
	vec3 light = diffuse * uLightColor ; \
	light = mix(light+uAmbColor,amb+light,vAmb); \
	light = max(light,clamp(vEmi,0.,1.)); \
	light = clamp(light,0.,1.); \
	gl_FragColor = vec4(light,1.0); \
} \
")
	args=[];
	args["aPos"]=Rastgl.initAtt(program,"aPos",3,gl.FLOAT,Rastgl.posGlBuffer);
	args["aNormal"]=Rastgl.initAtt(program,"aNormal",3,gl.FLOAT,Rastgl.normalGlBuffer);
	args["aAmb"]=Rastgl.initAtt(program,"aAmb",1,gl.FLOAT,Rastgl.colorGlBuffer);
	args["aEmi"]=Rastgl.initAtt(program,"aEmi",1,gl.FLOAT,Rastgl.emiGlBuffer);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["projectionMat"]=gl.getUniformLocation(program,"projectionMat");
	args["lightMat"]=gl.getUniformLocation(program,"lightMat");
	args["uLight"]= gl.getUniformLocation(program,"uLight");
	args["uLightColor"]= gl.getUniformLocation(program,"uLightColor");
	args["uAmbColor"]= gl.getUniformLocation(program,"uAmbColor");
	args["lightThreshold1"]= gl.getUniformLocation(program,"lightThreshold1");
	args["lightThreshold2"]= gl.getUniformLocation(program,"lightThreshold2");
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["uShadowmap"]=gl.getUniformLocation(program,"uShadowmap");

}	
var bM=new Array(16);
ret.draw=function(ono3d,tex,tex2){
	var renderface
	var posindex=0;
	var index=0;
	var colorindex=0;
	var uvindex=0;
	var faces=ono3d.renderFaces;
	var facessize=ono3d.renderFaces_index;
	var vertices=ono3d.renderVertices;
	var verticessize=ono3d.renderVertices_index;
	var posbuffer=args["aPos"].buffer.jsbuffer;
	var normalbuffer=args["aNormal"].buffer.jsbuffer;
	var ambbuffer=args["aAmb"].buffer.jsbuffer;
	var emibuffer=args["aEmi"].buffer.jsbuffer;

	gl.useProgram(program);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
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
	ono3d.setOrtho(10.0,10.0,8.0,40.0);
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

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,tex);
	gl.uniform1i(args["uSampler"],0);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,tex2);
	gl.uniform1i(args["uShadowmap"],1);

	posindex=0;
	index=0;
	for(var i=0;i<facessize;i++){
		renderface=faces[i];
		if(renderface.operator == Ono3d.OP_TRIANGLES){
			var smoothing=renderface.smoothing
			var vertices = renderface.vertices;
			var nx = renderface.normal[0] * (1-smoothing);
			var ny = renderface.normal[1] * (1-smoothing);
			var nz = renderface.normal[2] * (1-smoothing);
			var vertex=vertices[0];
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[1]
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz
			posindex+=3;

			vertex=vertices[2]
			posbuffer[posindex]=vertex.pos[0]
			posbuffer[posindex+1]=vertex.pos[1]
			posbuffer[posindex+2]=vertex.pos[2]
			normalbuffer[posindex]=vertex.normal[0] * smoothing + nx
			normalbuffer[posindex+1]=vertex.normal[1] * smoothing + ny
			normalbuffer[posindex+2]=vertex.normal[2] * smoothing + nz

			emibuffer[index]=renderface.emt;
			emibuffer[index+1]=renderface.emt;
			emibuffer[index+2]=renderface.emt;

			ambbuffer[index]=renderface.env;
			ambbuffer[index+1]=renderface.env;
			ambbuffer[index+2]=renderface.env;

			posindex+=3;
			index+=3;
		}
	}
		
	Rastgl.setArg(args["aPos"],posbuffer);
	Rastgl.setArg(args["aNormal"],normalbuffer);
	Rastgl.setArg(args["aEmi"],emibuffer);
	Rastgl.setArg(args["aAmb"],ambbuffer);

	Rastgl.stereoDraw(ono3d,function(){
		gl.uniformMatrix4fv(args["projectionMat"],false,new Float32Array(ono3d.projectionMat));
		gl.drawArrays(gl.TRIANGLES, 0, index);
	});
}
	return ret;
})();
