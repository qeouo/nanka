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

float limit = 0.99;
vec3 boxUv2Angle(vec2 uv){
	vec3 angle;
	float xx=uv.s*4.0;
	float yy=uv.t*2.0;
	if(yy<1.0){
		yy=-(yy*2.0-1.0);
		angle.y=yy;
		if(xx<1.0){
			angle.z=1.0;
			angle.x=-(xx*2.0-1.0);
		}else if(xx<2.0){
			xx-=1.0;
			angle.z=-(xx*2.0-1.0);
			angle.x=-1.0;
		}else if(xx<3.0){
			xx-=2.0;
			angle.z=-1.0;
			angle.x=xx*2.0-1.0;
		}else{
			xx-=3.0;
			angle.z=(xx*2.0-1.0);
			angle.x=1.0;
		}
	}else{
		yy-=1.0;
		yy=-(yy*2.0-1.0);
		if(xx<1.0){
			angle.y=-1.0;
			angle.x=-(xx*2.0-1.0);
			angle.z=yy;
		}else if(xx<2.0){
			xx-=1.0;
			angle.y=1.0;
			angle.x=-(xx*2.0-1.0);
			angle.z=-yy;
		}else{
			angle.y=1.0;
			angle.x=1.0;
			angle.z=1.0;
		}
	}
	return angle;
	//return normalize(angle);
}
void main(void){
	vec3 angle;

	angle = boxUv2Angle(vUv);
	float l = length(angle);

    gl_FragColor = encode(textureRGBE( uSampler,vec2(512.0,512.0),vUv) / (l*l*l));
}

