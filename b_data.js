
var bui_names=["shinki","head","body","arm","leg","rear","weapon","sub"];
class Buso{
	constructor(bui,name,atk,def,spd,lp,bst){
		var bui_name = bui_names[bui];
		this.cd=bui_name + Buso.seq;
		this.bui=bui;
		this.name=name;
		this.atk=atk;
		this.def=def;
		this.spd=spd;
		this.lp=lp;
		this.bst=bst;
		Buso.seq++;
	}

}
Buso.seq=0;

class Shinki extends Buso{
	constructor(name,atk,def,spd,lp,bst,apts){
		super(0,name,atk,def,spd,lp,bst);
		this.apts=apts;
	};
}
class Weapon extends Buso{
	constructor(name,atk,def,spd,lp,bst,category){
		super(6,name,atk,def,spd,lp,bst);
		this.category=category;
	};

}

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


Data.shinkis=[];
Data.shinkis.push(new Shinki("アーンヴァルMk2",0,10,20,0,0,[30,30,0,30,-15,-30,-30,30,0,0,0,30]));
Data.shinkis.push(new Shinki("ストラーフMk2",50,30,0,0,0,[35,35,0,30,0,0,0,30,0,0,-30,0]));

Data.busos=[];
Data.busos.push(new Buso(1,"バトルスキン ヘッド",0,0,0,150,20));
Data.busos.push(new Buso(2,"バトルスキン ボディ",0,0,0,300,0));
Data.busos.push(new Buso(3,"バトルスキン アーム",0,0,0,300,70));
Data.busos.push(new Buso(4,"バトルスキン レッグ",0,0,185,300,50));
Data.busos.push(new Buso(5,"バトルスキン リア",0,0,50,0,150));
Data.busos.push(new Weapon("素手",-4,0,0,0,51,5));

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
	{name:"攻",param:new Param(100,0,0,0,0)}
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
