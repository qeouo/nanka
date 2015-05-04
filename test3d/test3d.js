"use strict"
var Dustg=(function(){
	var HEIGHT=480,WIDTH=360
	var canvas,canvasgl;
	var ctx;
	var div;
	var obj3d;
	var ret=null;
	var oldTime = 0
	var span;
	var mseccount=0;
	var framecount=0;
	var camera;
	var camerazoom=1;
	var calcMat43=new Mat43();
	var calcVec3=new Vec3();
	var jikipos=new Vec3();
	var PI=Math.PI
	var OBJSLENGTH=1024;
	var i;

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
		this.hitareas=[];
		this.matrix=new Mat43();
		this.calcMat43=new Mat43();
	}	
	var createObj = function(func){
		for(i=0;i<OBJSLENGTH;i++){
			var obj=objs[i];
			if(obj.stat!=STAT_EMPTY)continue;
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
	
	var objs=[];
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
	var mainObj=function(obj,msg,param){
		switch(msg){
		case MSG_DRAW:
			ono3d.rotate(-Math.PI/2,1,0,0);
			O3o.drawScene(obj3d.scenes[0],obj.t*24/30,null);
			break;
		}
		return defObj(obj,msg,param);
	}
	
	var mainObj=createObj(mainObj);
	var camera=createObj(defObj);

	var mainloop=function(){
		var nowTime = new Date()
		var obj;

		if(obj3d.objects.length<=0){
			return;
		}
		var i;
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat==STAT_CREATE){
				objs[i].stat=STAT_ENABLE;
			}
			if(objs[i].stat<0){
				objs[i].stat++;
			}
		}

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!=STAT_ENABLE)continue;
			objs[i].func(objs[i],MSG_MOVE,0);
		}
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!=STAT_ENABLE)continue;
			objs[i].t++;
			objs[i].frame++;
		}

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
		ono3d.scale(camerazoom,camerazoom,camerazoom)
		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1],0,1,0)
		ono3d.translate(-camera.p[0],-camera.p[1],-camera.p[2])

		ono3d.setPers(1/2,HEIGHT/WIDTH/2)


		ono3d.smoothing=globalParam.smoothing;
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!=STAT_ENABLE)continue;
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			objs[i].func(objs[i],MSG_DRAW,0);
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}
		gl.clearColor(globalParam.backgroundColorR
				,globalParam.backgroundColorG
				,globalParam.backgroundColorB
				,1.0);
		ono3d.render(Util.ctx)

		ono3d.clear()

		mseccount += (new Date() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!=0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec")
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));

	var span=document.createElement("span");
	parentnode.appendChild(span);

	var div=document.createElement("div");
	parentnode.appendChild(div);
	canvas =document.createElement("canvas");
	canvas.width=WIDTH;
	canvas.height=HEIGHT;
	parentnode.appendChild(canvas);
	canvasgl =document.createElement("canvas");
	canvasgl.width=WIDTH;
	canvasgl.height=HEIGHT;
	parentnode.appendChild(canvasgl);
	ctx=canvas.getContext("2d");
	var gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

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


	if(globalParam.enableGL){
		Rastgl.init(gl);
		canvas.style.display="none";
		canvasgl.style.display="inline";
		Ono3d.setDrawMethod(3);
	}else{
		canvasgl.style.display="none";
		canvas.style.display="inline";
	}

	gl.clearColor(.5, .1, .5,1.0);

	obj3d=O3o.load("./raara.o3o");
	
	globalParam.fps=30;
	Util.setFps(globalParam.fps,mainloop);
	Util.fpsman();

	var light = new ono3d.LightSource()
	light.type =Ono3d.LT_DIRECTION
	light.angle[0] = -0.3
	light.angle[1] = -0.8
	light.angle[2] = -0.4
	light.power=1
	Vec3.norm(light.angle)
	ono3d.lightSources.push(light)
	light = new ono3d.LightSource()
	light.type =Ono3d.LT_AMBIENT
	light.power =0.2;
	ono3d.lightSources.push(light)
	Vec3.set(camera.p,0,5,10)
	Vec3.set(camera.a,0,Math.PI,0)

	return ret;
})()
