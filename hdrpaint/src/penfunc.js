
import Util from "./lib/util.js";
import Hdrpaint from "./hdrpaint.js";
import Layer from "./layer.js";
var id=-1;
export default class PenFunc{
	constructor(){
		this.pen_log=null;
		this.endFlg=0;
		this.idx=0;
		this.ragtime=0;
		var aaa=this;
		setTimeout(function(){aaa.actualDraw();},1);
	}
	end(){
		this.endFlg=1;
	}

	actualDraw(){
		var aaa=this;
		var log = this.pen_log;
		var points = log.param.points;

		if(id>=0){
			clearTimeout(id);
			id=-1;
		}
		
		if(this.endFlg && points.length <= this.idx){
			var layer = Layer.findById(log.param.layer_id);
		var funcs = Hdrpaint.blendfuncs;


			painted_mask.fill(0);
			return;

		}

		if(points.length <= this.idx){
			id =setTimeout(function(){aaa.actualDraw();},16);
			return;
		}

		var now = Date.now();
		var org = points[this.idx];


		var d= this.ragtime - (now-org.time);
		if(d>0){
			id=setTimeout(function(){aaa.actualDraw();},d*0.5);
			return;
		}
		if(this.idx>=1){

			//ログ文面変更
			log.label = ("0000" + log.id).slice(-4) + "| " + log.command;
			log.label += "(" + points[0].pos[0].toFixed(2)+ ","+ points[0].pos[1].toFixed(2)+")-";
			log.label += (points.length-2) +"-";
			log.label += "(" + points[points.length-1].pos[0].toFixed(2)+ ","+ points[points.length-1].pos[1].toFixed(2)+")";
			var option = inputs["history"].options[inputs["history"].selectedIndex];
			Util.setText(option,log.label);

			//今回と前回の座標で直線描画
			Hdrpaint.Command.drawHermitian(log,this.idx);
		}
		this.idx++;

		if(points.length <= this.idx){
			id=setTimeout(function(){aaa.actualDraw();},16);
			return;
		}
		d= Math.max(this.ragtime - (now-org.time),1);
		id=setTimeout(function(){aaa.actualDraw();},d*0.5);
		return;
		
	}
}
