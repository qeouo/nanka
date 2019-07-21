[vertexshader]
attribute vec2 aPos;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
varying vec2 vUv;
varying lowp vec2 vUnit;
void main(void){
	gl_Position = vec4(aPos ,1.0,1.0);
	vUv = (aPos+ 1.0) * 0.5 * uUvScale +  uUvOffset;
	vUnit = (aPos+ 1.0) * 0.5;
}
[fragmentshader]
precision lowp float;
[common]
varying lowp vec2 vUv;
varying lowp vec2 vUnit;
uniform sampler2D uSampler;

const mediump float coef= 3.0/(4.0*PI);
void main(void){
	float l = length(vec3(fract(vUnit.s* 4.0)*2.0-1.0 ,fract(vUnit.t*2.0)*2.0-1.0,1.0));

    gl_FragColor = encode(textureRGBE( uSampler,vec2(1024.0,512.0),vUv) / (l*l*l*16.0*16.0)*coef);
}

