//グローバル展開
phina.globalize();

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
const ASSETS = {
    "image": {
        "buro": "./assets/image/buropiyo.png",
        "mero": "./assets/image/meropiyo.png",
        "mika": "./assets/image/mikapiyo.png",
        "nasu": "./assets/image/nasupiyo.png",
        "take": "./assets/image/takepiyo.png",
        "toma": "./assets/image/tomapiyo.png"
    }
};
const ENEMY_ASSETS = [
    "buro", "mero", "mika", "nasu", "take"
];

let enemyCount = 0;

phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // X/Yそれぞれ40分割したグリッドで置き換え
        this.gridX = Grid(SCREEN_WIDTH, 40);
        this.gridY = Grid(SCREEN_HEIGHT, 40);
        this.backgroundColor = 'black';


        this.player = Player(
            this.gridX.center(), this.gridY.span(37)).addChildTo(this);

        // 複数の敵を登録する対象
        this.enemyGroup = EnemyGroup().addChildTo(this);
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 5; y++) {
                Enemy(this.gridX.span(10 + (x * 2)), this.gridY.span(3 + (y * 4)), ENEMY_ASSETS[Math.floor(Math.random() * ENEMY_ASSETS.length)]).addChildTo(this.enemyGroup);
                enemyCount++;
            }
        }


        // 敵が発射したミサイルを登録する対象
        this.missileGroup = DisplayElement().addChildTo(this);

    },
    update: function (app) {
        // ミサイルと弾の当たり判定
        if (this.player.bullet != null) {
            this.missileGroup.children.some(missile => {
                if (missile.hitTestElement(this.player.bullet)) {
                    missile.flare('hit');
                    this.player.bullet.flare('hit');
                }
            })
        }
        // 弾と敵の当たり判定
        if (this.player.bullet != null) {
            this.enemyGroup.children.some(enemy => {
                if (enemy.hitTestElement(this.player.bullet)) {
                    // 直接それぞれのメソッドを呼ばずにイベントで対応させる。
                    enemy.flare('hit');
                    this.player.bullet.flare('hit');

                    return true;
                }

                return false;
            })
        }
        // ミサイルとプレイヤーの当たり判定
        this.missileGroup.children.some(missile => {
            if (missile.hitTestElement(this.player)) {
                missile.flare('hit');
                this.player.flare('hit');
            }
        })

        if (enemyCount <= 0){
            alert("くりあー");
        }
    }
});

phina.define('Player', {
    superClass: 'Sprite',
    init: function (x, y) {
        this.superInit('toma', 64, 64);
        this.setFrameIndex(10, 64, 64);
        this.x = x;
        this.y = y;
        this.SPEED = 5;
        this.bullet = null;
    },

    update: function (app) {
        const key = app.keyboard;

        if (key.getKey('left')) {
            this.x -= this.SPEED;
            if (this.left < 0) {
                this.left = 0;
            }
        }
        if (key.getKey('right')) {
            this.x += this.SPEED;
            if (this.right > SCREEN_WIDTH) {
                this.right = SCREEN_WIDTH;
            }
        }

        // 弾は同時に1発しか発射できない仕様なので、bulletがnullのときにスペースキー押されていたら発射
        if (this.bullet == null && key.getKey('space')) {
            this.bullet = Bullet(this.x, this.top).addChildTo(this.parent);
        }

        // すでにbulletが無効(isInvalid==true)ならnullにする
        if (this.bullet != null && this.bullet.isInvalid) {
            this.bullet = null;
        }

        if (this.top < Enemy.bottom) {
            this.flare('hit');
        }
    },

    onhit: function () {
        this.remove();
        alert('げーむおーばー')
    }

});

phina.define('Bullet', {
    superClass: 'RectangleShape',
    init: function (x, y) {
        this.superInit({
            width: 3,
            height: 15,
            fill: 'white',
            stroke: null,
        });
        this.x = x;
        this.y = y;
        this.isInvalid = false;
        this.SPEED = 5;
    },

    // 弾を画面上から消して無効にするイベントリスナ(なにかに当たった)
    onhit: function () {
        this.remove();
        this.isInvalid = true;
    },

    update: function () {
        this.y -= this.SPEED;
        if (this.bottom < 0) {
            this.flare('hit');
        }
    }
});

phina.define('Enemy', {
    superClass: 'Sprite',
    init: function (x, y, image) {
        this.superInit(image, 64, 64);
        this.setFrameIndex(7, 64, 64);
        this.x = x;
        this.y = y;
    },

    // 敵を画面上から消すイベントリスナ(倒された)
    onhit: function () {
        this.remove();
        enemyCount--;
    },
});

phina.define('Missile', {
    superClass: 'PathShape',

    init: function (x, y) {
        this.superInit({
            // ミサイルの見た目(相対パスで指定)
            paths: [
                {x: 0, y: 0},
                {x: 3, y: 2},
                {x: -3, y: 4},
                {x: 3, y: 6},
                {x: -3, y: 8},
                {x: 3, y: 10},
                {x: -3, y: 12},
                {x: 3, y: 14},
                {x: 0, y: 16},
            ],
            fill: null,
            // ミサイルの色
            stroke: 'orangered',
            lineJoin: 'miter',
            // ミサイルの線の太さ
            strokeWidth: 1,
        });
        this.x = x;
        this.y = y;
        // ミサイルの移動速度
        this.SPEED = 4;
    },
    onhit: function () {
        this.remove();
    },

    update: function () {
        this.y += this.SPEED;
        if (this.top > SCREEN_HEIGHT) {
            this.flare('hit');
        }
    }
});

phina.define('EnemyGroup', {
    superClass: 'DisplayElement',
    init: function () {
        this.superInit();
        this.time = 0;
        this.missileTime = 0;                //追加
        this.interval = 200;
        this.direction = 1;
        this.enemyDown = false;             //敵を１段下げるときに必要な条件式
        this.missileInerval  = 1000;        //敵がミサイルを打つまでのインターバル
    },
    update: function (app) {
        // deltaTimeを加算していって経過時間を計る
        this.time += app.deltaTime;
        this.missileTime += app.deltaTime;
        const scene = this.parent;

        let right = 0;
        let left = scene.gridX.columns;


        if (this.time / this.interval >= 1) {
            this.children.forEach(enemy => {
                enemy.moveBy(scene.gridX.unit() * this.direction, 0);
                // 全体の右端のポジションを計算
                right = Math.max(right, enemy.x / scene.gridX.unit());
                // 全体の左端のポジションを計算
                left = Math.min(left, enemy.x / scene.gridX.unit());

            });
            this.time -= this.interval;
        }

        //ミサイル発射処理
        if (this.missileTime / this.missileInerval >= 1){
            this.children.forEach(enemy => {

                let random = Math.floor(Math.random() * 100)

                let flagNum = random;

                if (flagNum <= 3){
                    Missile(enemy.x, enemy.bottom).addChildTo(scene.missileGroup);
                }
            });

            this.missileTime = 0;
        }


        // 移動の向きを変更するタイミング
        if (this.direction > 0 && right >= 38
            || this.direction < 0 && left <= 2) {

            this.enemyDown = true;

            //下に１段移動
            if(this.enemyDown == true){
                this.children.forEach(enemy => {
                    enemy.moveBy(0, scene.gridY.unit() * 1)
                })
                this.enemyDown = false;
            }

            if(this.enemyDown == false){
                this.direction = -this.direction
            }
        }
    }
});

phina.main(() => {
    const app = GameApp({
        title: "インベーダー",
        fps: 60,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
    });

    app.run();
});
