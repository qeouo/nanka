"use strict"
var Testact=(function(){
	var ret={};

	var gos=["camera","field","main"];
	for(var i=0;i<gos.length;i++){
		Util.loadJs("./go/"+ gos[i]+".js");
	}

	return ret;
})()
