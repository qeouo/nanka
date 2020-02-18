
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
	ds2.setTextBuf(filedata);//�t�@�C���f�[�^
	var crc = calcCrc32(new Uint8Array(ds2.byteBuffer.buffer.slice(0,ds2.idx>>>3)));
	
	//���[�J���t�@�C���w�b�_
	ds.setUint32(0x04034b50,true);//�V�O�l�`��
	ds.setUint16(20,true);//�o�[�W����
	ds.setUint16(0x0,true);//�r�b�g�t���O
	ds.setUint16(0x0,true);//���k���\�b�h
	ds.setUint16(0x0,true);//�ŏI�ύX����
	ds.setUint16(0x0,true);//�ŏI�ύX����
	ds.setUint32(crc,true);//CRC-32
	ds.setUint32(filesize,true);//���k�T�C�Y
	ds.setUint32(filesize,true);//�񈳏k�T�C�Y
	var name="test.txt";
	ds.setUint16(name.length,true);//�t�@�C�����̒���
	ds.setUint16(0,true);//�g���t�B�[���h�̒���
	ds.setTextBuf(name);//�t�@�C����
	ds.fill(0x0,0);//�g���t�B�[���h

	var oldidx=ds.idx;
	ds.setTextBuf(filedata);//�t�@�C���f�[�^
	//var filesize=ds.idx-oldidx >>> 3;

	//Data descriptor
	//ds.setUint32(crc,true);//CRC-32
	//ds.setUint32(filesize,true);//���k�T�C�Y
	//ds.setUint32(filesize,true);//�񈳏k�T�C�Y

	//�Z���g�����f�B���N�g���G���g��
	var central_idx= ds.idx;
	ds.setUint32(0x02014b50,true);//�V�O�l�`��
	ds.setUint8(20,true);//�o�[�W����
	ds.setUint8(10,true);//�o�[�W����
	ds.setUint16(20,true);//�ŏ��o�[�W����
	ds.setUint16(0x0,true);//�r�b�g�t���O
	ds.setUint16(0x0,true);//���k���\�b�h
	ds.fill(0x0,2);//�ŏI�ύX����
	ds.fill(0x0,2);//�ŏI�ύX����
	ds.setUint32(crc,true);//CRC-32
	ds.setUint32(filesize,true);//���k�T�C�Y
	ds.setUint32(filesize,true);//�񈳏k�T�C�Y
	var name="test.txt";
	ds.setUint16(name.length,true);//�t�@�C�����̒���
	ds.setUint16(0,true);//�g���t�B�[���h�̒���
	ds.setUint16(0,true);//�t�@�C���R�����g�̒���
	ds.setUint16(0,true);//�t�@�C�����J�n����f�B�X�N�ԍ�
	ds.setUint16(0,true);//�����t�@�C������
	ds.setUint32(0,true);//�O���t�@�C������
	ds.setUint32(0,true);//���[�J���t�@�C���w�b�_�̑��΃I�t�Z�b�g
	ds.setTextBuf(name);//�t�@�C����
	ds.fill(0x0,0);//�g���t�B�[���h
	ds.fill(0x0,0);//�t�@�C���R�����g
	var central_size = ds.idx- central_idx >>>3;

	//�I�[���R�[�h
	ds.setUint32(0x06054b50,true);//�V�O�l�`��
	ds.setUint16(0x0,true);//���̃f�B�X�N�̐�
	ds.setUint16(0x0,true);//�Z���g�����f�B���N�g�����J�n����f�B�X�N
	ds.setUint16(1,true);//�Z���g�����f�B���N�g�����R�[�h�̐�
	ds.setUint16(1,true);//�Z���g�����f�B���N�g�����R�[�h�̍��v��
	ds.setUint32(central_size,true);//�Z���g�����f�B���N�g�����R�[�h�̃T�C�Y
	ds.setUint32(central_idx>>>3,true);//�Z���g�����f�B���N�g���̊J�n�ʒu�̃I�t�Z�b�g
	ds.setUint16(0,true);//�R�����g����
	ds.setTextBuf("");//�R�����g
	
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
