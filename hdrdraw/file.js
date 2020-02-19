
var save_hdp= function(e){
	var a = e.target;
	var utf8array = Util.convertUtf8("hogehogedata1");
	var utf8array2 = Util.convertUtf8("hogehogedata2");

	var buffer = Zip.create(["hoge.txt","fuga.txt"]
		,[utf8array,utf8array2]);
    var blob = new Blob([buffer], {type: "application/octet-stream"});

    a.href =  window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = "project.zip";
}

var createHdp=function(){
}
var save_hdr= function(e){
	var a = e.target;
	var buffer = joined_img.createExr();
    var blob = new Blob([buffer], {type: "application/octet-stream"});

    a.href =  window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = "preview_hdr.exr";
}
var save_ldr= function(e){
	var a = e.target;

    a.href = preview.toDataURL("image/png");
    a.target = '_blank';
    a.download = "preview_ldr.png";
}
