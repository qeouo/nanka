"use strict"
var Test3d=(function(){
	var ret={};
	var HEIGHT=480,WIDTH=720
	var obj3d;
	var PI=Math.PI;
	var OBJSLENGTH=1024;
	var i;
	var gl;
	var objs=[];
	var tex;

	var STAT_EMPTY=0
		,STAT_ENABLE=1
		,STAT_CREATE=2

		,TYPE_EFFECT=i=0
		
		,MSG_CREATE=++i
		,MSG_MOVE=++i
		,MSG_DRAW=++i
		;
	
	var Obj = function(){
		this.p=new Vec3();
		this.scale=new Vec3();
		this.angle=0;
		this.v=new Vec3();
		this.a=new Vec3();
		this.pos2=new Vec3();
		this.stat=STAT_EMPTY;
		this.type=0;
		this.hp=1;
		this.t=0;
		this.hitareas=[];
		this.matrix=new Mat43();
	}	
	var createObj = function(func){
		for(i=0;i<OBJSLENGTH;i++){
			var obj=objs[i];
			if(obj.stat!==STAT_EMPTY)continue;
			obj.func=func;
			Mat43.setInit(obj.matrix);
			obj.parent=null;
			Vec3.set(obj.scale,1,1,1);
			obj.angle=0;
			obj.t=0;
			obj.hp=1;
			obj.stat=STAT_CREATE;
			obj.pattern=0;
			obj.frame=0;
			obj.pos2=new Vec3();
			obj.type=TYPE_EFFECT;
			obj.func(obj,MSG_CREATE,0);
			return obj;
		}
		return null;
	}
	var deleteObj=function(obj){
		obj.stat=-10;
	}
	
	for(i=0;i<OBJSLENGTH;i++){
		var obj=new Obj();
		obj.num=i;
		objs.push(obj);
	}
	var defObj=function(obj,msg,param){
		switch(msg){
		case MSG_CREATE:
			break;
		case MSG_MOVE:
			break;
		case MSG_DRAW:
			break;
		case MSG_HIT:
			obj.hp--;
			break;
		case MSG_FRAMEOUT:
			deleteObj(obj);
			break;
		}
		return;
	}
//paste shader
var posbuffer=new Float32Array(4*3);
var paste={};
var createPaste= function(){
var vs=" \
attribute vec2 aPos; \
uniform mat4 viewMat; \
varying lowp vec3 vAngle; \
void main(void){ \
	gl_Position = vec4(aPos,1,1.0); \
	vAngle = (viewMat * vec4(aPos[0],-aPos[1],-1.,1.)).xyz; \
} \
";
var fs=" \
uniform sampler2D uSampler; \
varying lowp vec3 vAngle; \
const lowp float PI = 3.14159265; \
void main(void){ \
	normalize(vAngle); \
	lowp float u = -atan(vAngle[0],vAngle[2])/(PI*2.); \
	lowp float v = atan(vAngle[1],sqrt(vAngle[2]*vAngle[2]+vAngle[0]*vAngle[0]))/PI+0.5; \
	gl_FragColor= texture2D(uSampler,vec2(u,v)); \
} \
";
	var program= Rastgl.setShaderProgram(vs,fs);
	var args=[];
	args["aPos"]=Rastgl.createBuffer2(program,"aPos",2,gl.FLOAT);
	args["uSampler"]=gl.getUniformLocation(program,"uSampler");
	args["viewMat"]=gl.getUniformLocation(program,"viewMat");
	paste.program=program;
	paste.args=args;
}	
var mat4fv=new Array(16);
var paste=function(src){
	var args=paste.args;
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0,0,720,480);

	posbuffer[0]=-1;
	posbuffer[1]=-1;
	posbuffer[2]=1;
	posbuffer[3]=-1;
	posbuffer[4]=1;
	posbuffer[5]=1;
	posbuffer[6]=-1;
	posbuffer[7]=1;


	gl.useProgram(paste.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,src);
	gl.uniform1i(args["uSampler"],0);
			
	gl.bindBuffer(gl.ARRAY_BUFFER, args["aPos"].buffer);
	gl.enableVertexAttribArray(args["aPos"].att);
	gl.vertexAttribPointer(args["aPos"].att, 2,gl.FLOAT , false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, posbuffer, gl.STATIC_DRAW);

	mat4fv[0]=ono3d.viewMatrix[0];
	mat4fv[1]=ono3d.viewMatrix[1];
	mat4fv[2]=ono3d.viewMatrix[2];
	mat4fv[3]=ono3d.viewMatrix[3];
	mat4fv[4]=ono3d.viewMatrix[4];
	mat4fv[5]=ono3d.viewMatrix[5];
	mat4fv[6]=ono3d.viewMatrix[6];
	mat4fv[7]=ono3d.viewMatrix[7];
	mat4fv[8]=ono3d.viewMatrix[8];
	mat4fv[9]=ono3d.viewMatrix[9];
	mat4fv[10]=ono3d.viewMatrix[10];
	mat4fv[11]=ono3d.viewMatrix[11];
	mat4fv[12]=ono3d.viewMatrix[12];
	mat4fv[13]=ono3d.viewMatrix[13];
	mat4fv[14]=ono3d.viewMatrix[14];
	mat4fv[15]=ono3d.viewMatrix[15];
	Mat44.getInv(mat4fv,ono3d.viewMatrix);

	gl.uniformMatrix4fv(args["viewMat"],false,new Float32Array(mat4fv));

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
}

		var url=location.search.substring(1,location.search.length)
		globalParam.outlineWidth=2;
		globalParam.outlineColor="000000";
		globalParam.lightcol1="ffffff";
		globalParam.lightcol2="808080";
		globalParam.lightThreshold1=0.5;
		globalParam.lightThreshold2=0.6;
		globalParam.physics=1;
		globalParam.smoothing=1;
		globalParam.stereomode=1;
		globalParam.stereoscope=1;
		globalParam.step2=1;
		globalParam.fps=30;
		globalParam.scene=2;
		globalParam.texturepath="./sky2.png";

		var args=url.split("&")

		for(i=args.length;i--;){
			var arg=args[i].split("=")
			if(arg.length >1){
				if(!isNaN(arg[1]) && arg[1]!=""){
					globalParam[arg[0]] = +arg[1]
				}else{
					globalParam[arg[0]] = arg[1]
				}
			}
		}
	
	var camera=createObj(defObj);
	var camera2=createObj(defObj);
	var camerazoom=1;
	var viewMatrix=new Mat44();
	var span;
	var oldTime = 0;
	var mseccount=0;
	var framecount=0;
	var vec3=new Vec3();
	var mainloop=function(){
		var nowTime = new Date()
		var obj;

		var i;
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat===STAT_CREATE){
				objs[i].stat=STAT_ENABLE;
			}
			if(objs[i].stat<0){
				objs[i].stat++;
			}
		}

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].func(objs[i],MSG_MOVE,0);
		}

		vec3[0]=0
		vec3[1]=0
		vec3[2]=0
		camera2.a[0]=(Util.cursorY-HEIGHT/2)/HEIGHT*4;
		camera2.a[1]=-(Util.cursorX-WIDTH/2)/WIDTH*4+PI;
		//camera2.a[2]=-(Util.cursorX-WIDTH)/WIDTH*10;
		camera.a[0]+=(camera2.a[0]-camera.a[0])*0.1
		camera.a[1]+=(camera2.a[1]-camera.a[1])*0.1
		camera.a[2]+=(camera2.a[2]-camera.a[2])*0.1
		//homingCamera(camera.a,vec3,camera.p);

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].t++;
			objs[i].frame++;
		}

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
//		ono3d.scale(camerazoom,camerazoom,camerazoom)

		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1],0,1,0)
		ono3d.translate(-camera.p[0],-camera.p[1],-camera.p[2])

		ono3d.rf=0;
		if(globalParam.outlineWidth>0.){
			ono3d.lineWidth=globalParam.outlineWidth;
			ono3d.rf=Ono3d.RF_OUTLINE;
			Util.hex2rgb(ono3d.outlineColor,globalParam.outlineColor);
		}
		ono3d.smoothing=globalParam.smoothing;


		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			objs[i].func(objs[i],MSG_DRAW,0);
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		
		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity()
		ono3d.scale(100,100,100);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0,0,720,480);
		ono3d.setPers(1/0.75,HEIGHT/WIDTH/0.75)
		ono3d.projectionMat[8]=0;
		ono3d.projectionMat[12]=0;
		Mat44.dotMat44Mat43(ono3d.projectionMat,ono3d.projectionMat,ono3d.viewMatrix);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()

		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1],0,1,0)
		//ono3d.rotate(-(-Math.PI/2),1,0,0)
		//ono3d.rotate(-(Math.PI/2),0,1,0)
		//ono3d.rotate(0,0,0,1)

		paste(tex.image.gltexture);
		
		gl.flush();

		ono3d.clear()


		mseccount += (new Date() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec")
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));


	var div=document.createElement("div");
	parentnode.appendChild(div);
	var canvas =document.createElement("canvas");
	canvas.width=WIDTH;
	canvas.height=HEIGHT;
	parentnode.appendChild(canvas);
	var canvasgl =document.createElement("canvas");
	canvasgl.width=WIDTH;
	canvasgl.height=HEIGHT;
	canvasgl.style.width="100%";
	canvasgl.style.height="100%";
	parentnode.appendChild(canvasgl);
	var ctx=canvas.getContext("2d");
	gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

	Util.init(canvas,document.body);
	var ono3d = new Ono3d()
	O3o.setOno3d(ono3d)
	ono3d.init(canvas,ctx);

	ono3d.rendercanvas=canvas;
	if(gl){
		globalParam.enableGL=true;
	}else{
		globalParam.enableGL=false;
	}
	globalParam.gl=gl;


	if(globalParam.enableGL){
		Rastgl.init(gl,ono3d);
		canvas.style.width="1px";
		canvas.style.height="1px";
		//canvas.style.border="1px solid black";
		canvasgl.style.display="inline";
		Ono3d.setDrawMethod(3);
	}else{
		canvasgl.style.display="none";
		canvas.style.display="inline";
	}
	createPaste();
	tex=O3o.loadTexture(globalParam.texturepath);

	gl.clearColor(1, 1, 1,1.0);

	//obj3d=O3o.load(globalParam.model);
	
	Util.setFps(globalParam.fps,mainloop);

	Vec3.set(camera.p,0,6,10)
	Vec3.set(camera.a,0,PI,0)

	span=document.getElementById("cons");
	ret.changeScene=function(){
		phyObjs=null;
		globalParam.physics_=false;
	}
	var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=-Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
	}
	Util.fpsman();
	return ret;
})()
