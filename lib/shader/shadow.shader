[vertexshader]
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrix2;
uniform mat4 projectionMatrix3;
attribute vec3 aPos;
varying highp float aZ; 
void main(void){
	vec4 lightpos = vec4(aPos,1.0);
	
	lightpos = projectionMatrix * lightpos;
	float z = lightpos.z;
	lightpos.z=(lightpos.z+40.0)*0.001;
	lightpos = projectionMatrix3 * lightpos;
	gl_Position = projectionMatrix2 * lightpos;
	gl_Position.y*=-1.0;
	gl_Position.x*=-0.5;

	aZ=(projectionMatrix*vec4(aPos,1.0)).z;
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
