var AssetManager=(function(){
	var AssetManager={};
	var ret=AssetManager;
	var ono3d;

	ret.assetList=[];
	ret.texture=function(path,func){
		if(this.assetList[path]){
			return this.assetList[path];
		}else{
			return Ono3d.loadTexture(path,func);
		}
	}
	ret.bumpTexture=function(path,func){
		if(this.assetList[path]){
			return this.assetList[path];
		}else{
			return Ono3d.loadBumpTexture(path,func);
		}
	}


	return ret;
})();
