[vertexshader]
attribute vec2 aPos;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
varying vec2 vUv;
void main(void){
		gl_Position = vec4(aPos ,1.0,1.0);
			vUv = (aPos+ 1.0) * 0.5 * uUvScale +  uUvOffset;
}
[fragmentshader]
precision lowp float;
[common]
varying lowp vec2 vUv;
uniform sampler2D uSampler;

void main(void){
	float l = length(vec3(fract(vUv.s* 4.0)*2.0-1.0 ,fract(vUv.t*2.0)*2.0-1.0,1.0));

    gl_FragColor = encode(textureRGBE( uSampler,vec2(1024.0,512.0),vUv) / (l*l*l));
}

