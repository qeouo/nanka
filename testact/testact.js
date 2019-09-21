"use strict"
var Testact=(function(){
	var ret={};

	var gos=["jiki","camera","field","main","msg","msg2"];
	for(var i=0;i<gos.length;i++){
		Util.loadJs("./go/"+ gos[i]+".js");
	}

	return ret;
})()
