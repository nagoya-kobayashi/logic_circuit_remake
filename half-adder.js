/**
論理回路シミュレーター
*/

//######グローバル変数宣言#########################
var scale = 0.65; //canvas領域への配置・描画時の座標に対する拡大縮小率
var dx = -100;   //canvas領域への配置・描画時の座標に対するx軸方向の調整
var dy = 20;     //canvas領域への配置・描画時の座標に対するy軸方向の調整
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
    constructor(sx, sy, ex, ey){
        this.sx = sx*scale+dx; //導線の開始位置のx座標
        this.sy = sy*scale+dy; //導線の開始位置のy座標
        this.ex = ex*scale+dx; //動線の終点位置のx座標
        this.ey = ey*scale+dy; //動線の終点位置のy座標
        this.status = false;   //通電状態(trueで通電)
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
        setColor(ctx, this.status);
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.lineTo(this.ex, this.ey);
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
        this.out1.turn();
        this.out2.turn();
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
        this.y = y*scale+dy;
        this.label = label;
        this.status = false;
        this.selected = false;
    }

    connect(out1){
        this.out1 = out1;
        out1.in1 = this;
    }
    
    turn(){
        if(this.status){
            this.status = false;
        }else{
            this.status = true;
        }
        this.out1.turn();
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
        this.y = y*scale+dy;
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
        this.out1.turn();
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
        this.out1.turn();
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
        this.out1.turn();
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
        this.out1.turn();
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

/**
 * 半加算器
 */
class HalfAddr{
    constructor(x, y){
        this.semiconductor = new Array( //論理ゲートの配置
            new Question(x-100,y+270),
            new Question(x+100,y+270),
        );
        this.lead = new Array( //導線の配置
            new Lead(x-100, y+130, x-100, y+180),//0
            new Lead(x-100, y+180, x-100, y+270),
            new Lead(x-100, y+180, x+80,  y+180),
            new Lead(x+80,  y+180, x+80,  y+270),
            
            new Lead(x+100, y+130, x+100, y+200),//4
            new Lead(x+100, y+200, x+100, y+270),
            new Lead(x+100, y+200, x-80,  y+200),
            new Lead(x-80,  y+200, x-80,  y+270),
            
            
            new Lead(x-90,  y+270, x-90,  y+700),//8
            
            new Lead(x+100, y+270, x+100, y+700),//9

        );
        this.branch = new Array( //導線の分岐点の配置
            new Branch(x-100,y+180),
            new Branch(x+100,y+200),
        );
        this.branch[0].connect(this.lead[0],this.lead[1],this.lead[2]);
        this.lead[2].connect(this.lead[3]);

        this.branch[1].connect(this.lead[4],this.lead[5],this.lead[6]);
        this.lead[6].connect(this.lead[7]);
        
        this.semiconductor[0].connect(this.lead[1],this.lead[7],this.lead[8]);
        this.semiconductor[1].connect(this.lead[5],this.lead[3],this.lead[9]);
    }

    connect(in1, in2, c, s){
        in1.connect(this.lead[0]);
        in2.connect(this.lead[4]);
        this.lead[8].connect(c);
        this.lead[9].connect(s);
    }
    connect_out_c(obj){
        this.lead[8].connect(obj);
    }
    get_out_c(){
        return this.lead[8];
    }
    connect_out_s(obj){
        this.lead[9].connect(obj);
    }
    get_out_s(){
        return this.lead[9];
    }
    connect_in(cin, x0, x1){
        cin.connect(this.lead[0]);
        x0.connect(this.lead[4]);
        x1.connect(this.lead[12]);
    }
    turn(){
    }
    hit(mx, my){
        for(var i=0; i<this.semiconductor.length; i++){  //すべての配列の要素に対して処理していく
            if(this.semiconductor[i].hit(mx, my)){       //当たり判定
                if(this.semiconductor[i] instanceof Question){ //当たったのが？オブジェクトなら
                    var w = this.semiconductor[i];             //？オブジェクトをいったん退避し、
                    this.semiconductor[i] = new And(w.x/scale-dx/scale, w.y/scale-dy/scale);  //同一座標にANDオブジェクトを生成
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);  //接続をしなおして、
                    this.semiconductor[i].turn();   //通電状態も更新する
                }else if(this.semiconductor[i] instanceof And){ //当たったのがANDオブジェクトなら・・・以下、同様
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Or(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Or){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Xor(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Xor){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Question(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Not){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new NotQuestion(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof NotQuestion){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Not(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.out1);
                    this.semiconductor[i].turn();
                }
            }
        };
    }
    
    draw(ctx){
        //導線すべてに対して描画処理(drawメソッド)を命令
        this.lead.forEach(function(value){
            value.draw(ctx);
        });
        //導線の分岐点すべてに対して描画処理(drawメソッド)を命令
        this.branch.forEach(function(value){
            value.draw(ctx);
        });
        //論理ゲートすべてに対して描画処理(drawメソッド)を命令
        this.semiconductor.forEach(function(value){
            value.draw(ctx);
        });
    }
}


/**
 * 全加算器
 */
class FullAddr{
    constructor(x, y){
        this.semiconductor = new Array( //論理ゲートの配置
            new Question(x-160, y+260),
            new Question(x-30,  y+260),
            new Question(x-20,  y+430),
            new Question(x+120, y+430),
            new Question(x-150, y+580)
        );
        this.lead = new Array( //導線の配置
            new Lead(x-170, y+130, x-170, y+170  ),//0
            new Lead(x-170, y+170, x-170, y+240  ),
            new Lead(x-170, y+170, x-40,  y+170  ),
            new Lead(x-40,  y+170, x-40,  y+240  ),

            new Lead(x-20,  y+130, x-20,  y+190  ),//4
            new Lead(x-20,  y+190, x-20,  y+270  ),
            new Lead(x-20,  y+190, x-150, y+190  ),
            new Lead(x-150, y+190, x-150, y+240  ),

            new Lead(x-30,  y+240, x-30,  y+340  ),//8
            new Lead(x-30,  y+340, x-30,  y+430  ),
            new Lead(x-30,  y+340, x+110, y+340  ),
            new Lead(x+110, y+340, x+110, y+430  ),

            new Lead(x+190, y+360, x+130, y+360  ),//12
            new Lead(x+130, y+360, x+130, y+430  ),
            new Lead(x+130, y+360, x-10,  y+360  ),
            new Lead(x-10,  y+360, x-10,  y+430  ),

            new Lead(x-160, y+240, x-160, y+550  ),//16

            new Lead(x-20,  y+430, x-20,  y+500  ),//17
            new Lead(x-20,  y+500, x-140, y+500  ),
            new Lead(x-140, y+500, x-140, y+550  ),

            new Lead(x+120, y+430, x+120, y+700  ),//20

            new Lead(x-150, y+550, x-150, y+700  ),//21

        );
        this.branch = new Array( //導線の分岐点の配置
            new Branch(x-170, y+170),
            new Branch(x-20,  y+190),
            new Branch(x-30,  y+340),
            new Branch(x+130, y+360),
        );
        this.branch[0].connect(this.lead[0],this.lead[1],this.lead[2]);
        this.branch[1].connect(this.lead[4],this.lead[5],this.lead[6]);
        this.branch[2].connect(this.lead[8],this.lead[9],this.lead[10]);
        this.branch[3].connect(this.lead[12],this.lead[13],this.lead[14]);

        this.lead[2].connect(this.lead[3]);
        this.lead[6].connect(this.lead[7]);
        this.lead[10].connect(this.lead[11]);
        this.lead[14].connect(this.lead[15]);
        this.lead[17].connect(this.lead[18]);
        this.lead[18].connect(this.lead[19]);
        
        this.semiconductor[0].connect(this.lead[1],this.lead[7],this.lead[16]);
        this.semiconductor[1].connect(this.lead[3],this.lead[5],this.lead[8]);
        this.semiconductor[2].connect(this.lead[9],this.lead[15],this.lead[17]);
        this.semiconductor[3].connect(this.lead[11],this.lead[13],this.lead[20]);
        this.semiconductor[4].connect(this.lead[16],this.lead[19],this.lead[21]);
    }

    connect(cin, x0, x1, c, s){
        cin.connect(this.lead[0]);
        x0.connect(this.lead[4]);
        x1.connect(this.lead[12]);
        this.lead[21].connect(c);
        this.lead[20].connect(s);
    }
    connect_out_c(obj){
        this.lead[21].connect(obj);
    }
    get_out_c(){
        return this.lead[21];
    }
    connect_out_s(obj){
        this.lead[20].connect(obj);
    }
    get_out_s(){
        return this.lead[20];
    }
    connect_in(cin, x0, x1){
        cin.connect(this.lead[0]);
        x0.connect(this.lead[4]);
        x1.connect(this.lead[12]);
    }
    turn(){
    }
    hit(mx, my){
        for(var i=0; i<this.semiconductor.length; i++){  //すべての配列の要素に対して処理していく
            if(this.semiconductor[i].hit(mx, my)){       //当たり判定
                if(this.semiconductor[i] instanceof Question){ //当たったのが？オブジェクトなら
                    var w = this.semiconductor[i];             //？オブジェクトをいったん退避し、
                    this.semiconductor[i] = new And(w.x/scale-dx/scale, w.y/scale-dy/scale);  //同一座標にANDオブジェクトを生成
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);  //接続をしなおして、
                    this.semiconductor[i].turn();   //通電状態も更新する
                }else if(this.semiconductor[i] instanceof And){ //当たったのがANDオブジェクトなら・・・以下、同様
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Or(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Or){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Xor(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Xor){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Question(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.in2, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof Not){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new NotQuestion(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.out1);
                    this.semiconductor[i].turn();
                }else if(this.semiconductor[i] instanceof NotQuestion){
                    var w = this.semiconductor[i];
                    this.semiconductor[i] = new Not(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    this.semiconductor[i].connect(w.in1, w.out1);
                    this.semiconductor[i].turn();
                }
            }
        };
    }
    
    draw(ctx){
        //導線すべてに対して描画処理(drawメソッド)を命令
        this.lead.forEach(function(value){
            value.draw(ctx);
        });
        //導線の分岐点すべてに対して描画処理(drawメソッド)を命令
        this.branch.forEach(function(value){
            value.draw(ctx);
        });
        //論理ゲートすべてに対して描画処理(drawメソッド)を命令
        this.semiconductor.forEach(function(value){
            value.draw(ctx);
        });
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



//●###＜論理ゲート等の配置を定義＞###
    var input_x = new Array();
    var input_y = new Array();
    var output_s = new Array();
    var output_c = null;
    var input = new Array(  //入力パーツの電球
        new InSwitch(300,80, "入力A"),
        new InSwitch(500,80, "入力B")
    );
    var output = new Array( //出力パーツの電球
        new OutSwitch(300,700, "出力C"),
        new OutSwitch(500,700, "出力S")
    );
    input_x.push(input[0]);
    input_y.push(input[1]);
    output_s.push(output[1]);
    output_c = output[0];
    var semiconductor = new Array( //論理ゲートの配置
        new Question(300,270),
        new Question(500,270),
    );

    var lead = new Array( //導線の配置
        
        new Lead(300,130,300,180),//0
        new Lead(300,180,300,270),
        new Lead(300,180,480,180),
        new Lead(480,180,480,270),
        
        new Lead(500,130,500,200),//4
        new Lead(500,200,500,270),
        new Lead(500,200,320,200),
        new Lead(320,200,320,270),
        
        
        new Lead(310,270,310,700),//8
        
        new Lead(500,270,500,700),//9

    );
    var branch = new Array( //導線の分岐点の配置
        new Branch(300,180),
        new Branch(500,200),
    );


    
//●###＜論理ゲート等の接続を定義＞###

    input[0].connect(lead[0]);
    input[1].connect(lead[4]);
    
    
    branch[0].connect(lead[0],lead[1],lead[2]);
    lead[2].connect(lead[3]);

    branch[1].connect(lead[4],lead[5],lead[6]);
    lead[6].connect(lead[7]);
    
    semiconductor[0].connect(lead[1],lead[7],lead[8]);
    semiconductor[1].connect(lead[5],lead[3],lead[9]);

    output[0].connect(lead[8]);
    output[1].connect(lead[9]);
    
    input.forEach(function(value){
        value.turn();
        value.turn();
    });
    
//＜毎フレーム行う描画に関する処理＞

    var anime = function(){  //animeという名前で関数を定義(後に定期的にanime関数を呼び出す制御を行う)

        // canvasを消去する
        ctx.clearRect(0, 0, a_canvas.width, a_canvas.height);
        
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
        //debug_msg="hoge";
        //最後にデバッグメッセージの描画
        ctx.fillText(debug_msg,50,100);
        ctx.fill();
        counter++;

        var x=0;
        var y=0;
        var s=0;
        var xs="";
        var ys="";
        var ss="";
        for(var i=0; i<input_x.length; i++){
            if(input_x[i].status){
                x += 2**i;
                xs = "1"+xs;
            }else{
                xs = "0"+xs;
            }
        }
        for(var i=0; i<input_y.length; i++){
            if(input_y[i].status){
                y += 2**i;
                ys = "1"+ys;
            }else{
                ys = "0"+ys;
            }
        }
        for(var i=0; i<output_s.length; i++){
            if(output_s[i].status){
                s += 2**i;
                ss = "1"+ss;
            }else{
                ss = "0"+ss;
            }
        }
        if(output_c.status){
            s += 2**output_s.length;
            ss = "1"+ss;
        }else{
            ss = "0"+ss;
        }
        ctx.fillText(" 2進数：a["+xs+"]+b["+ys+"]=cs["+ss+"]",20,560);
        ctx.fillText("10進数：a["+x+"]+b["+y+"]=cs["+s+"]",20,580);
        ctx.fill();

    }
    
    //setInterval() を使って、設定した繰り返しの待ち時間の後にanime関数を呼び出す。
    //anime()を呼び出す処理をanime関数最後に入れることで、設定時間ごとに描画が行われる。
    setInterval(anime, 30);

    
    
//＜マウスやタップの操作に対する処理＞

    //マウスがクリックされたときの処理
    a_canvas.onmousedown = function(event) {
        
        
        //入力電球の当たり判定
        input.forEach(function(value){
            if(value.hit(mx, my)){value.turn();} //クリックされた入力電球のturnメソッドを呼び出して通電状態を更新
        });
        //論理ゲートの当たり判定
        //クリックされた論理ゲートは？⇒AND⇒OR⇒XOR⇒？、？⇒NOT⇒？で切り替わる
        //これは配列上のオブジェクトを作り直すことによって実現している。
        for(var i=0; i<semiconductor.length; i++){  //すべての配列の要素に対して処理していく
            if(semiconductor[i].hit(mx, my)){       //当たり判定
                if(semiconductor[i] instanceof Question){ //当たったのが？オブジェクトなら
                    var w = semiconductor[i];             //？オブジェクトをいったん退避し、
                    semiconductor[i] = new And(w.x/scale-dx/scale, w.y/scale-dy/scale);  //同一座標にANDオブジェクトを生成
                    semiconductor[i].connect(w.in1, w.in2, w.out1);  //接続をしなおして、
                    semiconductor[i].turn();   //通電状態も更新する
                }else if(semiconductor[i] instanceof And){ //当たったのがANDオブジェクトなら・・・以下、同様
                    var w = semiconductor[i];
                    semiconductor[i] = new Or(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    semiconductor[i].connect(w.in1, w.in2, w.out1);
                    semiconductor[i].turn();
                }else if(semiconductor[i] instanceof Or){
                    var w = semiconductor[i];
                    semiconductor[i] = new Xor(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    semiconductor[i].connect(w.in1, w.in2, w.out1);
                    semiconductor[i].turn();
                }else if(semiconductor[i] instanceof Xor){
                    var w = semiconductor[i];
                    semiconductor[i] = new Question(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    semiconductor[i].connect(w.in1, w.in2, w.out1);
                    semiconductor[i].turn();
                }else if(semiconductor[i] instanceof Not){
                    var w = semiconductor[i];
                    semiconductor[i] = new NotQuestion(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    semiconductor[i].connect(w.in1, w.out1);
                    semiconductor[i].turn();
                }else if(semiconductor[i] instanceof NotQuestion){
                    var w = semiconductor[i];
                    semiconductor[i] = new Not(w.x/scale-dx/scale, w.y/scale-dy/scale);
                    semiconductor[i].connect(w.in1, w.out1);
                    semiconductor[i].turn();
                }
            }
        };
        
        //入力電球や論理ゲートは操作で切り替えられるということを明示したいため、
        //カーソルが当たっている場合は選択されているとし色を変える
        //そのための当たり判定と選択状態の設定を行う処理。
        input.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });
        semiconductor.forEach(function(value){
            if(value.hit(mx, my)){value.selected = true;}else{value.selected = false;}
        });

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
    };

    $('#check-button').on('click', e => {
        
        check(0);
        
    });

    function check(n) {
        console.log("処理開始");
        if(n==2**2){
            alert("クリアです！！！おめでとう！！！");
            return;
        }
        
        var x = Math.floor( n / (2**1)) ;
        var y = n % (2**1);
        var s = 0;

        var wx = x;
        var wy = y;
        
        for(var i=0; i<input_x.length; i++){
            if(wx % 2 == 1){
                input_x[i].status = true;
            }else{
                input_x[i].status = false;
            }
            wx = Math.floor(wx/2);
        }
        for(var i=0; i<input_y.length; i++){
            if(wy % 2 == 1){
                input_y[i].status = true;
            }else{
                input_y[i].status = false;
            }
            wy = Math.floor(wy/2);
        }
        input.forEach(function(value){
            value.turn();
            value.turn();
        });
        for(var i=0; i<output_s.length; i++){
            if(output_s[i].status){
                s += 2**i;
            }
        }
        if(output_c.status){
            s += 2**output_s.length;
        }
        console.log(x,"+",y,"=",s);
        if(x+y == s){
            setTimeout(check, 2000, n+1);
        }else{
            alert(x+"＋"+y+"≠"+s);
        }
    }

});

