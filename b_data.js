var atkUp=function(values){
	values.total.atk += Math.trunc(values.subtotal.atk * 0.01);
}

var convCsv=function(csv){
	var tmp = csv.split("\n");
	var ret=[];
	var n=0;
	for(var i=0;i<tmp.length;i++){
		if(tmp[i].trim()==="")continue;
		var res = tmp[i].split(",");
		for(var j=0;j<res.length;j++){
			res[j]=res[j].trim();
			if(res[j]==="-"){
				res[j]=ret[n-1][j];
			}else if(res[j]===""){
				res[j]=-1;
			}else{
				if(res[j].indexOf('"')>=0){
					res[j]=res[j].replaceAll('"','')
				}else{
					res[j]=Number(res[j]);
				}
			}
		}
		ret.push(res);
		n++;
	}
	return ret;
}
var bui_names=["shinki","head","body","arm","leg","rear","weapon","sub"];

class Param{
	constructor(atk=0,def=0,spd=0,lp=0,bst=0){
		this.atk=atk;
		this.def=def;
		this.spd=spd;
		this.lp=lp;
		this.bst=bst;
	}
	set(atk,def,spd,lp,bst){
		this.atk=atk;
		this.def=def;
		this.spd=spd;
		this.lp=lp;
		this.bst=bst;
	}
}
export default class Data{
	constructor(){	
	}
}

Data.param_names=["atk","def","spd","lp","bst"];
Data.default_shinki_param=new Param();


var pussive_csv=`
	"攻撃力アップ[小]"
`
Data.pussives=[];
var ret=convCsv(pussive_csv);
for(var i=0;i<ret.length;i++){
	var res =ret[i];
	var pussive={};
	pussive.name = res[0];
	Data.pussives.push(pussive);
}
Data.pussives[0].func=atkUp;


Data.shinkis=[];



var shinki_csv=`
	"アーンヴァルMk2",0,10,20,0,0,	30,30,0,30,-15,-30,-30,30,0,0,0,30
	"ストラーフMk2",50,30,0,0,0,	35,35,0,30,0,0,0,30,0,0,-30,0
`
var ret=convCsv(shinki_csv);
for(var i=0;i<ret.length;i++){
	var res =ret[i];
	var shinki={};
	shinki.name=res[0];
	shinki.atk=res[1];
	shinki.def=res[2];
	shinki.spd=res[3];
	shinki.lp=res[4];
	shinki.bst=res[5];
	shinki.apts=res.slice(6,6+12);
	Data.shinkis.push(shinki);
}

Data.busos=[];
var buso_csv=`
	1,"バトルスキン ヘッド",0, 0,0,0,150,20 , 0
	1,"aaaa",0, 0,0,0,150,20
	-,-,1, 10,0,20,250,120
	-,-,2, 20,0,20,250,120
	-,-,3, 30,0,20,250,120
	2,"バトルスキン ボディ",0, 0,0,0,300,0,0
	3,"バトルスキン アーム",0, 0,0,0,300,70
	4,"バトルスキン レッグ",0, 0,0,185,300,50
	5,"バトルスキン リア",0, 0,0,50,0,150
	6,"素手",0, -4,0,0,0,51 ,-1,5
`;
var ret=convCsv(buso_csv);
for(var i=0;i<ret.length;i++){
	var res =ret[i];
	var buso={};
	buso.cd="buso_" + i;

	buso.bui=res[0];
	buso.name=res[1];
	buso.rarelity=res[2];
	buso.atk=res[3];
	buso.def=res[4];
	buso.spd=res[5];
	buso.lp=res[6];
	buso.bst=res[7];
	if(res[8] == undefined){
		buso.pussive=-1;
	}else{
		buso.pussive=res[8];
	}
	if(res[9] == undefined){
		buso.category=-1;
	}else{
		buso.category=res[9];
	}
	Data.busos.push(buso);
	console.log(buso);

}




