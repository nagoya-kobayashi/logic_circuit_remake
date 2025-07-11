/**
論理回路シミュレーター
*/

//######グローバル変数宣言#########################
var scale = 0.5; //canvas領域への配置・描画時の座標に対する拡大縮小率
var dx = 0;   //canvas領域への配置・描画時の座標に対するx軸方向の調整
var dy = 20;     //canvas領域への配置・描画時の座標に対するy軸方向の調整
var mode = null;  //メニューアイコンの何を選んでいるか
var selectA = null;
var selectB = null;
var debug_msg = ""; //デバッグメッセージ

var falseStrokeStyle = '#333'; //通電してない論理ゲートの線の色
var falseLineWidth = 3*scale;  //通電してない論理ゲートの線の太さ
var falseFillStyle = '#666';   //通電してない論理ゲートの塗りつぶしの色
var trueStrokeStyle = '#666';  //通電してる論理ゲートの線の色
var trueLineWidth = 3*scale;   //通電してる論理ゲートの線の太
var trueFillStyle = '#666';    //通電してる論理ゲートの塗りつぶしの色
var selectedStrokeStyle = '#33F';  //カーソルが当たっている論理ゲートの線の色



//######グローバル関数#############################

/**
 * 描画色を設定する関数
 * @param ctx 描画用コンテキスト
 * @param status 通電時はtrue、非通電時はfalse
 */
setColor = function(ctx, status){
        if(status){                             //＜通電時＞
            ctx.strokeStyle = trueStrokeStyle;  //線の色
            ctx.lineWidth = trueLineWidth;      //線の太さ
            ctx.fillStyle = trueFillStyle;      //塗りつぶしの色
        }else{                                  //＜非通電時＞
            ctx.strokeStyle = falseStrokeStyle; //線の色
            ctx.lineWidth = falseLineWidth;     //線の太さ
            ctx.fillStyle = falseFillStyle;     //塗りつぶしの色
        }
}


//######論理回路パーツのクラス#############################

/**
 * 回路の導線を定義したクラス
 * 1つの直線で1つのインスタンスを生成することとする。
 * 線を折れ線としたい場合は、複数のインスタンスを生成し、
 * connect関数で接続していくことでそれを実現する。
 */
class Lead{
    constructor(in1,out1){
/**/console.log(out1);
        this.in1 = in1;
        this.out1 = out1;
        if(out1.setIn(this)==false){
            return null;
        }else{
            in1.setOut(this);
        }
    }
    /**
     * 動線や論理ゲートを接続するメソッド
     * 終端に接続するオブジェクトを指定し、相互に接続する。
     * 開始点側に接続したいオブジェクトがある場合は本メソッドではなく、
     * 開始点側のオブジェクトのconnectメソッドを呼び出し、
     * メソッドの引数に当該オブジェクトを指定することで実現する。
     * @param out1 動線の終端に接続するオブジェクト(動線や論理ゲート)
     */
    connect(out1){
        this.out1 = out1; //自身の終端側の動線や論理ゲートを設定する
        out1.in1 = this;  //終点側の動線や論理ゲートの入力を自身で設定する
    }
    
    /**
     * 通電を制御するメソッド
     * 開始点側の動線や論理ゲートの通電状態に応じて、
     * 当該オブジェクトが電気を通す場合はstatusをtrueとする。
     * 逆に当該オブジェクトが電気を通さない場合はstatusをfalseとする。
     * 終端側に接続したオブジェクトに対してもturnメソッドを呼び出すことで、
     * 後続の回路の通電状態も更新されていき、回路全体の通電状態が更新される。
     */
    turn(){
        if(this.in1.status){
            this.status = true;  //開始点側が通電なら電気を通す
        }else{
            this.status = false; //開始点側が非通電なら電気を通さない
        }
        this.out1.turn();
    }
    
