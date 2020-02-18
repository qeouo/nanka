
var save_hdp= function(e){
	var a = e.target;
	var buffer = createHdp();
    var blob = new Blob([buffer], {type: "application/octet-stream"});

    a.href =  window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = "project.zip";
}
var calcCrc32 = function(array) {
    var table = [];
    var poly = 0xEDB88320;  
    var result = 0xFFFFFFFF;
 
    //create table
    for(var i = 0; i < 256; i++) {  
        var u = i;  
        for(var j = 0; j < 8; j++) {  
            if(u & 0x1) u = (u >>> 1) ^ poly;  
            else        u >>>= 1;  
        }  
        table.push(u>>>0);
    }
 
    //calculate
    for(var i = 0; i < array.length; i++)
        result = ((result >>> 8) ^ table[array[i] ^ (result & 0xFF)])>>>0;
    return (~result)>>>0;
}
var createHdp=function(){

	var ds = new DataStream(400);
	var ds2 = new DataStream(400);
	
	var filedata = "testdata _ hogehoge";
	var filesize=filedata.length;
	ds2.setTextBuf(filedata);//ファイルデータ
	var crc = calcCrc32(new Uint8Array(ds2.byteBuffer.buffer.slice(0,ds2.idx>>>3)));
	
	//ローカルファイルヘッダ
	ds.setUint32(0x04034b50,true);//シグネチャ
	ds.setUint16(20,true);//バージョン
	ds.setUint16(0x0,true);//ビットフラグ
	ds.setUint16(0x0,true);//圧縮メソッド
	ds.setUint16(0x0,true);//最終変更時間
	ds.setUint16(0x0,true);//最終変更日時
	ds.setUint32(crc,true);//CRC-32
	ds.setUint32(filesize,true);//圧縮サイズ
	ds.setUint32(filesize,true);//非圧縮サイズ
	var name="test.txt";
	ds.setUint16(name.length,true);//ファイル名の長さ
	ds.setUint16(0,true);//拡張フィールドの長さ
	ds.setTextBuf(name);//ファイル名
	ds.fill(0x0,0);//拡張フィールド

	var oldidx=ds.idx;
	ds.setTextBuf(filedata);//ファイルデータ
	//var filesize=ds.idx-oldidx >>> 3;

	//Data descriptor
	//ds.setUint32(crc,true);//CRC-32
	//ds.setUint32(filesize,true);//圧縮サイズ
	//ds.setUint32(filesize,true);//非圧縮サイズ

	//セントラルディレクトリエントリ
	var central_idx= ds.idx;
	ds.setUint32(0x02014b50,true);//シグネチャ
	ds.setUint8(20,true);//バージョン
	ds.setUint8(10,true);//バージョン
	ds.setUint16(20,true);//最小バージョン
	ds.setUint16(0x0,true);//ビットフラグ
	ds.setUint16(0x0,true);//圧縮メソッド
	ds.fill(0x0,2);//最終変更時間
	ds.fill(0x0,2);//最終変更日時
	ds.setUint32(crc,true);//CRC-32
	ds.setUint32(filesize,true);//圧縮サイズ
	ds.setUint32(filesize,true);//非圧縮サイズ
	var name="test.txt";
	ds.setUint16(name.length,true);//ファイル名の長さ
	ds.setUint16(0,true);//拡張フィールドの長さ
	ds.setUint16(0,true);//ファイルコメントの長さ
	ds.setUint16(0,true);//ファイルが開始するディスク番号
	ds.setUint16(0,true);//内部ファイル属性
	ds.setUint32(0,true);//外部ファイル属性
	ds.setUint32(0,true);//ローカルファイルヘッダの相対オフセット
	ds.setTextBuf(name);//ファイル名
	ds.fill(0x0,0);//拡張フィールド
	ds.fill(0x0,0);//ファイルコメント
	var central_size = ds.idx- central_idx >>>3;

	//終端レコード
	ds.setUint32(0x06054b50,true);//シグネチャ
	ds.setUint16(0x0,true);//このディスクの数
	ds.setUint16(0x0,true);//セントラルディレクトリが開始するディスク
	ds.setUint16(1,true);//セントラルディレクトリレコードの数
	ds.setUint16(1,true);//セントラルディレクトリレコードの合計数
	ds.setUint32(central_size,true);//セントラルディレクトリレコードのサイズ
	ds.setUint32(central_idx>>>3,true);//セントラルディレクトリの開始位置のオフセット
	ds.setUint16(0,true);//コメント長さ
	ds.setTextBuf("");//コメント
	
	return ds.byteBuffer.buffer.slice(0,ds.idx>>3);
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
