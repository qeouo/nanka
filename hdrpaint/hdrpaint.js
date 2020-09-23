Hdrpaint=(function(){
	var Hdrpaint = function(){
	}
	var ret = Hdrpaint;


	ret.createDif=function(layer,left,top,width,height){
		//更新領域の古い情報を保存
		var img = new Img(width,height);
		Img.copy(img,0,0,layer.img,left,top,width,height);
		var dif={};
		dif.img=img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	return ret;
})();