    /**
     * webページのcanvasエリアに描画を行うメソッド
     * @param ctx webページのcanvasエリアへ描画命令を行うための制御オブジェクト
     */
    draw(ctx){
        
        var lx, ly;
        if(this.out1.in2 != null){
            if(this.out1.in1 == this){
                lx = this.out1.x - 10;
                ly = (this.in1.y + this.out1.y)/2 - 10;
            }else{
                lx = this.out1.x + 10;
                ly = (this.in1.y + this.out1.y)/2 + 10;
            }
        }else{
            lx = this.out1.x;
            ly = (this.in1.y + this.out1.y)/2;
        }
        
        setColor(ctx, this.status);
        ctx.beginPath();
        ctx.moveTo(this.in1.x, this.in1.y);
        ctx.lineTo(this.in1.x, ly);
        ctx.lineTo(lx, ly);
        ctx.lineTo(lx, this.out1.y);
        ctx.moveTo(lx, this.out1.y);
        ctx.closePath();
        ctx.stroke();
    }
}

/**
 * 回路の導線の分岐点を定義したクラス
 * 1つの導線から2つの導線に分岐する。
 * つまり、connect関数では3つの導線を指定することとなる。
 */
class Branch{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
    }

    connect(in1, out1, out2){
        this.in1 = in1;   //分岐点の入力側の導線を設定する
        in1.out1 = this;  //入力側の導線の終点側に自身(分岐点)を設定する
        this.out1 = out1; //分岐点の出力側の導線１つめを設定する
        out1.in1 = this;
        this.out2 = out2; //分岐点の出力側の導線つめを設定する
        out2.in1 = this;
    }
    
    turn(){
        if(this.in1.status){
            this.status = true;
        }else{
            this.status = false;
        }
        if(this.out1 != null){this.out1.turn();}
        if(this.out2 != null){this.out2.turn();}
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6*scale, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

}

//######入力電球パーツのクラス#############################

class InSwitch{
    constructor(x, y, label){
        this.x = x*scale+dx;
        this.y = y*scale+dy+10;
        this.label = label;
        this.status = false;
        this.selected = false;
    }

    connect(out1){
        this.out1 = new Array(out1);
        out1.in1 = this;
    }
    
    turn(){
        if(this.status){
            this.status = false;
        }else{
            this.status = true;
        }
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x -  0*scale, this.y - 45*scale);
        ctx.lineTo(this.x -  8*scale, this.y - 45*scale);
        ctx.lineTo(this.x -  8*scale, this.y - 32*scale);
        ctx.lineTo(this.x - 28*scale, this.y - 32*scale);
        ctx.lineTo(this.x - 28*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 28*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 28*scale, this.y - 32*scale);
        ctx.lineTo(this.x +  8*scale, this.y - 32*scale);
        ctx.lineTo(this.x +  8*scale, this.y - 45*scale);
        ctx.lineTo(this.x +  0*scale, this.y - 45*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.moveTo(this.x - 28*scale, this.y +  16*scale);
        ctx.lineTo(this.x - 12*scale, this.y +  0*scale);
        ctx.stroke();
        ctx.moveTo(this.x - 28*scale, this.y +  32*scale);
        ctx.lineTo(this.x +  4*scale, this.y +  0*scale);
        ctx.stroke();
        ctx.moveTo(this.x - 25*scale, this.y +  45*scale);
        ctx.lineTo(this.x + 20*scale, this.y +   0*scale);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.fillText(this.label,this.x-ctx.measureText(this.label).width/2,this.y-55*scale);
    }
    setOut(out1){
        if(this.out1 != null){
            this.out1.push(out1);
        }else{
            this.out1 = new Array(out1);
        }
    }
    setIn(in1){
    }
    /**
     * 当たり判定を行うメソッド
     * 自身の座標とマウスカーソルの座標を比較し、カーソルが当たっているのかを判定する。
     * @param x マウスカーソル(スマホの場合はタップ位置)のx座標
     * @param y マウスカーソル(スマホの場合はタップ位置)のy座標
     * @return 判定結果。当たっていたらtrue、当たっていなかったらfalseを返す。
     */
    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 50*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }
    
}


//######出力電球パーツのクラス#############################

class OutSwitch{
    constructor(x, y, label){
        this.x = x*scale+dx;
        this.y = y*scale+dy-10;
        this.label = label;
        this.status = false;
    }

    connect(in1){
        this.in1 = in1;
        in1.out1 = this;
    }
    
    turn(){
        if(this.in1.status){
            this.status = true;
        }else{
            this.status = false;
        }
    }
    
