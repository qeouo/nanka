var AssetManager=(function(){
	var AssetManager={};
	var ret=AssetManager;
	var ono3d;

	ret.assetList=[];
	ret.loadTexture=function(path,func){
		if(this.assetList[path]){
			func();
			return this.assetList[path];
		}else{
			return ono3d.loadTexture(path,func);
		}
	}


	return ret;
});
