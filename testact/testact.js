"use strict"
var Testact=(function(){
	var ret={};

	var gos=["jiki","camera","field","main","msg","msg2"];
	for(var i=0;i<gos.length;i++){
		Util.loadJs("./go/"+ gos[i]+".js");
	}



//グローバル値初期化
globalParam.outline_bold=0;
globalParam.outline_color="000000";
globalParam.lightColor1="808080";
globalParam.lightColor2="808080";;
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
globalParam.baseColor= "ffffff";
globalParam.metallic= 0;
globalParam.metalColor= "ffffff";
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


Engine.userInit=function(){
	//初期処理

	//メインオブジェクト作成
	Engine.go.main= Engine.objMan.createObj(Engine.goClass.main);
}

	return ret;
})()