    draw(ctx){
        setColor(ctx, this.status);

        ctx.beginPath();
        ctx.arc(this.x, this.y - 18*scale , 32*scale, 2*Math.PI/6, -Math.PI/6*8, true);
        ctx.lineTo(this.x - 15*scale, this.y + 38*scale);
        ctx.lineTo(this.x + 15*scale, this.y + 38*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - 15*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 15*scale, this.y + 45*scale);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - 12*scale, this.y + 50*scale);
        ctx.lineTo(this.x + 12*scale, this.y + 50*scale);
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.fillText(this.label,this.x-ctx.measureText(this.label).width/2 ,this.y+80*scale);
    }
    setOut(out1){
    }
    setIn(in1){
        if(this.in1 == null){
            this.in1 = in1;
        }else{
            return false;
        }
    }
    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 50*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}


//######論理ゲート(入力2、出力1)のクラス#############################

/**
 * ANDゲートのクラス
 * 入力側の導線(Leadクラスのインスタンス)が2つとも通電状態ならば、
 * 自身を通電状態とした上で後続のオブジェクト(導線や論理ゲート)の通電状態を更新する
 */
class And{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false; //カーソルが当たっているかのフラグ
    }

    connect(in1, in2, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.in2 = in2;
        in2.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    
    turn(){
        if(this.in1.status && this.in2.status){
            this.status = true;
        }else{
            this.status = false;
        }
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x - 35*scale, this.y - 45*scale);
        ctx.lineTo(this.x - 35*scale, this.y + 15*scale);
        ctx.arc(this.x, this.y + 15*scale, 35*scale, Math.PI, 2 * Math.PI, true);
        ctx.lineTo(this.x + 35*scale, this.y + 15*scale);
        ctx.lineTo(this.x + 35*scale, this.y - 45*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        this.counter++;
    }
    setIn(in1){
        if(this.in1 == null){
            this.in1 = in1;
        }else if(this.in2 == null){
            this.in2 = in1;
            if(this.in1.in1.x > this.in2.in1.x){
                var w = this.in1;
                this.in1 = this.in2;
                this.in2 = w;
            }
        }else{
            return false;
        }
    }
    setOut(out1){
        if(this.out1 != null){
            this.out1.push(out1);
        }else{
            this.out1 = new Array(out1);
        }
    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }
}

/**
 * ORゲートのクラス
 */
class Or{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, in2, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.in2 = in2;
        in2.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    turn(){
        if(this.in1.status || this.in2.status){
            this.status = true;
        }else{
            this.status = false;
        }
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x - 35*scale, this.y - 45*scale);
        ctx.lineTo(this.x - 33*scale, this.y +  5*scale);
        ctx.lineTo(this.x - 28*scale, this.y + 15*scale);
        ctx.lineTo(this.x - 20*scale, this.y + 25*scale);
        ctx.lineTo(this.x - 10*scale, this.y + 35*scale);
        ctx.lineTo(this.x -  0*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 10*scale, this.y + 35*scale);
        ctx.lineTo(this.x + 20*scale, this.y + 25*scale);
        ctx.lineTo(this.x + 28*scale, this.y + 15*scale);
        ctx.lineTo(this.x + 33*scale, this.y +  5*scale);
        ctx.lineTo(this.x + 35*scale, this.y - 45*scale);
        ctx.lineTo(this.x + 22*scale, this.y - 40*scale);
        ctx.lineTo(this.x + 10*scale, this.y - 37*scale);
        ctx.lineTo(this.x -  0*scale, this.y - 35*scale);
        ctx.lineTo(this.x - 10*scale, this.y - 37*scale);
        ctx.lineTo(this.x - 22*scale, this.y - 40*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    setIn(in1){
        if(this.in1 == null){
            this.in1 = in1;
        }else if(this.in2 == null){
            this.in2 = in1;
        }else{
            return false;
        }
    }
    setOut(out1){
        if(this.out1 != null){
            this.out1.push(out1);
        }else{
            this.out1 = new Array(out1);
        }
    }
    
    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}

/**
 * XORゲートのクラス
 */
class Xor{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, in2, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.in2 = in2;
        in2.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    turn(){
        if((this.in1.status && !this.in2.status ) || (!this.in1.status && this.in2.status)){
            this.status = true;
        }else{
            this.status = false;
        }
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x - 35*scale, this.y - 35*scale);
        ctx.lineTo(this.x - 33*scale, this.y +  5*scale);
        ctx.lineTo(this.x - 28*scale, this.y + 15*scale);
        ctx.lineTo(this.x - 20*scale, this.y + 25*scale);
        ctx.lineTo(this.x - 10*scale, this.y + 35*scale);
        ctx.lineTo(this.x -  0*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 10*scale, this.y + 35*scale);
        ctx.lineTo(this.x + 20*scale, this.y + 25*scale);
        ctx.lineTo(this.x + 28*scale, this.y + 15*scale);
        ctx.lineTo(this.x + 33*scale, this.y +  5*scale);
        ctx.lineTo(this.x + 35*scale, this.y - 35*scale);
        ctx.lineTo(this.x + 22*scale, this.y - 30*scale);
        ctx.lineTo(this.x + 10*scale, this.y - 27*scale);
        ctx.lineTo(this.x -  0*scale, this.y - 25*scale);
        ctx.lineTo(this.x - 10*scale, this.y - 27*scale);
        ctx.lineTo(this.x - 22*scale, this.y - 30*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 35*scale, this.y - 45*scale);
        ctx.lineTo(this.x + 22*scale, this.y - 40*scale);
        ctx.lineTo(this.x + 10*scale, this.y - 37*scale);
        ctx.lineTo(this.x -  0*scale, this.y - 35*scale);
        ctx.lineTo(this.x - 10*scale, this.y - 37*scale);
        ctx.lineTo(this.x - 22*scale, this.y - 40*scale);
        ctx.lineTo(this.x - 35*scale, this.y - 45*scale);
        ctx.stroke();
    }
    setIn(in1){
        if(this.in1 == null){
            this.in1 = in1;
        }else if(this.in2 == null){
            this.in2 = in1;
        }else{
            return false;
        }
    }
    setOut(out1){
        if(this.out1 != null){
            this.out1.push(out1);
        }else{
            this.out1 = new Array(out1);
        }
    }
    
    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}

