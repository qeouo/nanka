[vertexshader]
precision lowp float;
attribute vec3 aPos;
uniform mat4 projectionMatrix;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
varying vec2 vUv;
void main(void){
	gl_Position = projectionMatrix * vec4(aPos,1.0);
	vUv = (aPos.xy+ 1.0) * 0.5 * uUvScale +  uUvOffset;
}

[fragmentshader]
precision lowp float;
varying vec2 vUv;
uniform sampler2D u1;
uniform sampler2D u2;
uniform float ratio;
[common]
void main(void){
	vec4 a = decode(texture2D(u1,vUv));
	vec4 b = decode(texture2D(u2,vUv));

	gl_FragColor = encode(mix(a,b,ratio));
}
