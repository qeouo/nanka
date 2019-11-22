[vertexshader]
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrix2;
uniform mat4 projectionMatrix3;
attribute vec3 aPos;
varying highp float aZ; 
void main(void){
	vec4 lightpos = vec4(aPos,1.0);
	
	aZ = (projectionMatrix * lightpos).z;

	vec4 a = (projectionMatrix2 * lightpos);
	gl_Position = projectionMatrix2 * lightpos;
	aZ=(aZ+1.0)*0.5;
}
[fragmentshader]
precision lowp float; 
[common]
varying highp float aZ; 
void main(void){
	gl_FragColor= encodeFull_(aZ);
	gl_FragColor= vec4(vec3(aZ),1.0);
	if(abs(gl_FragCoord.x-512.)>510. || abs(gl_FragCoord.y-512.)>510.){
		gl_FragColor= vec4(1.,1.,1.,1.);
	}
}