/**
 * 論理ゲートの代わりにはてなマークを表示するクラス
 * 通電はしない
 */
class Question{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, in2, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.in2 = in2;
        in2.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    turn(){
        this.status = false;
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        ctx.strokeStyle = '#333';
        ctx.fillStyle = '#DDD';
        ctx.lineWidth = 3*scale;
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.arc(this.x, this.y, 45*scale, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.moveTo(this.x - 15*scale, this.y);
        ctx.lineTo(this.x - 20*scale, this.y - 10*scale);
        ctx.lineTo(this.x - 12*scale, this.y - 25*scale);
        ctx.lineTo(this.x - 0*scale, this.y - 32*scale);
        ctx.lineTo(this.x + 12*scale, this.y - 25*scale);
        ctx.lineTo(this.x + 20*scale, this.y - 10*scale);
        ctx.lineTo(this.x + 0*scale, this.y + 10*scale);
        ctx.lineTo(this.x + 0*scale, this.y + 20*scale);
        ctx.moveTo(this.x + 0*scale, this.y + 20*scale);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y + 32*scale, 5*scale, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.stroke();
    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }
}


//######論理ゲート(入力1、出力1)のクラス#############################

/**
 * NOTゲートのクラス
 */
class Not{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    turn(){
        if(this.in1.status){
            this.status = false;
        }else{
            this.status = true;
        }
        this.out1.forEach(function(value){
            value.turn();
        });
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x - 35*scale, this.y - 40*scale);
        ctx.lineTo(this.x, this.y + 40*scale);
        ctx.lineTo(this.x + 35*scale, this.y - 40*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    setIn(in1){
        if(this.in1 == null){
            this.in1 = in1;
        }else{
            return false;
        }
    }
    setOut(out1){
        if(this.out1 != null){
            this.out1.push(out1);
        }else{
            this.out1 = new Array(out1);
        }
    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}

/**
 * 論理ゲートの代わりにはてなマークを表示するクラス
 * 通電はしない
 */
class NotQuestion{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, out1){
        this.in1 = in1;
        in1.out1 = this;
        this.out1 = out1;
        out1.in1 = this;
    }
    turn(){
        this.status = false;
        this.out1.turn();
    }
    
    draw(ctx){
        ctx.strokeStyle = '#333';
        ctx.fillStyle = '#DDD';
        ctx.lineWidth = 3*scale;
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.arc(this.x, this.y, 45*scale, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.moveTo(this.x - 15*scale, this.y -  0*scale);
        ctx.lineTo(this.x - 20*scale, this.y - 10*scale);
        ctx.lineTo(this.x - 12*scale, this.y - 25*scale);
        ctx.lineTo(this.x -  0*scale, this.y - 32*scale);
        ctx.lineTo(this.x + 12*scale, this.y - 25*scale);
        ctx.lineTo(this.x + 20*scale, this.y - 10*scale);
        ctx.lineTo(this.x +  0*scale, this.y + 10*scale);
        ctx.lineTo(this.x +  0*scale, this.y + 20*scale);
        ctx.moveTo(this.x +  0*scale, this.y + 20*scale);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y + 32*scale, 5*scale, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.stroke();
    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}


class Line{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, out1){
    }
    turn(){
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x - 20*scale, this.y - 32*scale);
        ctx.lineTo(this.x - 20*scale, this.y + 32*scale);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x - 20*scale, this.y, 3*scale, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 20*scale, this.y);
        ctx.closePath();
        ctx.stroke();

    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}
class Arrow{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, out1){
    }
    turn(){
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x + 30*scale, this.y - 30*scale);
        ctx.lineTo(this.x - 30*scale, this.y - 30*scale);
        ctx.lineTo(this.x -  5*scale, this.y -  5*scale);
        ctx.lineTo(this.x - 35*scale, this.y + 25*scale);
        ctx.lineTo(this.x - 25*scale, this.y + 35*scale);
        ctx.lineTo(this.x +  5*scale, this.y +  0*scale);
        ctx.lineTo(this.x + 30*scale, this.y + 30*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}
class Trash{
    constructor(x, y){
        this.x = x*scale+dx;
        this.y = y*scale+dy;
        this.status = false;
        this.selected = false;
    }