Data.rarelity_bonuses={
	shinki:{
		n:new Param(0,0,0,0,0)
		,r:new Param(5,5,10,50,20)
		,sr:new Param(10,10,20,100,40)
		,ur:new Param(15,15,30,150,60)
	  }
	,head:{
		n:new Param(0,0,0,0,0)
		,r:new Param(5,5,10,50,20)
		,sr:new Param(10,10,20,100,40)
		,ur:new Param(15,15,30,150,60)
	}
	,body:{
		n:new Param(0,0,0,0,0)
		,r:new Param(0,10,0,50,0)
		,sr:new Param(0,20,0,100,0)
		,ur:new Param(0,30,0,150,0)
	}
	,arm:{
		n:new Param(0,0,0,0,0)
		,r:new Param(0,10,0,50,50)
		,sr:new Param(0,20,0,100,100)
		,ur:new Param(0,30,0,150,150)
	}
	,leg:{
		n:new Param(0,0,0,0,0)
		,r:new Param(0,5,20,50,50)
		,sr:new Param(0,10,40,100,100)
		,ur:new Param(0,15,60,150,150)
	}
	,rear:{
		n:new Param(0,0,0,0,0)
		,r:new Param(0,0,0,50,50)
		,sr:new Param(0,0,0,100,100)
		,ur:new Param(0,0,0,150,150)
	}
	,weapon:{
		n:new Param(0,0,0,0,0)
		,r:new Param(0,0,0,50,50)
		,sr:new Param(0,0,0,100,100)
		,ur:new Param(0,0,0,150,150)
	}
}

Data.individuals=[
	{name:"無し(DN)",param:new Param(0,0,0,0,0)}
	,{name:"攻",param:new Param(100,0,0,0,0)}
	,{name:"防",param:new Param(0,100,0,0,0)}
	,{name:"体",param:new Param(0,0,0,100,0)}
	,{name:"ブ",param:new Param(0,0,0,0,50)}
	,{name:"攻防",param:new Param(50,50,0,0,0)}
	,{name:"攻ブ",param:new Param(50,0,0,0,25)}
	,{name:"防体",param:new Param(0,50,0,50,0)}
	,{name:"体ブ",param:new Param(0,0,0,50,25)}
	,{name:"攻防速体ブ",param:new Param(30,30,5,30,15)}
];
Data.shinki_rarelity_bonus={
	  n:new Param(0,0,0,0,0)
	, r:new Param(5,5,10,50,20)
	,sr:new Param(10,10,20,100,40)
	,ur:new Param(15,15,30,150,60)
}
Data.default_shinki_param = {atk:30,def:30,spd:90,lp:300,bst:100};
Data.rarelity_bonus={};
Data.rarelity_bonus.head={
	  n:new Param(0, 0,0,  0,  0)
	, r:new Param(0,10,0, 50, 50)
	,sr:new Param(0,15,0,100,100)
	,ur:new Param(0,20,0,150,150)
}
Data.rarelity_bonus.body={
	  n:new Param(0, 0,0,  0,0)
	, r:new Param(0,10,0, 50,0)
	,sr:new Param(0,20,0,100,0)
	,ur:new Param(0,30,0,150,0)
}
Data.rarelity_bonus.arm={
	  n:new Param(0, 0,0,  0,  0)
	, r:new Param(0,10,0, 50, 50)
	,sr:new Param(0,20,0,100,100)
	,ur:new Param(0,30,0,150,150)
}
Data.rarelity_bonus.leg={
	  n:new Param(0, 0, 0,  0,  0)
	, r:new Param(0, 5,20, 50, 50)
	,sr:new Param(0,10,40,100,100)
	,ur:new Param(0,15,60,150,150)
}
Data.rarelity_bonus.rear={
	  n:new Param(0,0,0,  0,  0)
	, r:new Param(0,0,0, 50, 50)
	,sr:new Param(0,0,0,100,100)
	,ur:new Param(0,0,0,150,150)
}
Data.rarelity_bonus.weapon={
	  n:new Param(0,0,0,0,0)
	, r:new Param(0,0,0,0,0)
	,sr:new Param(0,0,0,0,0)
	,ur:new Param(0,0,0,0,0)
}
Data.categories=["片手斬撃","双斬撃","双頭刃斬撃","両手斬撃","片手打撃","格闘打撃","両手打撃","片手ライト","双ライト","両手ライト","腰持ちヘビー","防具用武器"];

Data.bui_names=["shinki","head","body","arm","leg","rear","weapon","sub"];
