"use strict"
import Ono3d from "../lib/ono3d.js"
import Rastgl from "../lib/rastgl.js"
import Util from "../lib/util.js"
import Slider from "../lib/slider.js";
import ColorPickerHDR from "../lib/colorpickerhdr.js";
import ColorSelector from "../lib/colorselector.js";
import Engine from "../engine/engine.js"
//オブジェクト読み込み
import Camera from "./go/camera.js";
import Field from "./go/field.js";
import Main from "./go/main.js";
var MainScene=(function(){
	var ret = MainScene=function(){
		Engine.Scene.apply(this);

		var objMan = this.objMan;
		Engine.go.main= objMan.createObj(Engine.goClass.main);
	};
	inherits(ret,Engine.Scene);
	
	return ret;
})();


//グローバル値初期化
globalParam.outline_bold=0;
globalParam.outline_color="0,0,0,0";
globalParam.lightColor1="0.8,0.8,0.8,1";
globalParam.lightColor2="0.8,0.8,0.8,1";
globalParam.lightThreshold1=0.;
globalParam.lightThreshold2=1.;
globalParam.physics=1;
globalParam.physics_=0;
globalParam.smoothing=0;
globalParam.stereomode=0;
globalParam.stereoVolume=1;
globalParam.step=1;
globalParam.fps=60;
globalParam.scene=0;
globalParam.shadow=1;
globalParam.model="./f1.o3o";
globalParam.materialMode = false;
//カスタムマテリアル
globalParam.baseColor= "1,1,1,1";
globalParam.metallic= 0;
globalParam.metalColor= "1,1,1,1";
globalParam.roughness= 0;
globalParam.subRoughness= 0;
globalParam.frenel = 0;
globalParam.opacity= 1.0;
globalParam.ior= 1.1;
globalParam.cNormal= 1.0;
globalParam.emi= 0.0;

globalParam.debugMenu= 0;
globalParam.shader= 0;

//カメラ露光
globalParam.autoExposure=1;
globalParam.exposure_level=0.18;
globalParam.exposure_upper=1;
globalParam.exposure_bloom=0.1;



export default class Testact{
}
Engine.userInit=function(){
	//初期処理

	var select = document.getElementById("cTexture");
	var option;
	//soundbuffer = WebAudio.loadSound('se.mp3');

	


	//設定用インタフェースに初期値セット&変更時のイベント設定
	var control = document.getElementById("control");
	var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));
	var selects= Array.prototype.slice.call(control.getElementsByTagName("select"));
	
	inputs = inputs.concat(selects);

	for(var i=0;i<inputs.length;i++){
		var element = inputs[i];
		var tag = element.id;
		if(!tag)continue;

		element.title = tag;
		if(element.className=="colorpickerhdr"){
			element.value=globalParam[tag];
			element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.value},false);
		}else if(element.type=="checkbox"){
			element.checked=Boolean(globalParam[tag]);
			element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.checked},false);
		}else if(element.type==="text" || element.tagName ==="SELECT"){
			element.value=globalParam[tag];
			element.addEventListener("change",function(evt){globalParam[evt.target.id] = parseFloat(this.value)},false);
			if(!element.value){
				continue;
			}
		}else if(element.type==="radio"){
			var name = element.name;
			if(element.value === ""+globalParam[name]){
				element.checked=1;
			}else{
				element.checked=0;
			}
			element.addEventListener("change",function(evt){globalParam[evt.target.name] = parseFloat(this.value)},false);
			if(!element.checked){
				continue;
			}
		}else{
			element.value=globalParam[tag];
			element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.value},false);
		}
		Util.fireEvent(element,"change");
	}

	document.getElementById("autoExposure").addEventListener("change"
		,function(evt){
			var control = document.getElementById("exposure_setting");
			var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));

			for(var i=0;i<inputs.length;i++){
				var element = inputs[i];
				if(this.checked){
					element.setAttribute("disabled","disabled");
				}else{
					element.removeAttribute("disabled");
				}
			}
	});

	//メインオブジェクト作成
	//Engine.go.main= Engine.objMan.createObj(Engine.goClass.main);
	Engine.scenes.push(new MainScene());
}


window.Util = Util;
	var onl=function(){
		if(Util.getLoadingCount()>0){
			//初期ロードが未完了の場合はメイン処理は開始しない
			setTimeout(onl,100);
		}else{
			if(globalParam.debugMenu){
				debugClose();
			}
			Engine.init(document.getElementById("aaa"));
			Engine.start();
		}

		var a = document.getElementById("aaa");
		a.onresize=function(){

		}
	}
//	window.onl=onl;
onl();
	var debugClose=function(){
		var element = document.getElementById("control");
		if( element.classList.contains('close')){
			element.classList.remove("close");
		}else{
			element.classList.add("close");
		}
	}
	window.debugClose=debugClose;