    connect(in1, out1){
    }
    turn(){
    }
    
    draw(ctx){
        setColor(ctx, this.status);
        if(this.selected){ctx.strokeStyle=selectedStrokeStyle;}

        ctx.beginPath();
        ctx.moveTo(this.x -  0*scale, this.y - 45*scale);
        ctx.lineTo(this.x -  5*scale, this.y - 45*scale);
        ctx.lineTo(this.x -  5*scale, this.y - 28*scale);
        ctx.lineTo(this.x - 40*scale, this.y - 28*scale);
        ctx.lineTo(this.x - 40*scale, this.y - 20*scale);
        ctx.lineTo(this.x - 28*scale, this.y - 20*scale);
        ctx.lineTo(this.x - 28*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 28*scale, this.y + 45*scale);
        ctx.lineTo(this.x + 28*scale, this.y - 20*scale);
        ctx.lineTo(this.x + 40*scale, this.y - 20*scale);
        ctx.lineTo(this.x + 40*scale, this.y - 28*scale);
        ctx.lineTo(this.x +  5*scale, this.y - 28*scale);
        ctx.lineTo(this.x +  5*scale, this.y - 45*scale);
        ctx.lineTo(this.x +  0*scale, this.y - 45*scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    }

    hit(x, y){
        if(this.x - 35*scale < x && x < this.x + 35*scale && this.y - 45*scale < y && y < this.y + 45*scale){
            return true;
        }else{
            return false;
        }
    }

}

//######メイン関数（主処理）#############################


//＜初期処理・変数等の定義＞

$(function() {
    var a_canvas = $("#a_canvas")[0];    //WebページのHTMLからcanvas(描画エリア)を取得する。※おまじない
    var ctx = a_canvas.getContext("2d"); //canvas(描画エリア)の描画を制御するオブジェクト(コンテキスト)を取得する。※おまじない
    var fontSize = parseInt(24*scale);   //入力・出力の文字のサイズを定義
    ctx.font = "bold "+fontSize+"px Arial, meiryo, sans-serif" ; //入力・出力の文字のフォントを定義
    var counter = 0;   //通電時のチカチカアニメーションを制御するためのフレーム数のカウンタ
    
    var mx = 0; //マウスX座標
    var my = 0; //マウスY座標

//########
    var menu = new Array(
        new Arrow(100,1090),
        new InSwitch(220,1070,"入力"),
        new And(340,1090),
        new Line(460,1090),
        new Trash(580,1090)
    );

//●###＜論理ゲート等の配置を定義＞###
    var input;
    var output;
    var lead;
    var branch;
    var reset = function(){
        input = new Array(  //入力パーツの電球
        );
        output = new Array( //出力パーツの電球
        );
        semiconductor = new Array( //論理ゲートの配置
        );
        lead = new Array( //導線の配置
        );
        branch = new Array( //導線の分岐点の配置
        );
    }

    reset();

//●###＜論理ゲート等の接続を定義＞###

//＜毎フレーム行う描画に関する処理＞

    var anime = function(){  //animeという名前で関数を定義(後に定期的にanime関数を呼び出す制御を行う)

        // canvasを消去する
        ctx.clearRect(0, 0, a_canvas.width, a_canvas.height);
        ctx.fillStyle = '#669';
        ctx.fillRect(0, 0, a_canvas.width, a_canvas.height-160*scale);
        ctx.fillStyle = '#396';
        ctx.fillRect(0, a_canvas.height-160*scale, a_canvas.width, a_canvas.height);
        // 以降、描画する処理
        
        //通電時の線の色・太さ・塗りつぶしの色をanimeのフレームカウンタに応じて設定
        //ここではグローバル変数に設定だけして、あとで通電か否かを判定しながら
        //各クラスのdrawメソッドの中でcanvasのコンテキストに設定していく。
        //スピード調整のためカウンタ/2で判定、2フレームごとに色が変わる
        if(parseInt(counter/2) % 4 == 1){       //1フレーム目(カウンタの剰余で処理を分ける)
            trueStrokeStyle = '#DD0';           //線の色
            trueFillStyle = '#FFC';             //塗りつぶしの色
            trueLineWidth = 4*scale;            //線の太さ
        }else if(parseInt(counter/2) % 4 == 2){ //2フレーム目
            trueStrokeStyle = '#EE0';
            trueFillStyle = '#FFC';
            trueLineWidth = 5*scale;
        }else if(parseInt(counter/2) % 4 == 3){ //3フレーム目
            trueStrokeStyle = '#FF0';
            trueFillStyle = '#FFC';
            trueLineWidth = 6*scale;
        }else{                                  //4フレーム目
            trueStrokeStyle = '#EE0';
            trueFillStyle = '#EEC';
            trueLineWidth = 5*scale;
        }
        
        //メニュー部の半導体パーツの描画
        menu.forEach(function(value){
            value.draw(ctx);
        });
        //導線すべてに対して描画処理(drawメソッド)を命令
        lead.forEach(function(value){
            value.draw(ctx);
        });
        //導線の分岐点すべてに対して描画処理(drawメソッド)を命令
        branch.forEach(function(value){
            value.draw(ctx);
        });
        //論理ゲートすべてに対して描画処理(drawメソッド)を命令
        semiconductor.forEach(function(value){
            value.draw(ctx);
        });
        //入力電球すべてに対して描画処理(drawメソッド)を命令
        input.forEach(function(value){
            value.draw(ctx);
        });
        //出力電球すべてに対して描画処理(drawメソッド)を命令
        output.forEach(function(value){
            value.draw(ctx);
        });
        if(selectedParts != null){
            selectedParts.draw(ctx);
        }
        //最後にデバッグメッセージの描画
        ctx.fillText(debug_msg,50,100);
        ctx.fillText(selectA, 20,50);
        ctx.fill();
        counter++;
    }
    
    //setInterval() を使って、設定した繰り返しの待ち時間の後にanime関数を呼び出す。
    //anime()を呼び出す処理をanime関数最後に入れることで、設定時間ごとに描画が行われる。
    setInterval(anime, 30);

    
    
//＜マウスやタップの操作に対する処理＞

    var dragging = false;
    var selectedParts = null;

    //マウスがクリックされたときの処理
    a_canvas.onmousedown = function(event) {

        var noObj = true;
        
        //入力電球の当たり判定
        input.forEach(function(value){
            if(value.hit(mx, my)){
                if(mode instanceof Line){
                    if(selectA == null){
                        selectA = value;
                    }else if(selectA != value){
                        selectA = value;
                    }
                }else{
                    value.turn();
                }
                selectedParts = value;
                noObj = false;
            } //クリックされた入力電球のturnメソッドを呼び出して通電状態を更新
            
        });
        //論理ゲートの当たり判定
        /*for(var i=0; i<semiconductor.length; i++){  //すべての配列の要素に対して処理していく
            if(semiconductor[i].hit(mx, my)){       //当たり判定
            noObj = false;
            }
        };*/
        semiconductor.forEach(function(value){
            if(value.hit(mx,my)){
                if(mode instanceof Line){
                    if(selectA == null){
                        selectA = value;
                    }else if(selectA != value){
                        if(value.in1 == null || value.in2 == null){
                            lead.push( new Lead(selectA, value));
                        }
                        selectA = null;
                    }
                }
                selectedParts = value;
                noObj = false;
            }
        });
        output.forEach(function(value){
            if(value.hit(mx,my)){
                if(mode instanceof Line){
                    if(selectA == null){
//                      selectA = value;
                    }else if(selectA != value){
                        lead.push(new Lead(selectA, value));
                        selectA = null;
                        console.log(selectA);
                    }
                }
                selectedParts = value;
                noObj = false;
            }
        });
        //メニューパーツの当たり判定
        menu.forEach(function(value, index){
            if(value.hit(mx, my)){
                if(value.status){
                    if(value instanceof And){ menu.splice(index,1,new Or(value.x/scale-dx/scale, value.y/scale-dy/scale)); }
                    else if(value instanceof Or){ menu.splice(index,1,new Xor(value.x/scale-dx/scale, value.y/scale-dy/scale)); }
                    else if(value instanceof Xor){ menu.splice(index,1,new Not(value.x/scale-dx/scale, value.y/scale-dy/scale)); }
                    else if(value instanceof Not){ menu.splice(index,1,new And(value.x/scale-dx/scale, value.y/scale-dy/scale)); }
                    if(value instanceof InSwitch){ menu.splice(index,1,new OutSwitch(value.x/scale-dx/scale, value.y/scale-dy/scale,"出力")); }
                    else if(value instanceof OutSwitch){ menu.splice(index,1,new InSwitch(value.x/scale-dx/scale, value.y/scale-dy/scale,"入力")); }
                    menu[index].status = true;
                    mode = menu[index];
                }else{
                    value.status = true;
                    mode = value;
                }
                noObj = false;
                menu.forEach(function(value2, index2){
                    value2.status = false;
                });
                mode.status = true;
            }else{
            }
        });
        //入力電球や論理ゲートは操作で切り替えられるということを明示したいため、
        //カーソルが当たっている場合は選択されているとし色を変える
        //そのための当たり判定と選択状態の設定を行う処理。
        input.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        semiconductor.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        
        
        if(!dragging && noObj){
            if(mode instanceof Line){
                
            }else if(mode instanceof InSwitch){
                input.push(new InSwitch(mx/scale-dx/scale, my/scale-dy/scale,"入力"));
            }else if(mode instanceof OutSwitch){
                output.push(new OutSwitch(mx/scale-dx/scale, my/scale-dy/scale,"出力"));
            }else if(mode instanceof And){
                semiconductor.push(new And(mx/scale-dx/scale, my/scale-dy/scale));
            }else if(mode instanceof Or){
                semiconductor.push(new Or(mx/scale-dx/scale, my/scale-dy/scale));
            }else if(mode instanceof Xor){
                semiconductor.push(new Xor(mx/scale-dx/scale, my/scale-dy/scale));
            }else if(mode instanceof Not){
                semiconductor.push(new Not(mx/scale-dx/scale, my/scale-dy/scale));
            }
        }

        dragging = true;
        
    };
    
    //マウスカーソルが動いたときの処理
    a_canvas.onmousemove = function(event) {
        // Canvas上のマウス座標を保存する
        var bb = a_canvas.getBoundingClientRect();
        mx = (event.clientX - bb.left);
        my = (event.clientY - bb.top);
        
        //入力電球や論理ゲートは操作で切り替えられるということを明示したいため、
        //カーソルが当たっている場合は選択されているとし色を変える
        //そのための当たり判定と選択状態の設定を行う処理。
        input.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        semiconductor.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        //メニューパーツの当たり判定
        menu.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        
        if(dragging){
            if(selectedParts != null){
                selectedParts.x = mx;
                selectedParts.y = my;
            }
        }
    };
    a_canvas.onmouseup = function(event) {
        dragging = false; // ドラッグ終了
        if(selectedParts != null){
            semiconductor.push(selectedParts);
            selectedParts = null;
        }
    };
});

